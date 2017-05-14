

var config = require ('./config.js');

var https = require( "./https_server.js" );
var idMan = require( "./id_manager.js");
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

		if( msg.op === "identify" ) {
			var e = Entity( msg.Λ );
			if( e ) {
				ws.entity = e;
				ws.protocol = ws.entity.emit( "connect", ws );
			} 
		}
		if( ws.protocol ) 
			return ws.protocol( msg );

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

var auth = null;

https.addProtocol( "karaway.core", (ws)=>{
    var state = 0;

    ws.on( "message", (msg)=>{
		//console.log( "got:", msg, ws.keyr )
		try {
	        	msg = JSON.parse( msg );
		} catch( err ){
			console.log( "protocol error.", msg );
			ws.close();
			return;
		}
        //console.log( "kc msg", msg );
		{
			if( msg.op === "hello" ) {
				var test = Entity.getEntity( msg.me );
				if( test && ( test.sandbox.config.run.Λ === msg.runkey ) ) {
					auth = test;
					ws.send( '{"op":"hello"}' )
				}
			}

			else if( msg.op === "auth" ) {
				if( !auth ) {
					ws.send( '{"op":"Error", "error":"Authentication service is not ready..."}' );
					ws.close();
					return;
				}
			//console.log( "from who? ", connection.remoteAddress );
			var a;
			a = msg.id;
			if( !a ) a = msg.key;

				console.log( "... get service" );
				ws.send( JSON.stringify( { op: "redirect", url:"wss://chatment.com:6000", protocol: auth.Λ+"karaway.core" } ) );
			}
			else if( msg.op === "getClientKey" ) {
				var client_id = idGen();
				if( "name" in msg ) {
					connection.login = db.createServiceLogin( msg.name, connection.remoteAddress, client_id );
				}
				ws.send( `{"op":"setClientKey","key":"${client_id}"}`)
				console.log( "sending a proper key...", client_id )
			}
			else {
				// protocol error; disconnect.
				console.log( "Protocol Error; disconnecting clinet.", msg );
				ws.close();
			}
		}
    })
    ws.on( "close", (evt,reason)=>{
	// this is a server close; no reconnect
    })
} )



function BigBang() {
	console.log( "Creating the void....");
	Entity.reloadAll( ()=>{
			// onLoadComplete
			//console.log( "Okay now ... how to start this?")

			MOOSE = Entity.getEntity( config.run.MOOSE );
			MOOSE.sandbox.io.command = shell.Filter( MOOSE.sandbox );

			//MOOSE.sandbox.require( "./startup.js" ); // still do first run on first object?

			run(); // enable discovery; services are stil loading...
			
		},
		()=>{
		Entity.create( null, "The Void", "Glistening transparent black clouds swirl in the dark.", (o)=>{
			console.log( "Creating first entity" );
			Entity.theVoid = o;

			o.create( "MOOSE", "Master Operator of System Entites.", (o)=>{
				config.run.MOOSE = o.Λ;
				config.commit();

					MOOSE = o;

					if( !("io" in o.sandbox) ) o.sandbox.io = {};

					MOOSE.sandbox.io.command = shell.Filter( o.sandbox );					
					o.sandbox.require( "./startup.js" );

					//var path = require.resolve( "./startup.js" ).replace( /\\/g, "/" );
					//shell.Script( o.sandbox, text.Text( path ) );
					Entity.saveAll();
					run();
			})
		} );
	});
}

//------------- some initial startup modes

config.start( BigBang );
//setTimeout( ()=>{
config.resume();
//}, 10000 );


var reassignments = [];
var d;

function run() {
    //var Cluster = require( './cluster.js' ).Cluster();
    var vfs = require( "./file_cluster.js" );
    var discoverer = require( "./util/discovery.js" );
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
                              var key = idMan.xor( idMan.xor( e.Λ, config.run.Λ ), parts[2] );
                              d.send( parts[2] + " YouAre " + key + " " + config.run.defaults.defaultPort, raddr, addr );
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
            require( "./https_server.js" ).Server( config.run.defaults.defaultPort );
            //discoverer.discover(
            //	{ onquery:()=>{return "YouAre"; }
            //);
        }
        , onconnect : ( sock ) => {
            var idGen = require( "./util/id_generator.js");
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
                        io.gun.put( { exec: args })
                } };

                //o.sandbox.io.gun.map( (val, field)=>{ console.log( "(Void)remote entity event:", field, val )});
                //o.sandbox.io.gun.put( {msg: "Hello" } );
				var merge1 = idMan.xor( config.run.Λ, o.Λ );
				var merge2 = idMan.xor( merge1, parts[0] );
				var merge3 = idMan.xor( parts[0], o.Λ );
                reassignments.find( (r)=>r.o===parts[0] ).n = merge1;
		
                d.send( merge3 + " YouAre " + merge2 + " " + config.run.defaults.defaultPort, raddr, addr );

                    //reassignments.splice( , 1 );
                } );
        }
        else if( r.n )
            d.send( config.run.Λ + " YouAre " + r.n + " " + config.run.defaults.defaultPort, raddr, addr );

    }
    d.dispatchPing(); // begin the discovery.

    //console.log( "Run is completed... setup discover" );
}


//discoverer.
