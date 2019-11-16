"use strict";

var util = require('util')
var vm = require('vm');
var Entity = require( '../Entity/entity.js');
const JSOX = require( "sack.vfs").JSOX;
const text = require( "../../org.d3x0r.common/text.js");
const stream = require('../command_stream_filter/command.js')
const labelStream = require( "../command_stream_filter/label_insert.js" );
Entity.netRequire.provide( "shell.js", exports );
Entity.Sentience = exports;
//Entity.
exports.Filter = Filter;
exports.Script = Script;
//exports.
function Filter( sandbox ) {
    if( !sandbox ) throw new Error( "invalid sandbox passed to filter" );
    //console.log( "Path resolves...", require.resolve( "./startup.js" ) );
    var filter = stream.Filter( sandbox );
    {
        filter.RegisterCommand( "help", 
            { description:"get a list of commands? "},
            (args)=>{
                var out = "";
                //console.log( filter );
                filter.forEach( (command,id)=>{
                    out += command.opts.helpText + " - " + command.opts.description + "\n";
                } )
                sandbox.console.log( out );
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
                    //console.log( "create for ", sandbox.me, args[0].toString(), desc )
                    sandbox .create(  args[0].toString(), desc, (e)=>{
                        // new entity exists now... (feedback created?)
                        sandbox.console.log( "Created:", e.name );
                    } );
                } );
        filter.RegisterCommand( "script", 
            { description:"load a file and run said code (javascript)"},
            (args)=>{
                    args.forEach( arg=> {
                        Script( sandbox, arg );
                    })
                } );
        filter.RegisterCommand( "exec"
            , { description:"run some javascript code in entity sandbox"}
            , (args)=> Exec( sandbox, args ) );
        filter.RegisterCommand( "tell"
            , {min:3,max:0,description:"tell <entity> <command>"}
            , (args)=> Tell( sandbox, args ) );
        filter.RegisterCommand( "inv"
            , {min:0,max:0,description:"Without parameters, show objects that are internally visible, and attached"}
            , (args)=> Inventory( sandbox, args ) );
        filter.RegisterCommand( "look"
            , {min:0,max:0,description:"Without parameters, show objects that are externally visible."}
            , (args)=> Look( sandbox, args ) 
        );
        filter.RegisterCommand( "grab"
            , {min:3,max:0,description:"grab <entity>"}
            , (args)=> Grab( sandbox, args ) );
        filter.RegisterCommand( "lose"
            , {min:3,max:0,description:"lose <contained entity> <into> <into-entity>; lose a contained item into another container(room)."}
            , (args)=> Lose( sandbox, args ) );
        filter.RegisterCommand( "drop"
            , {min:3,max:0,description:"drop <attached-entity> <into> <into-entity>; drop a held/attached item into another container(room)."}
            , (args)=> Drop( sandbox, args ) );
        filter.RegisterCommand( "store"
            , {min:3,max:0,description:"store <attached-entity> <in> <into-entity>; puts an attached entity into another entity (self)."}
            , (args)=> Store( sandbox, args ) );
        filter.RegisterCommand( "attach"
            , {min:3,max:0,description:"attach <entity> <to> <to-Entity>; attaches two entites together."}
            , (args)=> Attach( sandbox, args ) );
        filter.RegisterCommand( "detach"
            , {min:3,max:0,description:"detach <entity> <from> <other-Entity>; detaches two entites from each other."}
            , (args)=> Detach( sandbox, args ) );
        filter.RegisterCommand( "wake", 
            { description:"wake up an entity; provide it with (this) VM command interface"},
            (args)=> Wake( sandbox, args ) 
            );
        filter.RegisterCommand( "leave", 
            { description:"leave the current room to the current room's container"},
            (args)=> Leave( sandbox, args ) 
            );
        filter.RegisterCommand( "enter", 
            { description:"enter <near object> - enter into an object"},
            (args)=> Enter( sandbox, args ) 
            );
        const startupCode = `
                {
                   on("rebase",(a)=>{ console.log( name, ":rebase event:",( a &&a.name), "\\n")}) ;
                   on("debase",(a)=>{ console.log( name, ":debase event:",( a&&a.name) , "\\n")}) ;

                   on("joined",(a)=>{ console.log( name, ":join event:",( a &&a.name), "\\n")}) ;
                   on("parted",(a)=>{ console.log( name, ":part event:",( a &&a.name)    , "\\n")}) ;

                   on("placed",(a)=>{ console.log( name, ":place event:",( a &&a.name), "\\n")}) ;
                   on("displaced",(a)=>{ console.log( name, ":displace event:",( a &&a.name)    , "\\n")}) ;
                                     
                   on("stored",(a)=>{ console.log( name, ":stored event:", (a &&a.name), "\\n")}) ;
                   on("lost",(a)=>{ console.log( name, ":lost event:", (a &&a.name)      , "\\n")}) ;

                   on("attached",(a)=>{ console.log( name, ":attach event:", (a &&a.name), "\\n")}) ;
                   on("detached",(a)=>{ console.log( name, ":detach event:", (a &&a.name), "\\n")}) ;

                }
                `;
        var res =  vm.runInContext(startupCode, sandbox /*, { filename:"", lineOffset:"", columnOffset:"", displayErrors:true, timeout:10} */);
        console.log( "Result:", res );
    }
    return filter;
}

