"use strict";

exports.Filter = Filter;

var util = await require('util')
const vm = await require('vm' );
const sack = await require('sack' );

var text = null;
var commandStream = null;
var labelStream = null;

if( "undefined" === typeof Λ ) {
    // this is a sandbox; and we don't have real entity support.
    var Entity = require( '../Entity/entity.js');
    console.log( "Did require Entity:", Entity );
    Entity.netRequire.provide( "shell.js", exports );
    Entity.Sentience = exports;
     text = require( "../../org.d3x0r.common/text.js");
     commandStream = require('../command_stream_filter/command.js')
     labelStream = require( "../command_stream_filter/label_insert.js" );
} else   {
    Entity = global;
    async function asyncInit() {
       text = await require( "../../org.d3x0r.common/text.js");
       commandStream = await require('../command_stream_filter/command.js')
       labelStream = await require( "../command_stream_filter/label_insert.js" );
        //sack = await require( 'sack.vfs');
        //console.log( "What did sack get:", sack );
        //Promise.resolve( exports );
    }
    return asyncInit();
    //process.stdout.write( util.format( "This should be an entity sandbox:", global ));
}

//Entity.

//exports.


function Filter( e ) {

    if( !e ) throw new Error( "invalid sandbox passed to filter" );
    var entity = e.entity;
    //console.trace( "This should be an entity?", e );
    //const thread = e.wake();  // this is already awake.
    function output(...args) {
        return filter.push( util.format.apply(util,args));
    }
    //console.log( "Path resolves...", require.resolve( "./startup.js" ) );
    var filter = commandStream.Filter();
    {
        filter.RegisterCommand( "unhandled", {}, (line)=>{
            e.run(line)
        })
        filter.RegisterCommand( "help", 
            { description:"get a list of commands? "},
            (args)=>{
                var out = "";
                //console.log( filter );
                filter.forEach( (command,id)=>{
                    out += command.opts.helpText + " - " + command.opts.description + "\n";
                } )
                output( out );
        } );
        filter.RegisterCommand( "create", 
            { description:"create an entity <name <description>> "},
            (args)=>{
            	//console.trace( args )
                if( !args[0] ) return;
                var desc = "nondescript."
                if( args.length > 1 )  
                    if( args[1].text==='"' || args[1].text==="'" ) {
                        if( args[1].indirect )
                            desc = args[1].indirect.toString();
                        else
                            desc = args[1].toString(); 
                    }else desc = args[1].toString();
                    args[0].spaces = 0;
                    //console.log( "create for ", entity, args[0].toString(), desc )
                    create(  args[0].toString(), desc ).then( (e)=>{
                        // new entity exists now... (feedback created?)
                        e.name.then( name=>output( "Created:", name  ));
                    } );
                } );
        filter.RegisterCommand( "script", 
            { description:"load a file and run said code (javascript)"},
            (args)=>{
                    args.forEach( arg=> {
                        Script( entity, arg );
                    })
                } );
        filter.RegisterCommand( "exec"
            , { description:"run some javascript code in entity entity"}
            , (args)=> Exec( entity, args ) );
        filter.RegisterCommand( "tell"
            , {min:3,max:0,description:"tell <entity> <command>"}
            , (args)=> Tell( entity, args ) );
        filter.RegisterCommand( "ainv"
            , {min:0,max:0,description:"Without parameters, show objects that are internally visible, and attached"}
            , (args)=> Inventory( entity, args ) );
        filter.RegisterCommand( "inv"
            , {min:0,max:0,description:"Without parameters, show objects that are internally visible, and attached"}
            , (args)=> Inventory( entity, args ) );
        filter.RegisterCommand( "look"
            , {min:0,max:0,description:"Without parameters, show objects that are externally visible."}
            , (args)=> Look( entity, args ) 
        );
        filter.RegisterCommand( "grab"
            , {min:3,max:0,description:"grab <entity>"}
            , (args)=> Grab( entity, args ) );
        filter.RegisterCommand( "lose"
            , {min:3,max:0,description:"lose <contained entity> <into> <into-entity>; lose a contained item into another container(room)."}
            , (args)=> Lose( entity, args ) );
        filter.RegisterCommand( "drop"
            , {min:3,max:0,description:"drop <attached-entity> <into> <into-entity>; drop a held/attached item into another container(room)."}
            , (args)=> Drop( entity, args ) );
        filter.RegisterCommand( "store"
            , {min:3,max:0,description:"store <attached-entity> <in> <into-entity>; puts an attached entity into another entity (self)."}
            , (args)=> Store( entity, args ) );
        filter.RegisterCommand( "attach"
            , {min:3,max:0,description:"attach <entity> <to> <to-Entity>; attaches two entites together."}
            , (args)=> Attach( entity, args ) );
        filter.RegisterCommand( "detach"
            , {min:3,max:0,description:"detach <entity> <from> <other-Entity>; detaches two entites from each other."}
            , (args)=> Detach( entity, args ) );
        filter.RegisterCommand( "wake", 
            { description:"wake up an entity; provide it with (this) VM command interface"},
            (args)=> Wake( entity, args ) 
            );
        filter.RegisterCommand( "leave", 
            { description:"leave the current room to the current room's container"},
            (args)=> Leave( entity, args ) 
            );
        filter.RegisterCommand( "enter", 
            { description:"enter <near object> - enter into an object"},
            (args)=> Enter( entity, args ) 
            );
        
            {
                   on("rebase",async (a)=>{ console.log( await name, ":rebase event:",( a &&await a.name))}) ;
                   on("debase",async (a)=>{ console.log( await name, ":debase event:",( a&&await a.name) )}) ;

                   on("joined",async (a)=>{ console.log( await name, ":join event:",( a &&await a.name))}) ;
                   on("parted",async (a)=>{ console.log( await name, ":part event:",( a &&await a.name)    )}) ;

                   on("placed",async (a)=>{ console.log( await name, ":place event:",( a &&await a.name))}) ;
                   on("displaced",async (a)=>{ console.log( await name, ":displace event:",( a &&await a.name)    )}) ;
                                     
                   on("stored",async (a)=>{ console.log( await name, ":stored event:", (a &&await a.name))}) ;
                   on("lost",async (a)=>{ console.log( await name, ":lost event:", (a && await a.name))}) ;

                   on("attached",async (a)=>{ console.log( await name, ":attach event:", (a &&await a.name))}) ;
                   on("detached", (a)=>{return  name.then(name=>a.name.then(aname=>console.log( name, ":detach event:", a.name, "\\n"))) }) ;

            }
        
    }
    return filter;

    function Script( sandbox, src ) {
        src.spaces = 0;
        if( src ) {
            {
                var code = `(()=>{var core = {}; 
                    var fs = this.require( 'sack' ).Volume();
                    try {
                        var file = fs.readAsString( "${src}" );
                    }catch(err) {
                    console.log( "File failed... is it a HTTP request?", err );
                    }
                    ( core['${src}'] = eval( "(function(){"+file+"})()" ) );})()`;
                
                try {
                    sandbox.scripts.push( { type:"ShellExecute", code:code } )
                    vm.runInContext(code, sandbox 
                        , { filename:src, lineOffset:0, columnOffset:0, displayErrors:true, timeout:500} )
                } catch( err ) {
                    console.log( "script faulted.... exception timeout", err );
                }
                console.log( "and then we continue?");
            }
        }
    }


    function Grab( sandbox, args ) {
        //console.log( "Grab() calling getObjects...");
        return getObjects( sandbox, args, ( foundSandbox, where, nextArgs )=>{
            console.log( "Grab location is:", where );
            if( where == "contains") {
                //console.log( "Success, there's a thing on that thing...", foundSandbox );
                return grab( foundSandbox );
            }
            if( where === "near" ) {
                //console.log( "Success, there's a thing on that thing...", foundSandbox );
                return grab( foundSandbox );
            }else if( foundSandbox ) {
                console.log( "Error: object was found ", where, " instead of near or contained.")
            }
            return Promise.resolve( undefined );
        });
    }

    function Drop( sandbox, args ) {
        return getObjects( sandbox, args, ( foundSandbox, where )=>{
            console.log( "got", foundSandbox.name, where )
            if( where == "holding" )
                sandbox.drop( foundSandbox );
        });
    }

    function Store( sandbox, args ) {
        return getObjects( sandbox, args, ( foundSandbox, where )=>{
            console.log( "got", foundSandbox.entity.name, where )
            if( where == "holding" )
                sandbox.store( foundSandbox );
        });
    }

    function Wake( wakingSandbox, args ) {
        getObjects( wakingSandbox.me, args, ( sandbox )=>{
            //console.log( "got", sandbox )        
            if( !sandbox.io.command ){
                sandbox.io.command = Filter( sandbox );
                var labeler = labelStream.Filter();
                labeler.label = sandbox.entity.name;
                Object.defineProperty(sandbox.io, "command", { enumerable: false, writable: true, configurable: true });
                labeler.connectOutput(  wakingSandbox.io.command );
                sandbox.io.command.connectOutput( labeler.filter );
            }
            else console.log( "already awake.")
        });
    }

    function Tell( sandbox, args ) {
        //console.log( "args is ", args );
        var findArgs = args.splice( 0, 1 );
        var tail = null;
        for( var n = 0; n < args.length; n++ ) {
            if( !tail ) tail = args[n];
            else {
                tail.append( args[n] );
                args[n].spaces = 1;
            }
        }
        getObjects( sandbox, findArgs, ( sandbox )=>{
            //console.log( `in ${sandbox.entity.name} ${sandbox.io.command}`)
            if( sandbox.io.command ) {
                console.log( "sending to sandbox io...", tail );
                sandbox.io.command.processCommandLine( tail )
            } else{
                console.log( "can't tell a dead object.  Try exec instead.", tail.toString() );
                //Tell( sandbox, args );
                try {
                    sandbox.scripts.push( { type:"command", code:tail.toString() } );
                    vm.runInContext( tail.toString(), sandbox /*, { filename:"", lineOffset:"", columnOffset:"", displayErrors:true, timeout:10} */)
                } catch(err){
                    console.log( err );
                }
            }
        });
    }
    function Inventory( sandbox, src ) {
        console.log( "Get inventory..." );
        sack.log( "Get inventory... using nearObjects directly."); 
        const p = sandbox.nearObjects.then ( (i)=>{
            var contents = [];
            sack.log( "near Objects resulted...", i );
            i.get("contains").forEach(val=>contents.push( val.name ) );
            if( !contents.length )
                contents.push( Promise.resolve( "Nothing" ))
            return Promise.all( contents ).then( x=>{
                output( "Contains: ", x.join(", ") + ".\n");
                contents.length = 0;
                i.get("holding").forEach( val=>contents.push( val.name ));
                if( !contents.length )
                contents.push( Promise.resolve( "Nothing" ))
                return Promise.all( contents).then( x=>{
                    output( "Holding:", x.join(", " ) + ".\n");
                })
            } ).catch(err=>console.log( "some resolution errror:", err ));
        }).catch(err=>{
            doLog( "Error gettingnear objects", err );
        })
        sack.log( "Returning p...",p );
        return p;
    }
    async function asInventory( sandbox, src ) {
        console.log( "Get inventory..." );
        sack.log( "Get inventory... using nearObjects directly."); 
        const near = await sandbox.nearObjects
        var contents = [];
        sack.log( "near Objects resulted...", i );

        var containIter = near.get("contains")[Symbol.iterator]();
        for( let val of containIter ) {
            contents.push( await val[0].name );
        }
        if( !contents.length ) contents.push( "Nothing" )
        output( "Contains: ", contents.join(", ") + ".\n");
        // reset array for next line...
        contents.length = 0;
        containIter = near.get("holding")[Symbol.iterator]();
        for( let val of containIter ) {
            contents.push( await val[0].name );
        }
        if( !contents.length )
            contents.push( Promise.resolve( "Nothing" ))
        output( "Holding:", x.join(", " ) + ".\n");
    }
    async function Look( sandbox, src ) {
        var items = [];
        var firstArg;
            //console.log( entity.look( ) );
            var lookIn = false;
            if( src && src[0] && src[0].text == "in") {
                lookIn = true;
                src = src.slice(1);
            }
            console.log( "Look source:",src );
            var formattedOutput=[];
            var nearThings = near;
            var nearExits = exits;
            var room = sandbox.container;
            nearThings = await nearThings;
            //formattedOutput.push( "Near:" );
            nearThings.forEach( found=>{
                formattedOutput.push( found.name );
            })
            formattedOutput = await Promise.all( formattedOutput );
            output( "Near:", formattedOutput.join('.'));

            getObjects( sandbox, src, false, async( foundSandbox, location )=>{
                console.log( "Item:", await foundSandbox.name, location );
                //console.log( JSOX.stringify( sandbox.entity.near ))
                //output( util.format( "something", location, foundSandbox.entity.name ) );
                //output( util.format( location, foundSandbox.entity.name ) );
                if( lookIn ) {
                    console.log ('is in...')
                    getObjects( foundSandbox.me, null, true, (inSandbox,location)=>{
                        formattedOutput.push( location + " : " + inSandbox.name )
                    })
                }else if( src.length ) {
                    formattedOutput.push( foundSandbox.entity.description );
                } else {
                    formattedOutput.push( location + " : " + foundSandbox.entity.name );
                }
            });
            room = await room;
            if( !lookIn ){
                var s = "Room: " + await room.parent.name;
                for( let path = room.from; path; path = path.from ){
                    s += ' via ' + await path.at.name;
                }
                output( s + "\n" );        
            }
            if( !formattedOutput.length )
                output( "Nothing." );
            else            
                output( formattedOutput.join(',') );
    }
    function Exec( sandbox, src ) {
        if( !src ) return;
        //console.trace( "Called with :", JSOX.stringify( src ) );
        //console.log( "Exec called with", sandbox )
        //console.log( "ExEC:", src );
        //console.log( "EXEC TOSTR:", src.map(val=>val.toString()).join( "" ) );
        src[0].spaces = 0;
        try {
            var code = src.reduce((acc,val)=>acc.append(val), new text.Text() ).toString();
            //console.log( "runincontext? '"+ code+"'")
            var res =  vm.runInContext(code, sandbox /*, { filename:"", lineOffset:"", columnOffset:"", displayErrors:true, timeout:10} */)
            sandbox.scripts.push( { type:"Exec command", code:code } );
            return res;
        }catch(err){
            output( err.toString() );
        throw err;
        }
        return null;
    }

    function Leave(sandbox,args) {
        sandbox.leave();
    }

    function Enter(sandbox,args) {
        getObjects( sandbox, args, ( foundSandbox, where )=>{
            if( where == "near") {
                sandbox.enter( foundSandbox );
                return;
            }
            if( where == "outside" ){
                sandbox.enter( foundSandbox );
                return;
            }
        } )
    }

    function Attach( sandbox,args) {
        let legal = false;
        getObjects( sandbox, args, (found, where, args)=>{
            if( where === "holding"){
                legal = true;
                if( args.length && args[0].text === "to" )
                    args = args.slice( 1 );
                getObjects( sandbox, args, (found2, where2, args ) =>{
                    if( where2 == "holding"){
                        console.log( "found 2 held objects, telling them to attach");
                        try {
                            legal = true;
                            found2.attach(found);
                        }catch(err) {
                            console.log( "not sure where the other error went...", err );
                            throw err;
                        }
                    }
                    if( !found2 ){
                        if( !legal ) {
                            output( "Second object was not held");
                        }
                    }
                })
            }
            if( !found )
                if( !legal ) {
                    output( "First object was not held");
                }
        })
    }
    function Detach( sandbox,args ) {
        var argc = 0;
        
        getObjects( sandbox, args, (found, where, args)=>{
            if( where === "holding"){
                if( args.length && args[0].text === "from" )
                    args = args.slice( 1 );
                getObjects( sandbox, args, (found2, where2, args ) =>{
                    if( where2 == "holding"){
                        sandbox.entity.detach( found2.entity);
                    }
                })
            }
        })
    }

}

