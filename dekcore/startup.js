

async function buildPiping(){
      // opens our internal weak parser on the current object.
      // only one of these can work though. 
//	var webCons = require( './command_stream_filter/webConsole.js' ).Filter();

    //var cons = require( './command_stream_filter/psi_console.js' ).Filter();
   
    var newline = await require(  './command_stream_filter/strip_newline.js' );
    var monitor = await require( './command_stream_filter/monitor_filter.js' );
    //var commandFilter = require( './command_stream_filter/command.js');

    var shell = io.command;
    var nl = newline.Filter();
    //var cmd = commandFilter.Filter();

    nl.connectInput( process.stdin );
    nl.connectOutput( shell.filter );
    shell.connectOutput( process.stdout );
}

buildPiping();

console.log( "Hello from startup.js" );//, Object.keys(this) );

if( resume ) {
	console.log( "Okay this a resuming thing so..." );
	firewall = entity.get( config.run.firewall );
	auth = entity.get( config.run.auth );
    	auth.run( `io.firewall = io.getInterface( "${firewall.Λ}", "firewall" );` );

}
else {

create( "Command And Control", "user manager", "userManagerStartup.js" )

create( "MOOSE-HTTP", "(HTTP)Master Operator of System Entites.", "startupWeb.js" )

//create( "Command And Control-HTTP", "http MOOSE console", "webShell/shellServer.js" );

// these are private To MOOSE anyway... so they're not a lot of good?
var services = null;
var firewall = null;
var auth = null;
console.log( "------- create services ------------")
create( "Services"
		, "Service Directory Manager and authenticator"
		, "services/services/serviceService.js"
		, (o)=>{
console.log( "------- create firewall ------------")
  services = o;
  create( "Firewall"
		, "Your basic iptable rule manager"
		, "services/firewall/firewallService.js"
		, (o)=>{
		//config.run.firewall = o.Λ;
		//config.commit();
    firewall = o;
console.log( "------- run some code on firewall/serivces? ------------")
    
    services.run( 'io.firewall = io.getInterface( "firewall" );' );

    create( "userAuth", "User authentication service", "uiServer/userAuth/userProtocol.js", (o)=>{
		auth = o;
		//config.commit();
      auth = o;
      auth.run( `io.firewall = io.getInterface( "${firewall.Λ}", "firewall" );` );
       })
   } )

} )

}
//firewall.run(  )

