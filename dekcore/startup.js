
async function buildPiping(For){
      // opens our internal weak parser on the current object.
      // only one of these can work though. 
    require( "./Sentience/shell.js" ).then( shellFilter=>{

   const shell = shellFilter.Filter( For );
    require(  './command_stream_filter/strip_newline.js' ).then( (newline)=>{
      //console.log( "So the thing ran, resulted, and we got back the result??")
      //require( './command_stream_filter/monitor_filter.js' ).then( monitor=>{
        //var commandFilter = require( './command_stream_filter/command.js');
        //console.log( "And monitor result?", monitor )
        //var shell = io.command;
        var nl = newline.Filter();
        //var cmd = commandFilter.Filter();

        nl.connectInput( process.stdin );
        nl.connectOutput( shell.filter );
        shell.connectOutput( process.stdout );
       //   console.log( "If the main process did their stdout we'd be gold?");
     //});
    })
  }).catch(err=>console.log("Require Failed:", err));
}

await buildPiping(this);  // attach console to 'The Void'

console.log( "Hello from startup.js" );//, Object.keys(this) );

if( resume ) {
	console.log( "Okay this a resuming thing so..." );
}
else {
  has("Command And Control").catch( ()=>{
    create( "Command And Control", "user manager", "userManagerStartup.js" );
  })

  has("MOOSE-HTTP").catch( ()=>{
    create( "MOOSE-HTTP", "(HTTP)Master Operator of System Entites.", "startupWeb.js" )
  }).then( (a)=>{
    console.log( "Already have http moose?");
  });
  
  //create( "Command And Control-HTTP", "http MOOSE console", "webShell/shellServer.js" );

  // these are private To MOOSE anyway... so they're not a lot of good?
  var services = null;
  var firewall = null;
  var auth = null;
  console.log( "------- create services ------------")
  has( "services").catch( ()=>{
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
  }).then( ()=>{
    console.log( "Services object already exists...");
  })
}
//firewall.run(  )

