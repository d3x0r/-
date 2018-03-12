
console.log( "Core Firewall Service." );

const os = require( 'os' );

const config = require( '../../config.js' );
const db = require( "./firewallDb.js" );
const idGen = require( "../id_generator.js" );
const driver = require( "./" + os.platform() + "FirewallDriver.js" );
const srg = require( "../../../org.d3x0r.common/salty_random_generator.js" );

const RNG = srg.SaltyRNG( (salt)=>salt.push( Date.now() ) );

// give the firewall driver to the database for things like reload
db.driver = driver;

var firewallInterface;

const l = {
	systems : new Map(),
	services : new Map(),
	availablePorts : [],
	usedPorts : [],
	firstPort : 0,
	mappablePorts : null,
	mappableCount : 0,
}

module.exports = exports = {
	server : null,
	init() {
		driver.reset();
		db.init();
		db.reload();
		this.setupAvailableMappings();
		this.registerProtocol();
	},
	setupAvailableMappings() {
		var ranges = config.run.defaults.routeablePorts;
		l.firstPort = config.run.defaults.firstServicePort;
		l.mappablePorts = ranges;
		var total = 0;
		ranges.forEach( range=> total += ( (range.to-range.from) + 1 ) );
		l.mappableCount = total;
	},
	registerProtocol() {
		if( this.server ) {
			this.server.addProtocol( "firweall", this.protocolHandler );
		}
		//l.mappablePorts = ranges;
	},

	allocatePort( onAddress, service, ws  ) {
		var system = l.systems.get( onAddress );
		if( !system ) {
			system = { address: onAddress,
			           availablePorts : [],
			           usedPorts : [],
			           firstPort : l.firstPort
			};
			l.systems.set( onAddress, system );
		}
		var nextPort;
		if( system.availablePorts.length )
			nextPort = system.availablePorts.shift();
		else
			nextPort = system.firstPort++;
		var portDef;
		system.usedPorts.push( portDef = { service: service, port: nextPort, ws:ws } );
		{
			var service = l.services.get( service );
			if( !service ) {
				l.services.set( service, service = [] );
			}
			service.push( portDef );
		}
		return nextPort;
	},

	releasePort(port) {
		var idx = l.usedPorts.findIndex( p=>p===port );
		l.usedPorts.slice( idx, 1 );
		l.availablePorts.push( port );
	},

	requestServicePeers( service, ws ) {
		var svc = l.services.get( service );
		if( !svc ) {
			return undefined;
		}
		else {
			var result = [];
			svc.forEach( s=>{
				if( s.ws !== ws )
					result.push( s );
			});
			return result;
		}
	},

	requestService( service ) {
		var svc = l.services.get( service );
		if( !svc ) {
			return undefined;
		}
		else {
			var x = RNG.getBits( 16 );
			var s = svc[x%svs.length];
			var port = getExternalPort();
			var msg;
			s.ws.send( JSON.stringify( msg = { op:"serviceMap", key:idGen.generator(), port:port } ) );
			return msg;
		}
	},

	protocolHandler( ws) {
		console.log( "Received connection to firewall")
		ws.on( "message", (_msg)=>{
			var msg = JSON.parse( _msg );
			if( msg.op === "hello" ) {
				ws.send( "{'op':'hello'}" );
			} else if( msg.op === "requestPort" ) {
				var port = this.allocatePort( msg.address, msg.service );
				ws.send( JSON.stringify( {op:"replyPort", port:port} ) );
			} else if( msg.op === "requestService" ) {
				var service = this.requestService( msg.service );
				ws.send( JSON.stringify( {op:"replyPort", port:port} ) );
			} else if( msg.op === "requestPeers" ) {

			} else {
				console.log( "Unhandled Message recieved in fireawll Main:", _msg );
			}
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
