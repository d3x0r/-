
console.log( "Core Firewall Service." );

const os = require( 'os' );

const config = require( '../../config.js' );
const db = require( "./firewallDb.js" );

const driver = require( "./" + os.platform() + "FirewallDriver.js" );
const srg = require( "../../../org.d3x0r.common/salty_random_generator.js" );
const IdGen = require( "../id_generator.js")
const RNG = srg.SaltyRNG( (salt)=>salt.push( Date.now() ) );

// give the firewall driver to the database for things like reload
db.driver = driver;

var firewallInterface;

const l = {
	availablePorts : [],
	pendingAllocation : [],
	usedPorts : [],
	firstPort : 0,
	mappablePorts : null,
	mappableCount : 0,
}

module.exports = exports = {
	server : null,
	localAddress : null,
	init( remote, cbFinished ) {
		driver.reset();
		db.reload();
		//this.setupAvailableMappings();
		openHello(remote, cbFinished);
	},
	registerProtocol(protocol) {
		//this.server.addProtocol( "firweall", this.protocolHandler );
	},

	allocatePort( serviceName, callback ) {
		l.pendingAllocation.push( callback );
		ws.send( JSON.stringify( {op:"requestPort", address: config.addresses.join(""), service:serviceName }))
	},

	releasePort(port) {
		var idx = l.usedPorts.findIndex( p=>p===port );
		l.usedPorts.slice( idx, 1 );
		l.availablePorts.push( port );
	},


	protocolHandler( ws) {
		ws.on( "message", (_msg)=>{
			var msg = JSON.parse( _msg );
			if( msg.op === "replyPort" ) {
				var cb = l.pendingAllocation.shift();
				cb( msg.port );
			} else if( msg.op === "addPeer" ) {
				console.log( "Service has a new peer...", msg.service, msg.address );
			} else if( msg.op === "peerList" ) {
				console.log( "Received a list of service peers:", _msg );
			} else {
				console.log( "Unknown message received:", _msg );
			}
		})
		ws.on( "error", (a,b)=>{
			console.log( "websocket error:", a, b );
		});
		ws.on( "close", ()=>{
			console.log( "Fireawll server connection closed.")
		} );
	}
}

function getExternalPort() {
	var port = RNG.getBits( 16 );
	var found = 0;
	while( !found ) {
		l.mappablePorts.find( range=>{
			if( port < ( range.to-range.from + 1 ) ) {
				found = range.from + port;
				return true;
			} else {
				port -= range.to-range.from;
			}
			return false;
		} );
	}
	return found;
}


//-----------------------------------------

const WebSocket = require('ws');
var ws = null;

function openHello( remote, callback ) {
	console.log( "Connect to core firewall...." );

	var confirmed = false;
	console.log( "Connect:", remote )
	ws = new WebSocket( "wss://" + remote, ["firewall.core"], {
		perMessageDeflate: false
	});
	var runkeyt;
	var runkeyr;

	ws.on( "open", ()=>{
		console.log( "remote opened..." );
		var tmpkey = IdGen.generator();
		runkeyt = IdGen.xkey( tmpkey, 0 );
		runkeyr = IdGen.xkey( tmpkey, 1 );

		//console.log( "connect: ", config.run.Λ );
		console.log( "This should be a more dynamic key?", tmpkey );
		ws.send( tmpkey );
		ws.send = ((orig)=>(buf)=>orig(IdGen.u8xor( buf,runkeyt) ) )(ws.send.bind(ws))
		ws.send( JSON.stringify( {op:"hello" } ) );
	})

	ws.on( "message", (msg)=>{
		try {
			msg = JSON.parse( IdGen.u8xor(msg,runkeyr) );
		} catch(err) {
		// protocol error.
		console.log( "ID manager Protocol error", err );
		ws.close();
		return;
	}
		//if( !ws.key ) { ws.key = {key:msg,step:0};return }
			console.log( "ext hello got:", msg );
			if( msg.op === "hello") {
				console.log( "server accepted our hello..." );
				callback();
				//confirmed = true;
				//ws.close();
			}
			else if( msg.op === "key") {
				var id = pendingKeys.findIndex( key=>key.key === msg.key );
				if( id >= 0 ) {
					var req = pendingKeys[id];
					pendingKeys.splice( id, 1 );
					req.callback( msg.newKey );
				}else {
					ws.close();
				}
			}
			else if( msg.op === "error" ) {
				alert( msg.error );
		}
		else console.log( "what the hell??")
	});

	ws.on( "close", ()=>{
		if( !confirmed  ) {
			console.log( "remote closed..." );
			// without set timeout; I have no throttle control ....
			openHello();
		}
	})
}
exports.openHello = openHello;
