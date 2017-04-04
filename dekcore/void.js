

var config = require ('./config.js');

var https = require( "./https_server.js" );
var Entity = require( "./Entity/entity.js" );

Entity.gun = https.gun;
Entity.addService = https.addService;
Entity.addProtocol = https.addProtocol;

var shell = require( "./Sentience/shell.js" );
var text = require( "../org.d3x0r.common/text.js" )

var MOOSE;

var connections = [];

https.addProtocol( "entity-ethernet", (ws)=>{
    var state = 0;

    ws.on( "message", (msg)=>{
        msg = JSON.parse( msg.utf8Data );
        console.log( "msg", msg );
        if( msg.op === "serviceLogin" ) {
          //console.log( "from who? ", connection.remoteAddress );
          var a;
          a = msg.id;
          if( !a ) a = msg.key;
          console.log( "... get service" );
          connection.login = db.getServiceLogin( connection.remoteAddress, a );
          //console.log( "login is", connection.login )
          if( connection.login ) {
            connection.login.connection = connection;
            console.log( "got back a service....")
            //connection.login.connection = connection;
            Object.defineProperty( connection.login, "connection", { enumerable:false, value:connection } )
            db.updateServiceLogin( connection.login );
          }
          if( connection.login &&
            connection.login.authorized ) {
            connection.send( `{"op":"setClientKey","key":"${connection.login.cid}"}`);
          } else
            connection.send( `{"op":"noLogin"}`);
        }
        else if( msg.op === "getClientKey" ) {
          var client_id = idGen();
          if( "name" in msg ) {
            connection.login = db.createServiceLogin( msg.name, connection.remoteAddress, client_id );
          }
          connection.send( `{"op":"setClientKey","key":"${client_id}"}`)
          console.log( "sending a proper key...", client_id )
        }
    })
    ws.on( "close", (evt,reason)=>{

    })
} )

function BigBang() {
	console.log( "Creating the void....");
	Entity.create( null, "The Void", "Glistening transparent black clouds swirl in the dark.", (o)=>{
		Entity.theVoid = o;

		Entity.create( Entity.theVoid, "MOOSE", "Master Operator of System Entites.", (o)=>{
                MOOSE = o;

                o.sandbox.io.command = shell.Filter( o.sandbox );
                //obj o = {}; if( !"a" in o ) o.a = {}; o.a.b = 1;

                if( !("io" in o.sandbox) ) o.sandbox.io = {};
                o.sandbox.io.gun = https.gun.get( o.Λ );

                o.sandbox.io.gun.map( (val, field)=>{ console.log( "(Void)MOOSE event:", field, val )});
                //o.sandbox.io.gun.put( {msg: "Hello" } );
	       	  	var path = require.resolve( "./startup.js" ).replace( /\\/g, "/" );
                shell.Script( o.sandbox, text.Text( path ) );
		})
	} );
}

//------------- some initial startup modes

setTimeout( waitrun,10 );

function waitrun(){
    console.log( "Wait for config");
    if( !config.run.Λ)
    {
	    console.log( "wait some more then try again" );
        setTimeout(  waitrun, 10 );
    }
    else {
	    config.start( BigBang );
      	run();
    }
}

var reassignments = [];
var d;

function run() {
    //var Cluster = require( './cluster.js' ).Cluster();
    var idMan = require( "./id_manager.js");
    var vfs = require( "./file_cluster.js" );
    var discoverer = require( "./discovery.js" );
    d = discoverer.discover( { timeout: 1000
        , master : true
        , filter : false // expects to hear on localhost and/or same interfaces
        , onsend : (addr)=>{ return config.run.Λ + " WhoAmI" }
        , onquery : (msg, self,raddr,addr) => {
        	var parts = msg.split( " " );
                if( parts[0] === config.run.Λ )  {// is a message from myself.
                    //console.log( "From myself - ignore")
                    return null;
                }
                //console.log( "msg ", parts )
                if( parts[1] === "WhoAmI" ) {

                	if( idMan.Auth( parts[0] ) ) {
                      	// I know this ID....
                          console.log( "I know this ID?")
                        var e = Entity.getEntity( parts[0] );
                        if( e )  {
                            d.send( config.run.Λ + " YouAre " + e.Λ, raddr, addr );
                        } else {
                            // this is no longer valid; entity does not exist already.
                            // delete this key ( and all descendents keys )
                            idMan.delete( parts[0] );
                            reassign( parts, raddr, addr );
                        }
                    }
                    else {
                        reassign( parts, raddr, addr );
                    }
                } else if( parts[1] === "YouAre" ) {
                	// parts[2] == my new run ID...
                }
        }
        , ontimeout : ()=>{
            //console.log( "i'm all alone.", config.run.Λ, idMan.localAuthKey )
            // really all of my keys are on my config.run key anyway
            //   so this shouldn't be done here?
            idMan.setKeys( idMan.ID( idMan.localAuthKey ) );
            require( "./https_server.js" ).Server();
            //discoverer.discover(
            //	{ onquery:()=>{return "YouAre"; }
            //);
        }
        , onconnect : ( sock ) => {
            var idGen = require( "./id_generator.js");
            idMan.sync( sock );
        }
    })
    function reassign( parts, raddr, addr ) {
        console.log( "check...", reassignments )
        var r = null;
        if( !( r = reassignments.find( (r)=>r.o===parts[0] ) ) ) {
            reassignments.push( { o:parts[0] } );
            //console.log( "added for reassignment", parts[0] )
            MOOSE.create( "unassigned agent", "undefined...", (o)=>{

                if( !("io" in o.sandbox) ) o.sandbox.io = {};
                //console.log( "gun for remote listening on ", o.Λ)
                o.sandbox.io.gun = https.gun.get( o.Λ );
                o.sandbox.io.command = { processCommandLine : (args)=>{
                        args.break();
                        gun.get( o.Λ ).put( { exec: args })
                } };

                //o.sandbox.io.gun.map( (val, field)=>{ console.log( "(Void)remote entity event:", field, val )});
                //o.sandbox.io.gun.put( {msg: "Hello" } );
                    reassignments.find( (r)=>r.o===parts[0] ).n = o.Λ;
                    d.send( config.run.Λ + " YouAre " + o.Λ, raddr, addr );

                    //reassignments.splice( , 1 );
                } );
        }
        else if( r.n )
            d.send( config.run.Λ + " YouAre " + r.n, raddr, addr );

    }
    d.dispatchPing(); // begin the discovery.

    //console.log( "Run is completed... setup discover" );
}


//discoverer.