///exec console.log( this.require.cache['M:\\javascript\\dekcore\\command_stream_filter\\hello.js'] );

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
    Entity.getObjects( sandbox.me, args, ( foundSandbox, where, nextArgs )=>{
        console.log( "Grab location is:", where );
        if( where == "contains") {
            console.log( "Success, there's a thing on that thing..." );
	        sandbox.grab( foundSandbox );
            return;
        }
        if( where === "near" ) {
	        sandbox.grab( foundSandbox );
            return;
        }else {
            sandbox.console.log( "Error: object was found ", where, " instead of near or contained.")
        }
    });
}

function Drop( sandbox, args ) {
    Entity.getObjects( sandbox.me, args, ( foundSandbox, where )=>{
        console.log( "got", foundSandbox.entity.name, where )
        if( where == "holding" )
	        sandbox.drop( foundSandbox );
    });
}

function Store( sandbox, args ) {
    Entity.getObjects( sandbox.me, args, ( foundSandbox, where )=>{
        console.log( "got", foundSandbox.entity.name, where )
        if( where == "holding" )
	        sandbox.store( foundSandbox );
    });
}

function Wake( wakingSandbox, args ) {
    Entity.getObjects( wakingSandbox.me, args, ( sandbox )=>{
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
    Entity.getObjects( sandbox.me, findArgs, ( sandbox )=>{
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
    var i = sandbox.entity.inventory;
    var output = [];
    if( sandbox.io.command )
        output.push( JSOX.stringify( i, null, ' ' ) );
    sandbox.io.command.push( output.join(',') );
    return i;
}
function Look( sandbox, src ) {
    var items = [];
    var firstArg;
        //console.log( entity.look( ) );
        //console.trace( "using", sandbox );
        var lookIn = false;
        if( src && src[0] && src[0].text == "in") {
            lookIn = true;
            src = src.slice(1);
        }
        console.log( "Look source:",src );
        var formattedOutput=[];
        Entity.getObjects( sandbox.me, src, false, ( foundSandbox, location )=>{
            console.log( "Item:", foundSandbox.name, location );
            //console.log( JSOX.stringify( sandbox.entity.near ))
            //sandbox.io.command.push( util.format( "something", location, foundSandbox.entity.name ) );
            //sandbox.io.command.push( util.format( location, foundSandbox.entity.name ) );
            if( lookIn ) {
                console.log ('is in...')
                Entity.getObjects( foundSandbox.me, null, true, (inSandbox,location)=>{
                    formattedOutput.push( location + " : " + inSandbox.name )
                })
            }else if( src.length ) {
                formattedOutput.push( foundSandbox.entity.description );
            } else {
                formattedOutput.push( location + " : " + foundSandbox.entity.name );
            }
        });
        if( !lookIn )
            sandbox.io.command.push( "Room:" + sandbox.entity.container.name + "\n" );        
        if( !formattedOutput.length )
            sandbox.io.command.push( "Nothing." );
        else            
            sandbox.io.command.push( formattedOutput.join(',') );
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
        sandbox.io.command.push( err.toString() );
	throw err;
    }
    return null;
}

function Leave(sandbox,args) {
    sandbox.leave();
}

function Enter(sandbox,args) {
    Entity.getObjects( sandbox.me, args, ( foundSandbox, where )=>{
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
    var argc = 0;
    
    Entity.getObjects( sandbox.me, args, (found, where, args)=>{
        if( where === "holding"){
            if( args.length && args[0].text === "to" )
                args = args.slice( 1 );
            Entity.getObjects( sandbox.me, args, (found2, where2, args ) =>{
                if( where2 == "holding"){
                    found2.entity.attach(found.entity);
                }
            })
        }
    })
}
function Detach( sandbox,args ) {
    var argc = 0;
    
    Entity.getObjects( sandbox.me, args, (found, where, args)=>{
        if( where === "holding"){
            if( args.length && args[0].text === "from" )
                args = args.slice( 1 );
            Entity.getObjects( sandbox.me, args, (found2, where2, args ) =>{
                if( where2 == "holding"){
                    sandbox.entity.detach( found2.entity);
                }
            })
        }
    })
}