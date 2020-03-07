

var args = process.argv;
var startScript = "startup.js";
for( var arg = 2; arg < args.length; args++ ) {
	if( args[arg][0] == '-' ) {
		if( args[arg][0] === '-start' ) {
			startScript = args[arg+1];
			arg++;
		}
	}
}
const wt = require( 'worker_threads');
global.isMainThread = wt.isMainThread;
const sack = require( "sack.vfs" );
const JSOX=sack.JSOX;
var config = require ('./config.js');
const fc = require( "./file_cluster.js" );
const certGen = require( "./util/keyMaster/keyService.js" );
var https = require( "./https_server_v2.js" );
var server = require( "./serve.js" );
var idMan = require( "./id_manager.js");
var Entity = require( "./Entity/entity.js" );
Entity.idMan = idMan;
var idGen = require( "./util/id_generator.js");

Entity.gun = https.gun;
Entity.addService = https.addService;
Entity.addProtocol = https.addProtocol;


var MOOSE;


https.addProtocol( "entity-ethernet", (ws)=>{
    var state = 0;

    ws.on( "message", (msg)=>{
        msg = JSOX.parse( msg.utf8Data );
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


//var authDb = require( './uiServer/userAuth/userDatabase.js' );

https.addProtocol( "dekware.core", (ws)=>{
    var state = 0;

    ws.on( "message", (msg)=>{
		//console.log( "got:", msg, ws.keyr )
		try {
	        msg = JSOX.parse( msg );
		} catch( err ){
			console.log( "protocol error.", msg );
			ws.close();
			return;
		}
	        console.log( "dc msg", msg );
		{
			if( msg.op === "hello" ) {
				var test = Entity.getEntity( msg.me );
				if( test && ( test.sandbox.config.run.Λ === msg.runkey ) ) {
					auth = test;
					ws.send( '{"op":"hello"}' )
				}
			}

			else if( msg.op === "auth" ) {
				if( !authDb ) {
					ws.send( '{"op":"Error", "error":"Authentication service is not ready..."}' );
					ws.close();
					return;
				}
				//console.log( "from who? ", connection.remoteAddress );
				var a;
				a = msg.id;
				if( !a ) a = msg.key;

				console.log( "... get service" );
				ws.send( JSOX.stringify( { op: "redirect", url:"wss://chatment.com:6000", protocol: auth.Λ+"karaway.core" } ) );
			}
			else if( msg.op === "createUser" ) {
				var result = authDb.createUser();
				
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



async function BigBang() {
	console.log( "Creating the void....");
		Entity.create( null, "The Void", "Glistening transparent black clouds swirl in the dark.", (o)=>{
			console.log( "Creating first entity" );
			Entity.theVoid = o;

			o.create( "MOOSE", "Master Operator of System Entites.", (o)=>{
				config.run.MOOSE = o.Λ;
				config.commit();
				console.log( "Got mose created..." );
					MOOSE = o;
					if( !o.thread ) o.wake().then( async ()=>{
						process.stdin.pipe( o.thread.worker.stdin );
						console.log( "requiring start script", startScript );
						await o.require( startScript );
						console.log( "Does this never resolve?" );
					}).catch( (err) =>{
						console.log( "Void Startup Wake failed:", err );
					})
					console.log( "Thread woken... but async still?");
					if( o.thread ){
					}
					/*
					// still might support semi-animated objects....
					if( o.sandbox ) {
						if( !("io" in o.sandbox) ) o.sandbox.io = {};
						MOOSE.sandbox.io.command = shell.Filter( o );
						o.sandbox.require( startScript );
					}
					*/

			})
			//o.create( "MOOSE-HTTP", "(HTTP)Master Operator of System Entites.", (o)=>{
					//o.sandbox.require( "startupWeb.js" );
			//})
		} );
	//});
}

//------------- some initial startup modes
var discoverId = idGen.generator();

config.start( run );
config.resume();


var d;

function run() {
	//console.log( "RUN" );
	var vfs = require( "./file_cluster.js" );
	var discoverer = require( "./util/discovery.js" );

	d = discoverer.discover( { timeout: 1000
        , master : true
        , filter : false // expects to hear on localhost and/or same interfaces
        , onsend : (addr)=>{ return discoverId + " identify " +  idMan.xor( discoverId, config.Λ ) + " The Void" }
        , onquery : (msg, self,raddr,addr) => {
        	var parts = msg.split( " " );
                if( parts[0] === discoverId )  {// is a message from myself.
                    //console.log( "From myself - ignore")
                    return null;
                }
                //console.log( "msg ", parts )
                if( parts[1] === "identify" ) {
			var rid = idMan.xor( parts[0], parts[2] );
			mapRemote( d, parts, rid, raddr, addr );
                } else if( parts[1] === "identity" ) {
			console.log( "I've been told to be someone else?", parts );
                	// parts[2] == my new run ID...
                }
        }
        , ontimeout : ()=>{
            console.log( "i'm all alone.", config.run.Λ, JSOX.stringify(idMan.localAuthKey,null,3) )
            // really all of my keys are on my config.run key anyway
			//   so this shouldn't be done here?
			//idMan.ID( idMan.localAuthKey, (id)=>{ idMan.setKeys( id ); } ) 
			certGen.init();
			https.certGen = certGen;

            var publicServer = https.Server( ["localhost", "d3x0r.org"], config.run.defaults.defaultPort, true, server, (serverArray)=>{
				serverArray.forEach( certGen.registerProtocol.bind(certGen) );
			} );
            //var localServer = https.Server( config.run.defaults.defaultPort+1, true );

            BigBang();
        }
        , onconnect : ( sock ) => {
            //var idGen = require( "./util/id_generator.js");
            console.log( "connect socket worked from discover" );
            idMan.sync( sock );
        }
    })
    d.dispatchPing(); // begin the discovery.

    //console.log( "Run is completed... setup discover" );
}

var reassignments = [];
function reassign( parts, rid, raddr, addr ) {
	console.log( "check...", reassignments )
	var r = null;
	if( !( r = reassignments.find( (r)=>r.o===parts[0] ) ) ) {
		reassignments.push( { o:parts[0], n:null, m:null } );
		var name = parts.slice( 3 ).join( " " );
		//console.log( "added for reassignment", parts[0] )
		MOOSE.create( name, "Remote Proxy", (o)=>{
			console.log("remote parts:", parts, o.Λ)
			saveRemotes();
			if( !("io" in o.sandbox) ) o.sandbox.io = {};
			//console.log( "gun for remote listening on ", o.Λ)
			//o.sandbox.io.gun = https.gun.get( o.Λ );
			o.sandbox.io.command = { processCommandLine : (args)=>{
				args.break();
				console.log( "need to do something to send this command...." );
				//io.gun.put( { exec: args })
			} };
			console.log("remote parts:", parts, o.Λ)
			//o.sandbox.io.gun.map( (val, field)=>{ console.log( "(Void)remote entity event:", field, val )});
			//o.sandbox.io.gun.put( {msg: "Hello" } );
			var merge1 = idMan.xor( config.run.Λ, o.Λ );
			var merge2 = idMan.xor( merge1, parts[0] );
			var merge3 = idMan.xor( merge1, rid );
			remotes.set( rid, o.Λ );

			var assignment = reassignments.find( (r)=>r.o===parts[0] );
			assignment.n = o.Λ;
			assignment.m = rid;
			var msg = merge1 + " identity " + merge3 + " " + config.run.defaults.defaultPort ;
			console.log( "Send 1:", msg );
			d.send( merge1 + " identity " + merge3 + " " + config.run.defaults.defaultPort, raddr, addr );

				//reassignments.splice( , 1 );
			} );
	}
	else if( r.n ) {
			var msg = idMan.xor( config.run.Λ, r.n ) + " identity " + idMan.xor( idMan.xor( config.run.Λ , r.n ), rid ) + " " + config.run.defaults.defaultPort;
			console.log( "Send 2:", msg );
		d.send( idMan.xor( config.run.Λ, r.n ) + " identity " + idMan.xor( idMan.xor( config.run.Λ , r.n ), rid ) + " " + config.run.defaults.defaultPort, raddr, addr );
	}

}

function recoverRemotes() {
	fc.reload( config.run.defaults.dataRoot + "/maps.json", (error, buffer) => {
		if( error ) {
			console.log( "Initial run? No Remotes?", error );
		}else {
			fc.Utf8ArrayToStr( buffer )
			try {
				var loaded_map = JSOX.parse(data);
				Object.keys(loaded_map).forEach((mapid) => {
					//console.log( "key and val ", keyid, val );
					var key = remotes.set( mapid, loaded_map[keyid]);
					console.log( "recover map", mapid, loaded_map[keyid] )
				});
			} catch(err){
				console.log( "Failed to recover remotes:", err );
			}

		}
	} );
}

function saveRemotes() {
	var out = {};
	remotes.forEach( (a,b)=>{
		out[b] = a;
	})
	fc.store( config.run.defaults.dataRoot + "/maps.json", (error)=>{
		console.log( "Fatal saving it:", error );
	})
}

var remotes = new Map();

function mapRemote( d, parts, rid, raddr, addr ) {
	//console.log( "remote args:", d, "p:", parts, "rid:", rid, "Entity:", Entity )
	console.log( "remote args:", d, "p:", parts, "rid:", rid  )
	var remap = remotes.get( rid );
	if( !remap ) {
		reassign( parts, rid, raddr, addr );
	}
	else {
		console.log( "Got map:", remap );
		var e = Entity.getEntity(remap);
		console.log( "e:", JSOX.stringify(e,null,"\t") );
		var replyKey = null;
                var key = idMan.xor( replyKey = idMan.xor( e.Λ, config.run.Λ ), rid );
		console.log( "Send 0?", replyKey + " identity " + key + " " + config.run.defaults.defaultPort );
		d.send( replyKey + " identity " + key + " " + config.run.defaults.defaultPort, raddr, addr );

	}
	if( idMan.Auth( rid ) ) {
		// I know this ID....
		  console.log( "I know this ID?")
		  var e = Entity.getEntity( rid );
		  if( e )  {
			var replyKey = null;
			  var key = idMan.xor( replykey = idMan.xor( e.Λ, config.run.Λ ), rid );
			console.log( "send 0a?", replyKey + " identity " + key + " " + config.run.defaults.defaultPort );
			  d.send( replyKey + " identity " + key + " " + config.run.defaults.defaultPort, raddr, addr );
		  } else {
			// this is no longer valid; entity does not exist already.
			// delete this key ( and all descendents keys )
			console.log( "Remote should actually be.... REASSIGN ")
			reassign( parts, rid, raddr, addr );
		  }
	}
	else {
		reassign( parts, rid, raddr, addr );
	}

}




//discoverer.
