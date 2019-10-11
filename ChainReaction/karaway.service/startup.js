const _debug = false;

var myName = "chainReaction";
if( process.argv > 2 ) {
	myName = process.argv[2];
}

console.log( "Hello from chainReaction startup script" );

//console.log( "This:", Object.keys( global ) );
const idGen = require( 'id_generator.js' );

const vfs = require( 'sack.vfs');
const JSOX = vfs.JSOX;

const externalIP = config.run.addresses[0].address;
const internalIP = config.run.internal_addresses[0].address;

const firewall = require( "util/firewall/firewallServiceRemote.js" );
const certGen = require( "util/keyMaster/keyServiceRemote.js" );
const https = require( "/https_server.js" );
https.certGen = certGen;

const connectionKeys = new Map();
var userDb;

const nativeVol = vfs.Volume();
const chatCoreExtensions = nativeVol.read( "remoteMethods.js" ).toString();
const jsonChatCoreExtensions = JSOX.stringify( chatCoreExtensions );


certGen.init( config.run.identity.raddr.address+":"+config.run.identity.parts[3], ()=>{
	// adds 'global' protocol handler
	https.addProtocol( myName, (conn)=>{
		conn.player = null;
        	// keep connection and auto timeout for idle?
		conn.on( 'message',(_msg)=>{
			if( !conn.player ) {
				var connKey = connectionKeys.get( _msg );
				if( !connKey ) {
					//firewall.
					console.log( "bad connection key.", _msg);
				}
				conn.player = {
					connKey : connKey,
					lobby : null,
					game : null,
					player : null,
				};
				return;
			}
			try { 
				var msg = JSOX.parse( _msg );
			} catch(err) {
				conn.close();
				return;
			}
			if( msg.op == "hello" ) {
				conn.send( `{op:"addMethod",code:${jsonChatCoreExtensions}}` );
			} else if( msg.op == "msg" ) {
			} else
				handleMessage( conn, msg, _msg );
		})
		conn.on( "close", (code, reason)=>{
					console.log( "do something on close?" );
					if( conn.player ) {
						if( conn.player.game ){
							var game = conn.player.game;
							var player = game.players.find( player=>player.ws===conn);
							if( player ) {
								if( player.host ){
									var p;
									for( p = 1; p < game.players.length; p++ ) {
										if( game.players.ws ) {
											game.players.ws.send( JSOX.stringify( {op:"gameAbort"}));
										}
									}
									var gi = games.findIndex( g=>g===game);
									if( gi >= 0 ){
										games.splice( gi, 1 );
									}
									return;
								}
								player.ai = true;
								player.ws = null;
								var p;
								for( p = 1; p < game.players.length; p++ ) {
									if( game.players.ws ) {
										game.players.ws.send( JSOX.stringify( {op:"playerDisconnect", id:player.id }));
									}
								}
							}
						}
					}
                } );
	} );

	// firewall is used in this module in order to get the target
	// AUTH service, does not allocate a port.
	firewall.setOnServiceRegistered( serviceAvailable );
	firewall.init( externalIP, internalIP, config.run.identity.raddr.address + ":" + config.run.identity.parts[3]
		, addMapping
		, handleFirewallMessage
		, /*init*/()=>{
			firewall.allocatePort( myName, (port,sid)=>{
				https.Server("no.domain"
					, port // use assigned port
					, true // serve on internal addresses
					, null // no content server
					, ()=>{
						firewall.serviceAvailable( sid );
						//firewall.serviceAvailable( mySid );
				
						console.log( "https completed." );
					});
			});
		}
	);
} );

function addMapping( id, opts ) {
	console.log( "expecting:", id, opts );
	connectionKeys.set( id, { id:id } );
}

function handleFirewallMessage (ws,msg){
	//x( parts[2], parts[3], raddr );
	return false; // no direct communcation on firewall.
} 

function serviceResult( service ) {
	// service is a websocket connection to the service.
	// the connection will have connected and received service
	// extnesions before being received here.
	// so service is a live object to communicate with the service.
	userDb = service;
}

