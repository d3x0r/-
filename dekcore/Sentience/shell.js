"use strict";

var stream = require('../command_stream_filter/command.js')
var util = require('util')
var vm = require('vm');
var Entity = require( '../Entity/entity.js');

exports.Filter = Filter;
exports.Script = Script;
//exports.

function Filter( sandbox ) {
console.log( "Path resolves...", require.resolve( "./startup.js" ) );
    var filter = stream.Filter( sandbox );
    {
        filter.RegisterCommand( "create", (args,argarray)=>{
            console.log( argarray )
                if( !argarray[0] ) return;
                console.log( "create ", argarray[0].text, argarray[1] && argarray[1].text )
                    filter.result = Entity( filter.sandbox, argarray[0].text, argarray[1] && argarray[1].text )
                } );
        filter.RegisterCommand( "script", (args)=>{
                    filter.result = Script( filter.sandbox, args )
                } );
        filter.RegisterCommand( "exec", (args)=>{
                    filter.result = Exec( filter.sandbox, args )
                } );
        filter.RegisterCommand( "tell", (args)=>{
                    filter.result = Tell( filter.sandbox, args )
                } );
        filter.RegisterCommand( "wake", (args)=>{
                    filter.result = Wake( filter.sandbox.me, args )
                } );

    }
    return filter;
}

///exec console.log( this.require.cache['M:\\javascript\\dekcore\\command_stream_filter\\hello.js'] );

function Script( sandbox, src ) {
    //console.log( "Script called with", sandbox )
    //console.log( "first word? ", src.text)
    src.spaces = 0;
    console.log( "Script called with", src.toString() )
    if( src ) {
        {
            var code = `var core = {}; 
            	var fs = this.require( 'fs' );
                var names = fs.readdirSync( "." );
                console.log( names );
                (core['${src}'] = this.require("${src}"));`;
            console.log( "run ", code)
            return vm.runInContext(code, sandbox /*, { filename:"", lineOffset:"", columnOffset:"", displayErrors:true, timeout:10} */)
            console.log( "and then we continue?");
        }
    }
}


function getObjects( me, src, callback ){
    var object = src;
    var count = 0;
    var all = false;
    var run = true;
    var tmp;
    if( object.text == 'all' && object.next && object.next.text == '.' ) {
        all = true;
        object = object.next.next;
    }
    if( ( tmp = Number( object.text ) ) && object.next && object.next.text == '.' ) {
        object = object.next.next;
        count = tmp;
    }
    var command = src.break();
    console.log( "get objects for ", me.name)
    var near = me.nearObjects;
    //console.log( near )
    Object.keys( near ).forEach( (key)=>{
        if( run ) near[key].forEach( ( member )=>{
            if( member.name === object.text ){
                //console.log( "found object", member )
                if( count ){
                    count--;
                    return;
                }
                if( run )
                    callback( command, member.sandbox );
                run = all;
            }
        });
    })

}

function Wake( me, src ) {
    getObjects( me, src, ( args, sandbox )=>{
        //if( vm.)
        if( !sandbox.me.command ){
            console.log( 'create command processor related with object and sandbox', sandbox.me.name );
            sandbox.me.command = require('../Sentience/shell.js').Filter( me.sandbox );
        }
        else console.log( "already awake.")
    });
}

function Tell( sandbox, src ) {
        getObjects( sandbox.me, src, ( args, sandbox )=>{
            console.log( `in ${sandbox.me.name} ${sandbox.me.command}`)
            //if( vm.)
            if( sandbox.me.command )
                sandbox.me.command.processCommandLine( args )
            else{
                console.log( "Running JS on ", sandbox.me.name )
                vm.runInContext( args.toString(), sandbox /*, { filename:"", lineOffset:"", columnOffset:"", displayErrors:true, timeout:10} */)
            }
        });
}
function Exec( sandbox, src ) {
    //console.log( "Exec called with", sandbox )
    //console.log( src )
    //console.log( src.toString() )
    try {
        var code = src.toString();
        console.log( "runincontext?", code)
        return vm.runInContext(code, sandbox /*, { filename:"", lineOffset:"", columnOffset:"", displayErrors:true, timeout:10} */)
    }catch(err){
        console.log( err );
    }
    return null;
}
