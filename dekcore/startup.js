

function buildPiping(){
      // opens our internal weak parser on the current object.
      // only one of these can work though. 
    var newline = require(  './command_stream_filter/strip_newline.js' );
    var monitor = require( './command_stream_filter/monitor_filter.js' );
    var commandFilter = require( './command_stream_filter/command.js');
    var shell = io.command;
    var nl = newline.Filter();
    var cmd = commandFilter.Filter();
    
    nl.connectInput( process.stdin );
    nl.connectOutput( shell.filter );
    shell.connectOutput( process.stdout );
}

buildPiping();

console.log( "Hello from startup.js" );//, Object.keys(this) );

if( resume ) {
	console.log( "Okay this a resuming thing so..." );
}
else {

entity.create( "Command And Control", "user manager", "userManagerStartup.js" )

//entity.create( "Command And Control-HTTP", "http MOOSE console", "webShell/shellServer.js" );

entity.create( "userAuth", "Layer 0 Account Managment", "./uiServer/userAuth/userProtocol.js" );

// these are private To MOOSE anyway... so they're not a lot of good?
var services = null;
var firewall = null;
var auth = null;
console.log( "------- create servcies ------------")
entity.create( "Services"
		, "Service Directory Manager and authenticator"
		, "services/services/serviceService.js"
		, (o)=>{
console.log( "------- create firewall ------------")
  services = o;
  entity.create( "Firewall"
		, "Your basic iptable rule manager"
		, "services/firewall/firewallService.js"
		, (o)=>{
    firewall = o;
console.log( "------- run some code on firewall/serivces? ------------")
    services.run( 'io.firewall = io.openDriver( "firewall" );' );
    entity.create( "userAuth", "User authentication service", "uiServer/userAuth/userProtocol.js", (o)=>{
      auth = o;
      auth.run( 'io.firewall = io.openDriver( "firewall" );' );
       })
   } )

} )

}
//firewall.run(  )

