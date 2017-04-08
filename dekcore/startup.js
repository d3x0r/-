

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



entity.create( "Command And Control-HTTP", "http MOOSE console", "webShell/shellServer.js" );

var services = null;
var firewall = null;
var auth = null;
entity.create( "Services", "Service Directory Manager and authenticator", "services/services/serviceService.js", (o)=>{
  services = o;
  entity.create( "Firewall", "Your basic iptable rule manager", "services/firewall/firewallService.js", (o)=>{
    firewall = o;
    services.run( 'io.firewall = io.openDriver( "firewall" );' );
    entity.create( "auth", "User authentication service", "services/auth/authService.js", (o)=>{
      auth = o;
      auth.run( 'io.firewall = io.openDriver( "firewall" );' );
    })
} )

} )

//firewall.run(  )

