const _debug = false;
_debug && console.log( "Core Key Service." );

const os = require( 'os' );

const config = require( '../../config.js' );
//const db = require( "./keyDb.js" );
const IdGen = require( "../id_generator.js")
const sack = require( 'sack.vfs' );
const TLS = sack.TLS;
const WebSocket = sack.WebSocket.Client;

var ws = null;

const l = {
	keyMasterAddress : null,
	pending : [],
	//caUsers : []
}

module.exports = exports = {
	init( remote, cbFinished ) {
		//console.log( "Set public address as:", remote );
		l.keyMasterAddress = remote;
		openHello(remote, cbFinished);
	},
	genCert( opts, cb ) {
			if( ws.readyState == sack.WebSocket.readyStates.OPEN ) {
			//console.log( "Assuming hello connected, should be able to ask core for a certificate?" );
			l.pending.push( { cb:cb, password:opts.password } );
			ws.send( JSON.stringify( { op:"genCert", opts:opts } ) );
				} else {
					throw new Error( "Services are not connected; you didn't wait for hello" );
				}
	},
		addUpdateCallback( cb ) {
			console.log( "Use AUto Excperire trigger" );
			//l.caUsers.push(cb);
		},
	autoExpireCert : autoExpireCert,
}

//-----------------------------------------

function autoExpireCert( genInfo, keyInfo, cb ) {
	_debug&&console.trace( "autoExpireCert" );
	function timer() {
		//console.log( "expiration tick fired....")
		var expiration = TLS.expiration( keyInfo.cert );
		if( (expiration.getTime() - (24*3600*1000)) < Date.now() ) {
			exports.genCert( genInfo, cb );
			return;
		}
		var expiration2 = TLS.expiration( keyInfo.ca );
		if( (expiration2.getTime() - (24*3600*1000)) < Date.now() ) {
			exports.genCert( genInfo, cb );
			return;
		}
		//console.log( "expiration tick fired....", expiration, expiration2,  expiration.getTime(), expiration2.getTime(), Date.now() );
		if( expiration.getTime() > expiration2.getTime() )
			expiration = expiration2;
		// check at one day before expiration
		var delay = ( expiration.getTime() - Date.now() );
		
		//console.log( "cert timeout should be in :", delay, delay/1000, delay/(1000*60), delay/(24*60*60*1000), delay.toString( 16 ) );
		if( delay > (24*3600*1000) )
			delay = delay - (24*3600*1000) + 1000;
		else
			delay = 60 * 1000;
		//if( delay > 0x10000000 )
		//	delay = 0x10000000
		//if( delay > 0x100000 )
		//	delay = 0x100000
		//console.log( "Delay for timeout is : ", delay, delay/1000, delay/(1000*60), delay/(24*60*60*1000), delay.toString( 16 ) );
		setTimeout( timer, delay );
	}
	setTimeout( timer, 1000 );
}

//-----------------------------------------


function openHello( remote, callback ) {
	_debug&&console.log( "Connect to core key master...." );

	var confirmed = false;
	_debug&&console.log( "Connect:", remote )
	ws = new WebSocket( "wss://" + remote, ["tls.core"], {
		perMessageDeflate: false,
		ca: config.caRoot
	});
	var runkeyt;
	var runkeyr;

	ws.on( "open", ()=>{
		_debug&&console.log( "remote opened..." );
		var tmpkey = IdGen.generator();
		runkeyt = IdGen.xkey( tmpkey, 0 );
		runkeyr = IdGen.xkey( tmpkey, 1 );
		ws.send( tmpkey );
		ws.send = ((orig)=>(buf)=>orig(IdGen.u8xor( buf,runkeyt) ) )(ws.send.bind(ws))
		ws.send( JSON.stringify( {op:"hello" } ) );
	})

	ws.on( "message", (_msg)=>{
		var msg;
		try {
			var _msg = IdGen.u8xor(_msg,runkeyr);
			msg = JSON.parse( _msg );
		} catch(err) {
			// protocol error.
			console.log( "ID manager Protocol error", err, "\n", _msg );
			ws.close();
			return;
		}
			_debug && console.log( "keyServiceRemote got:", msg );
			if( msg.op === "hello") {
				// other applications will expect to get back addMethods
				_debug&&console.log( "server accepted our hello..." );
				callback();
				confirmed = true;
				//ws.close();
			}
			else if( msg.op === "replyCert" ) {
				var cb = l.pending.shift();
				if( cb ) {
					//console.log( "return ", msg.keyInfo );
					//msg.keyInfo.password = cb.password;
					cb.cb( msg.keyInfo );
				} else {
					console.log( "Reply with cert was unmatched" );
					ws.close();
				}
			}
			else if( msg.op === "error" ) {
				alert( msg.error );
		}
		else 
			console.log( "KSR what the hell??", msg )
	});

	ws.on( "close", ()=>{
		if( !confirmed  ) {
			console.log( "keymaster remote closed..." );
			// without set timeout; I have no throttle control ....
			setTimeout( ()=>{
			openHello(l.keyMasterAddress); }, 5000 );
		}
	})
}
exports.openHello = openHello;
