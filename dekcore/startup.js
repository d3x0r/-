

var newline = require(  './command_stream_filter/strip_newline.js' );
var parse = require( './command_stream_filter/text_parse.js' );
var monitor = require( './command_stream_filter/monitor_filter.js' );
var command = require( './command_stream_filter/command.js');

var shell = me.command;

function buildPiping(){
    var nl = newline.Filter();
    var text = parse.Filter();
    var cmd = command.Filter(  );
    var mon1 = monitor.Filter();
    var mon2 = monitor.Filter();
    
    nl.connectInput( process.stdin );
    nl.connectOutput( text.filter );
    text.connectOutput( shell.filter );
    shell.connectOutput( process.stdout );
}

buildPiping();
console.log( "Hello" );