function serviceAvailable( service,sid ) {
	console.log( "Service has become available... ", service );
	if( service === "userDatabase") {
		//firewall.requestService( service, serviceResult /*,false*/ ); // can disable auto connection?
	}
}


var lobbies = [];
var games = [];

function createGame( name, players, width, height ) {
	var game = {
		id:idGen.generator(),
		name:name,
		players:[],
		player:0, // current turn
		width:width,
		height:height
	}
	game.players.push( {
		id : 0,
		ai : false,
		host : true,
		ws : null,
	})
	for( var p = 1; p < players; p++ )
		game.players.push( {
			id : p,
			ai : true,
			host : false,
			ws : null,
		})
	return game;
}

function handleMessage( ws, msg, _msg ) {
	_debug && console.log( "chainReact got", msg );

	if( msg.op == "foyer" ) {
		ws.send( JSOX.stringify( { 
			op: "foyer"
			, games : games.map( lobby=>({ 
					id:lobby.id
					, name:lobby.name
					, players:lobby.players.length
					, player : 0
					, width:lobby.width
					, height:lobby.height
				}) ) 
		} ) );
	}
	else if( msg.op == "lobby" ) {
		var lobby = lobbies.find( lobby=>lobby.id=msg.id );
		if( lobby ) {
			lobby.players.push( ws );
			ws.send( JSOX.stringify( {op:"lobby", status:true } ) );
		} else {
			ws.send( JSOX.stringify( {op:"lobby", status:false } ) );
		}		
	}
	else if( msg.op == "send" ) {
		var lobby = ws.player.lobby;
		var sendMsg = JSOX.stringify( {op:'send', from:ws.player.connKey.user } );
		if( lobby )
			lobby.players.forEach( sendTo=>sendto!==ws.player?sendTo.send( sendMsg ):0 );
	}                                     
	else if( msg.op == "createGame" ) {
		var game;
		games.push( game = createGame( msg.name, msg.players, msg.width, msg.height ) );
		game.players[0].ws = ws;
		ws.player.game = game;
		ws.player.player = game.players[0];
		ws.send( JSON.stringify( {op:"initGame", width:msg.width, height:msg.height, players:msg.players}))
	}
	else if( msg.op == "joinGame" ) {
		var game = ws.games.find( game=>game.id ===msg.id );
		if( !game ){
			ws.send( JSOX.stringify( {op:"joinFail"} ) );
			return;
		}
		var slot = game.players.find( player=>player.ai);
		if( slot ){
			slot.ai = false;
			slot.ws = ws;
			ws.player.game   = game;
			ws.player.player = slot;
		}
		ws.send( JSOX.stringify( {op:"initGame", width:slot.width,height: slot.height, players:game.players.length }))

	}
	else if( msg.op == "startGame" ) {
		// pick random player, and announce to go.

	}
	else if( msg.op == "putPiece" ) {
		// pick random player, and announce to go.
		var moveOk = false;
		var thisPlayer = ws.player.game.players[ws.player.game.player];
		if( thisPlayer.ai ) {
			if( ws.player.player === ws.player.game.players[0] ){
				moveOk = true;
			}
		}
		if( thisPlayer === ws.player.player ) {
			moveOk = true;
		}
		if( moveOk ){
			msg.id = ws.player.game.player;
			_msg = JSOX.stringify( msg );
			ws.player.game.players.forEach( player=>{
				if( player.ws )
					player.ws.send( _msg );
			})
			ws.player.game.player = (ws.player.game.player+1) 
				% ws.player.game.players.length;

			var nextPlayer = ws.player.game.players[ws.player.game.player] ;
			if( nextPlayer.ws )
				nextPlayer.ws.send( JSOX.stringify({op:"yourMove" } ));
			else {
				ws.player.game.players[0].ws.send( JSOX.stringify({op:"aiMove" } ) )
			}
							
		} else {
			ws.send( JSOX.stringify( {op:"waitTurn"}));
		}
	}
	else if( msg.op == "leaveGame" ) {
	}

}
