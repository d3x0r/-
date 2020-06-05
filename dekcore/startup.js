
async function buildPiping(){
      // opens our internal weak parser on the current object.
      // only one of these can work though. 
//	var webCons = require( './command_stream_filter/webConsole.js' ).Filter();

    //var cons = require( './command_stream_filter/psi_console.js' ).Filter();
    require( "./Sentience/shell.js" ).then( shellFilter=>{

    console.log( "Pipiing filter is:", shellFilter );
    process.stdout.write( util.format("Piping got:", shellFilter ));

   const shell = shellFilter.Filter( this );
    require(  './command_stream_filter/strip_newline.js' ).then( (newline)=>{
      console.log( "So the thing ran, resulted, and we got back the result??")
      require( './command_stream_filter/monitor_filter.js' ).then( monitor=>{
      //var commandFilter = require( './command_stream_filter/command.js');

      //var shell = io.command;
      var nl = newline.Filter();
      //var cmd = commandFilter.Filter();

      nl.connectInput( process.stdin );
      nl.connectOutput( shell.filter );
      shell.connectOutput( process.stdout );
      });
    })
  }).catch(err=>console.log("Require Failed:", err));
}

await buildPiping();

console.log( "Hello from startup.js" );//, Object.keys(this) );

if( resume ) {
	console.log( "Okay this a resuming thing so..." );
	//firewall = entity.get( config.run.firewall );
	//auth = entity.get( config.run.auth );
  //auth.run( {path:"memory://", file:"startup auth" }`io.firewall = io.getInterface( "${firewall.Λ}", "firewall" );` );

}
else {

  has("Command And Control").catch( ()=>{
    create( "Command And Control", "user manager", "userManagerStartup.js" );
  })

  has("MOOSE-HTTP").catch( ()=>{
    create( "MOOSE-HTTP", "(HTTP)Master Operator of System Entites.", "startupWeb.js" )
  });
  
  //create( "Command And Control-HTTP", "http MOOSE console", "webShell/shellServer.js" );

  // these are private To MOOSE anyway... so they're not a lot of good?
  var services = null;
  var firewall = null;
  var auth = null;
  console.log( "------- create services ------------")
  return create( "Services"
      , "Service Directory Manager and authenticator"
      , "services/services/serviceService.js"
  ).then( (o)=>{
  console.log( "------- create firewall ------------")
    services = o;
    create( "Firewall"
      , "Your basic iptable rule manager"
      , "services/firewall/firewallService.js"
      ).then( (o)=>{
      firewall = o;
      console.log( "------- run some code on firewall/serivces? ------------")
      
      services.run( {path:"memory://", src:"startup services" }, 'io.firewall = io.getInterface( "firewall" );' );

      create( "userAuth", "User authentication service", "uiServer/userAuth/userProtocol.js").then( (o)=>{
          auth = o;
          auth.run( {path:"memory://", src:"startup UserAuth services" }, `io.firewall = io.getInterface( "${firewall.Λ}", "firewall" );` );
        })
    } )

  } )

}
//firewall.run(  )

