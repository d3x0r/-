"use strict";

var util = require('util')
var vm = require('vm');
var Entity = require( '../Entity/entity.js');
Entity.netRequire.provide( "shell.js", exports );
Entity.Sentience = exports;
//Entity.
exports.Filter = Filter;
exports.Script = Script;
//exports.

function Filter( sandbox ) {
    if( !sandbox ) throw new Error( "invalid sandbox passed to filter" );
    //console.log( "Path resolves...", require.resolve( "./startup.js" ) );
    var stream = require('../command_stream_filter/command.js')
    var filter = stream.Filter( sandbox );
    {
        filter.RegisterCommand( "help", 
            { description:"get a list of commands? "},
            (args)=>{
                var out = "";
                //console.log( filter );
                filter.commands.forEach( (command,id)=>{
                    //console.log( command );
                    out += command.opts.helpText + " - " + command.opts.description + "\n";
                } )
                console.log( out );
        } );
        filter.RegisterCommand( "create", 
            { description:"create an entity <name <description>> "},
            (args)=>{
            //console.log( argarray )
                if( !args[0] ) return;
                var desc = "nondescript."
                if( args.length > 1 )  
                    if( args[1].text==='"' || args[1].text==="'" ) {
                        if( args[1].indirect )
                            desc = args[1].indirect.toString();
                        else
                            desc = args[1].toString(); 
                    }else desc = args[1].toString();
                    
                    console.log( "create for ", filter.sandbox.me, args[0].toString(), desc )
                    filter.result = Entity.create( filter.sandbox.me, args[0].toString(), desc, (e)=>{
                        // new entity exitsts now... (feedback created?)
                    } );
                } );
        filter.RegisterCommand( "script", 
            { description:"load a file and run said code (javascript)"},
            (args)=>{
                args.forEach( arg=> {
                    filter.result = Script( filter.sandbox, arg );
                    })
                    return filter.result;
                } );
        filter.RegisterCommand( "exec"
            , { description:"run some javascript code in entity sandbox"}
            , (args)=> Exec( filter.sandbox, args ) );
        filter.RegisterCommand( "tell"
            , {min:3,max:0,description:"tell <entity> <command>"}
            , (args)=> Tell( filter.sandbox, args ) );
        filter.RegisterCommand( "inv"
            , {min:0,max:0,description:"Without parameters, show objects that are internally visible, and attached"}
            , (args)=> Inventory( filter.sandbox, args ) );
        filter.RegisterCommand( "look"
            , {min:0,max:0,description:"Without parameters, show objects that are externally visible."}
            , (args)=> Look( filter.sandbox, args ) 
        );
        filter.RegisterCommand( "wake", 
            { description:"wake up an entity"},
            (args)=> Wake( filter.sandbox, args ) 
            );

    }
    return filter;
}

///exec console.log( this.require.cache['M:\\javascript\\dekcore\\command_stream_filter\\hello.js'] );

function Script( sandbox, src ) {
    //console.log( "Script called with", sandbox )
    //console.log( "first word? ", src.text)
    src.spaces = 0;
    //console.log( "Script called with", sandbox, src.toString() )
    if( src ) {
        {
            var code = `(()=>{var core = {}; 
            	var fs = this.require( 'fs' );
                try {
	                var file = fs.readFileSync( "${src}", {encoding:'utf8'} );
                }catch(err) {
                   console.log( "File failed... is it a HTTP request?", err );
                }
                //var names = fs.readdirSync( "." );
                //console.log( names );
                ( core['${src}'] = eval( "(function(){"+file+"})()" ) );})()`;
            
            //console.log( "run ", code)
            //return 
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



function Wake( sandbox, args ) {
    Entity.getObjects( sandbox.me, args, ( sandbox )=>{
        //console.log( "got", sandbox )        
        if( !sandbox.io.command ){
            sandbox.io.command = Filter( sandbox );
            //console.log( 'create command processor related with object and sandbox', sandbox.me.name, Object.keys( sandbox.io.command ) );
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
            //if( vm.)
            if( sandbox.io.command ) {
                //console.log( "sending to sandbox io...", tail );
                sandbox.io.command.processCommandLine( tail )
            } else{
                //console.log( "can't tell a dead object.  Try exec instead." );
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
    console.log( i );
}
function Look( sandbox, src ) {
    var items = [];
        //console.log( entity.look( ) );
        //console.trace( "using", sandbox );
        Entity.getObjects( sandbox.me, src, false, ( sandbox, location )=>{
                console.log( "something", location, sandbox.entity.name );
            if( location === "near" )
                items.push( sandbox.entity.name );
            else
                console.log( "something", location, sandbox.entity.name );
        });
        console.log( items );
}
function Exec( sandbox, src ) {
    if( !src ) return;
    //console.log( "Exec called with", sandbox )
    //console.log( src )
    //console.log( src.toString() )
    try {
        var code = src.toString();
        //console.log( "runincontext?", code)
		sandbox.scripts.push( { type:"Exec command", code:code } );
        return vm.runInContext(code, sandbox /*, { filename:"", lineOffset:"", columnOffset:"", displayErrors:true, timeout:10} */)
    }catch(err){
        console.log( err );
    }
    return null;
}
