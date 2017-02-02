

function buildPiping(){
      // opens our internal weak parser on the current object.
      // only one of these can work though. 
    var newline = require(  './command_stream_filter/strip_newline.js' );
    var monitor = require( './command_stream_filter/monitor_filter.js' );
    var commandFilter = require( './command_stream_filter/command.js');

    var shell = io.command;
    var nl = newline.Filter();
    var cmd = commandFilter.Filter();
    var mon1 = monitor.Filter();
    var mon2 = monitor.Filter();
    
    nl.connectInput( process.stdin );
    nl.connectOutput( shell.filter );
    shell.connectOutput( process.stdout );
}

buildPiping();

console.log( "Hello from startup.js" );//, Object.keys(this) );

entity.create( "Command And Control", (o)=>{
   var shell = require( "shell.js" );
   var text = require( "../../../org.d3x0r.common/text.js" );
   shell.Script( o.sandbox, text.Text("userManagerStartup.js") );


} )