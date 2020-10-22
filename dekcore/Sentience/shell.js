"use strict";

const _debug_promise_resolution = true; //this should just be removed now.

exports.Filter = Filter;

var util = await require('util')
const vm = await require('vm' );
const sack = await require('sack' );

var text = null;
var commandStream = null;
var labelStream = null;

const strings = {
    grabWhat : "Grab what?"
}

if( "undefined" === typeof Λ ) {
    // this is a sandbox; and we don't have real entity support.
    // this mode isn't used currently; previously the core also attached shell
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

function stripQuotes(args ){
    for( var arg = 0; arg < args.length; arg++ ) {
        const a = args[arg];
        if( a.text== '\'' || a.text == '"' || a.text === '`' ){
            args[arg] = a.indirect;
        }
        args[arg].spaces = 0;
    }
}

function stripArgQuotes(a ){
    if( a.text== '\'' || a.text == '"' || a.text === '`' ){
        return a.indirect;
    }
    return a;
}

function Filter( e ) {

    if( !e ) throw new Error( "invalid sandbox passed to filter" );
    var entity = e.entity;
    //console.trace( "This should be an entity?", e );
    //const thread = e.wake();  // this is already awake.
    function output(...args) {
        return filter.push( util.format.apply(util,args));
    }
    //console.log( "Path resolves...", require.resolve( "./startup.js" ) );
    var filter = commandStream.Filter(entity);
    {
        filter.RegisterCommand( "unhandled", {}, (line)=>{
            var r = e.run(line);
            if( r ) {
                if( r instanceof Promise ) 
                    r.then( r=>output( r ) );
                else output(r);
            }
        })
        filter.RegisterCommand( "help", 
            { description:"get a list of commands? "},
            (args)=>{
                var out = "";
                output( "Commands are prefixed with a '/'.  '/help' for example... ");
                output( "Default output goes to your local sandbox as if a REPL. ");
                output( "Through actions, the default stream output can be redirected to other things; for example if a TCP connection to a MUD was mad, then the command stream filters added for processing MUD I/O streams would get the output instead of the JS engine. ")
                output( "The '/exec' command can be used in case it is still required to send. ")
                output( "If the line is prefixed with a '.' the dot is stripped, and the remaining command is passed to the stream; for example you want to send '/help' you might use './help' to bypass this command filter.\n")
                output( "-------------------\n");
                //console.log( filter );
                filter.forEach( (command,id)=>{
                    out += command.opts.helpText + " - " + command.opts.description + "\n";
                } )
                output( out );
        } );
        filter.RegisterCommand( "create", 
            { description:"create an entity <name <description>> "},
            (args)=>{
                stripQuotes(args);
                if( !args[0] ) return;
                var desc = "nondescript"
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
            , (args)=> asInventory( entity, args ) );
        filter.RegisterCommand( "inv2"
            , {min:0,max:0,description:"Without parameters, show objects that are internally visible, and attached"}
            , (args)=> asInventory( entity, args ) );
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
        filter.RegisterCommand( "animate"
            , {min:3,max:0,description:"animate <entity>;allow definition of methods (sandbox, no thread)"}
            , (args)=> Animate( entity, args ) );
        filter.RegisterCommand( "hold"
            , {min:3,max:0,description:"hold <entity>"}
            , (args)=> Hold( entity, args ) );
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
            { description:"leave the current room to one of the room's attached rooms."},
            (args)=> Leave( entity, args ) 
            );
        filter.RegisterCommand( "escape", 
            { description:"leave the current room to the current room's container."},
            (args)=> Escape( entity, args ) 
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
            on("lost",async (a)=> name.then( name=>a.name.then(aname=>console.log( name, ":lost event:", aname ))));
            on("created", async (a)=>{
                return entity.within.then(within=>{
                    return within.name.then(name=>{
                        return a.name.then(aname=>{
                             console.log( name, ":created:", aname)
                        } )
                    })
                })
            });
            on("attached",async (a)=>{ 
                return name.then(name=>{ 
                    return a.name.then(aname=>{
                        console.log( name, ":attach event:", aname ); // real output
                    } )
                })
            }) ;
            on("detached", (a)=> name.then(name=>a.name.then(aname=>console.log( name, ":detach event:", aname ))) ) ;
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
        var a = false;
        stripQuotes(args);
        console.log( "Stripped words:", args );
        //console.log( "Grab() calling getObjects...");
        return getObjects( sandbox, args, false, ( foundSandbox, foundName, where, nextArgs )=>{
            if( !where ) return; // list done.
            console.log( "Grab location is:", where );
            a = true;
            if( nextArgs.length ) Grab( sandbox, nextArgs );
            if( where == "contains") {
                console.log( "Success, there's a thing on that thing...", foundSandbox );
                return grab( foundSandbox )
                        .catch( (err)=>{ output( err.toString()+"\n" )})
                        .then( obj=>foundSandbox.name( name=>console.log( "Grabbed:", name) ) );
            }
            if( where === "near" || where == "holding,holding" ) {
                console.log( "Success, there's a thing on that thing...", foundSandbox );
                return grab( foundSandbox )
                    .catch( (err)=>{ output( err.toString()+"\n" )})
                    .then( obj=>foundSandbox.name( name=>console.log( "Grabbed:", name) ) );
            }else if( foundSandbox ) {
                console.log( "Error: object was found ", where, " instead of near or contained.")
            }
            return Promise.resolve( undefined );
        }).then( ()=>{
            if( !a ) {
                nearObjects.then( no=>{
                    no.get("holding").forEach( no=>getObjects( no, args, false, ( foundAttachment, attachName, where, nextArgs )=>{
                        if( where === "holding" ){
                            a = true;
                            return grab( foundAttachment ).then( (target_)=>{
                                console.log( "Grabbed:", target);
                            }).catch( (err)=>{
                                console.log( "Failed to grab:", target, err );
                            });
                        }
                    } ) )
                }).then( ()=>{
                    if( !a )
                        console.log( strings.grabWhat );
                })
            }
        });
    }
    function Hold( sandbox, args ) {
        var a = false;
        stripQuotes(args);
        stripQuotes(args);
        //console.log( "Grab() calling getObjects...");
        return getObjects( sandbox, args, false, ( foundSandbox, foundName, where, nextArgs )=>{
            if( !where ) return; // list done.
            //console.log( "Grab location is:", where );
            a = true;
            if( nextArgs.length ) Hold( sandbox, nextArgs );
            if( where == "contains") {
                //console.log( "Success, there's a thing on that thing...", foundSandbox );
                return hold( foundSandbox );
            }
            if( where === "near" || where == "holding,holding" ) {
                console.log( "Success, there's a thing on that thing...", foundName );
                return hold( foundSandbox ).catch( (err)=>{ output( err.toString()+"\n" )});
            }else if( foundSandbox ) {
                console.log( "Error: object was found ", where, " instead of near or contained.")
            }
            return Promise.resolve( undefined );
        }).then( ()=>{
            if( !a ) {
                nearObjects.then( no=>{
                    no.get("holding").forEach( no=>getObjects( no, args, false, ( foundAttachment, attachName, where, nextArgs )=>{
                        if( where === "holding" ){
                            a = true;
                            return grab( foundAttachment );
                        }
                    } ) )
                }).then( ()=>{
                    if( !a )
                        console.log( strings.grabWhat );
                })
            }
        });
    }

    function Drop( sandbox, args ) {
        var found = false;
        stripQuotes(args);
        return getObjects( sandbox, args, false, ( foundSandbox, foundName, where, moreArgs )=>{
            if( !where && !found ) {
                output( args[0].toString() + " was not found." );
            }
            found = true;
            if( where == "holding" ) {
                output( "Dropped " + args[0].toString() );
                sandbox.drop( foundSandbox );
            }else
                return false;
        }).then (()=>{
            if( moreArgs.length ) Drop( sandbox, moreArgs );
        });
    }

    function Lose( sandbox, args ) {
        var found = false;
        stripQuotes(args);
        return getObjects( sandbox, args, false, ( foundSandbox, foundName, where, moreArgs )=>{
            if( !where && !found ) {
                output( args[0].toString() + " was not found." );
            }
            found = true;
            if( where == "contains" ) {
                output( "Dropped " + args[0].toString() );
                sandbox.drop( foundSandbox );
            }else
                return false;
        }).then (()=>{
            if( moreArgs.length ) Drop( sandbox, moreArgs );
        });
    }

    function Store( sandbox, args ) {
        var found = false;
        stripQuotes(args);
        return getObjects( sandbox, args, { all:false, disableParticiples:true}
            , ( foundSandbox, foundName, where, moreargs )=>{
                if( found ) return;
                if( moreargs.length ) {
                    if( moreargs[0].text === "in" || moreargs[0].text === "into" )
                        moreargs = moreargs.slice( 1 );
                    getObjects( sandbox, moreargs, false, (foundInto, intoName, whereInto, moreArgs )=>{
                        if( !whereInto )return;
                        found = true;
                        return foundInto.store( foundSandbox );
                    })
                    return;
                }
                if( !where && !found ) {
                    output( args[0].toString() + " was not found." );
                    return;
                }
                if( where == "holding" ) {
                    found = true;
                    sandbox.store( foundSandbox );
                }
            }
        ).then( ()=>{
            if( !found ) output( "Store What?\n");
        });
    }

    function Wake( wakingSandbox, args ) {
        stripQuotes(args);
        getObjects( wakingSandbox, args, false, ( sandbox, sandboxName )=>{
            //console.log( "got", sandbox )
            sandbox && sandbox.wake();
        });
    }

    function Animate( wakingSandbox, args ) {
        getObjects( wakingSandbox.me, args, false, ( sandbox, sandboxName )=>{
            //console.log( "got", sandbox )   
            sandbox && sandbox.animate();     
        });
    }

    function Tell( sandbox, args ) {
        //console.log( "args is ", args );
        var findArgs = stripArgQuotes( args.splice( 0, 1 ) );
        var tail = null;
        for( var n = 0; n < args.length; n++ ) {
            if( !tail ) {
                tail = args[n];
                tail.spaces = 0;
            }else {
                tail.append( args[n] );
            }
        }
        
        getObjects( sandbox, findArgs, false, ( sandbox, sandboxName )=>{
            //console.log( `in ${sandbox.entity.name} ${sandbox.io.command}`)
            if( sandbox ) {
                console.log( "sending to sandbox io...", tail );
                sandbox.exec( tail )
            }
        });
    }
    function Inventory( sandbox, src ) {
        _debug_promise_resolution && console.log( "Get inventory..." );
        _debug_promise_resolution && sack.log( "Get inventory... using nearObjects directly."); 
        const p = sandbox.nearObjects.then ( (i)=>{
            var contents = [];
            _debug_promise_resolution && sack.log( util.format(new Error().stack, "Inventory - near Objects resulted...", i ));
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
        _debug_promise_resolution && sack.log( "Returning p...",p );
        return p;
    }
    async function asInventory( sandbox, src ) {
        //_debug_promise_resolution &&
         console.log( "Get inventory..." );
        _debug_promise_resolution && sack.log( "Get inventory... using nearObjects directly."); 
        const near = await sandbox.nearObjects
        var contents = [];
        _debug_promise_resolution && sack.log( "near Objects resulted...", i );

        var containIter = near.get("contains")[Symbol.iterator]();
        for( let val of containIter ) {
            contents.push( await val[0].name );
        }
        if( !contents.length ) contents.push( "Nothing" )
        output( "Containsa: ", contents.join(", ") + ".\n");
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
        stripQuotes(src);
        var firstArg;
            //console.log( entity.look( ) );
            var lookIn = false;
            var lookAt = false;
            if( src && src[0] && src[0].text == "in") {
                lookIn = true;
                src = src.slice(1);
            }
            //console.log( "Look source:",src );
            try {
                _debug_promise_resolution && sack.log( "Look command start... get near things here... ");
                var formattedOutput=[];
                var formattedOutputDesc=[];
                var nearThings = await near;
                var room = await sandbox.within;
            
            _debug_promise_resolution && sack.log( "Wait for nearThings");
            _debug_promise_resolution && sack.log( "nearThings resolved now.");
            //formattedOutput.push( "Near:" );
            if( !src.length ) {
                let formattedOutput = [];
                nearThings .forEach( found=>{
                    if( found === sandbox ) return;
                    //console.log( "Near things promise result?" );
                    formattedOutput.push( found.name );
                })
                formattedOutput = await Promise.all( formattedOutput );
                if( !formattedOutput.length )
                    formattedOutput.push( "Nothing");
                output( "Near: %s.\n", formattedOutput.join(', '));
                formattedOutput.length = 0;
            }
            else 
                lookAt = true;

            getObjects( sandbox, src, false, async( foundSandbox, foundName, location )=>{
                if( !location ) return;
                //console.log( "(dbg)Item:", foundName, location, "\n" );
                //console.log( JSOX.stringify( sandbox.entity.near ))
                //output( util.format( "something", location, foundSandbox.entity.name ) );
                //output( util.format( location, foundSandbox.entity.name ) );
                if( lookIn ) {
                    if( foundSandbox ) {
                        //console.log('is in...\n', sandbox.cache.name, new Error().stack )
                        getObjects( foundSandbox, null, true, (Sandbox,inName, location)=>{
                            if( location === "contains" )
                                formattedOutput.push( foundName + " " + location + " : " + inName )
                        }).then( () => {
                            var line = formattedOutput.join(', ');
                            output( "Contains: " + line + ".\n" );
                        })
                    }
                }else if( src.length ) {                    
                    formattedOutputDesc = await foundSandbox.description;
                    output( formattedOutputDesc + "\n" )
                    //console.log( "this is getting holding... to build'formattedOutput", foundSandbox.holding );
                    foundSandbox.holding.then( async (holds)=>{
                        //console.log( "this is getting holding... to build'formattedOutput", holds );
                        holds.forEach( attachment=>(attachment!=sandbox) && formattedOutput.push( attachment.name ));
                        if( !formattedOutput.length )
                            ;
                        else {
                            var line = await Promise.all(formattedOutput).then( fo=>fo.join(', ') );
                            output( "Holding: " + line + ".\n" );
                        }
                            
                    })
                } else {
                    if( src.length )
                        formattedOutput.push( Promise.resolve( location + " : " + await foundSandbox.name ) );
                }
            }).then( async ()=>{
                if( !lookIn && !lookAt ){
                    room = await room;
                    var exits = await room.holding ;
                    var s = "Room: " + await room.parent.name + "\n" + await room.parent.description;
                    for( let path = room.from; path; path = path.from ){
                        s += ' via ' + await path.at.name;
                    }
                    output( s + "\n" );
                    let exitList = [];
                    exits.forEach( exit=>exitList.push( exit.name ));
                    //console.log( "Exits:", exits );
                    Promise.all( exitList ).then( exitList=>
                        output( "Exits: %s.\n", exitList.join(", ") )
                    );
                    doOutput();

                }else 
                    doOutput();
                async function doOutput() {
                    if( !formattedOutput.length )
                        ;//output( "Nothing.\n" );
                    else {
                        var line = await Promise.all(formattedOutput).then( fo=>fo.join(', ') );
                        formattedOutputDesc = await formattedOutputDesc;
                        output( formattedOutputDesc + "\n" )
                        output( "Holding: " + line + ".\n" );
                    }
                }
            });
        }catch(err) {
            sack.log( util.format( "ERROR FROM:", err, new Error().stack ) );
        }
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
            var res =  vmric(code, { filename:"Shell REPL", lineOffset:"", columnOffset:"", displayErrors:true, timeout:1000} );
            if( res ) {
                console.log( res );
            }
            //sandbox.scripts.push( { type:"Exec command", code:code } );
            return res;
        }catch(err){
            output( err.toString() );
        throw err;
        }
        return null;
    }

    function Leave(sandbox,args) {
        stripQuotes(args);
        sandbox.within.then( within=>{
            let done = false;
            getObjects( within, args, false, (foundSandbox, foundName, where )=>{
                if( where && where === "holding") {
                    if( !done ) {
                        done = true;
                        return sandbox.leave(to);
                    }
                }
            })
        })
    }

    function Escape(sandbox,args) {
        return sandbox.escape();
    }

    function Enter(sandbox,args) {
        stripQuotes(args);
        getObjects( sandbox, args, false, ( foundSandbox, foundName, where )=>{
            if( where === "near") {
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
        stripQuotes(args);
        getObjects( sandbox, args, false, (found, foundName, where, args)=>{
            if( where === "holding"){
                legal = true;
                if( args.length && args[0].text === "to" )
                    args = args.slice( 1 );
                getObjects( sandbox, args, false, (found2, found2Name, where2, args ) =>{
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
        stripQuotes(args);
        getObjects( sandbox, args, false, (found, foundName, where, args)=>{
            if( where === "holding"){
                if( args.length && args[0].text === "from" )
                    args = args.slice( 1 );
                getObjects( sandbox, args, false, (found2, foundName2, where2, args ) =>{
                    if( where2 == "holding"){
                        found.detach( found2);
                    }
                })
            }
        })
    }

}

