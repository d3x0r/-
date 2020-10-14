//-----------------------------------------------------------------------
//
//  var https = require( "./https_server.js" );
//  https methods
//     Server()    | ( dnsNames, port, internal, http_server, cb ) | starts a server on either internal or external addresses.  May open moutliple sockets.
//            dnsNames = either a stirng or array of strings that are used to build for the certificate common name designation.
//            port = port to open the server on.  (on all interfaces that are internal or external)
//            internal = (boolean value); if true, uses addresses that are common to private networks (192, 172, 10, 127,...); if not internal, uses all other addresses.
//            http_server = function( internal, req, res )
//                        function is called when a request is given to the HTTPS server... 
//                               internal is a flag whether it was an internal or external request.
//                               req is an object specifying the request, and res is an object for the result; basic operation resembles Node HTTP(S) handling for req/res
//                               res is an object for the result
//                             	 		res.writeHead(404);
//                                		res.end('<HTML><head><script src="userAuth/unauthorized.js"></script></head></HTML>');
//                                 		res.writeHead(200, { 'Content-Type': contentType });
//                                              //console.log( "send buffer...", content );
//                               		res.end(content);
//             cb = function( serverList ).  Function is called when servers have been setup and are ready and listening.  (or null if server open failed)
//                   THe serveRList that is passed ia 'localData.[internal/external]Servers' array, which has additional methods...
//                                 addProtocol( protocolName, handler );    - registers a handler for protocols on the list of external or internal servers.
//                                 protocols = [] ; list of protocols added on this list.  (doesn't require re-registering if server has to restart because its certificate is no longer valid).
//     addProtocol( protocolName, cb ) | add a global protocol handler |
//     certGen | Externally set for certificate generation service; maybe if NULL should fall back as HTTP/WS instead of HTTPS/WSS |
//     firewall | Externall provided firewall service object.   Expects firewall.ban(address) method; which is provided on service connection as 'ban' method.
//
//  Server( "hostname", 8080, true, null, (servers)=>{ if( server ) console.log( "init good" ) else console.log( "init bad" ) } );
//
//  A server object will manage itself with regards to the certificates it uses.  If the certificate expires; it will close all the servers it has opened, and reopen them using the new key information.
//  This is triggered by the certGen object that has been assigned to this.
//  See these for more information on certificatee Generation
//      util/keyMaster/keyService.js
//      util/keyMaster/keyServiceRemote.js // mostly stub routines that forward requests to keyService.
//
//-----------------------------------------------------------------------
"use strict";
const _debug = false;
const _ll_debug = false; // websocket send/recv
const webRoot = "./uiRoot";
//var fs = require( 'fs');
const sack = require( 'sack.vfs');
const nativeDisk = sack.Volume();

const config = require ( "./config.js" )
const idGen = require( "./util/id_generator.js")
const url = require( 'url' );
const path = require('path');
const fc = require( './file_cluster.js' );
var requestDb;

/*
function initDb() {
	requestDb = fc.cvol.Sqlite( "request.db" );
}
config.start( initDb );
*/
//------ setup websocket compatibility
const WS = sack.WebSocket.readyStates;
const WebSocket = sack.WebSocket.Client;
const WebSocketServer = sack.WebSocket.Server;

//------ Load Smart HTML File Service

exports.Server = scriptServer;
exports.addProtocol = addProtocol; // add global protocol, otherwise server object has addProtocol method
exports.certGen = null;
exports.firewall = null;
exports.serviceName = null;

const localData = {
	internalServers : [],
	externalServers : []
}

localData.internalServers.protocols = [];
localData.internalServers.addProtocol = addServerProtocol;
localData.externalServers.protocols = [];
localData.externalServers.addProtocol = addServerProtocol;

function addServerProtocol(protocol,callback){
		_debug&&console.log( "Adding CONNECTION protocol:", protocol, "on", this );
		this.protocols.push( {name:protocol, connect:callback } );
	};


function scriptServer( dnsNames, port, internal, http_server, cb ) {
	//console.log( "!!! : SERVE FOR:", dnsNames, internal );
	if( !port ) port = 8000;
	var certPath;
	var hostlist = null;
	if( certPath = config.run.defaults.certPath ) {
		if( config.run.defaults.hostList ){
			hostlist = [];
			config.run.defaults.hostList.forEach( host=>{

				hostlist.push( {
					host : host.publicName
					, cert : nativeDisk.read( host.certPath + "/cert.pem" ).toString()
					, key : nativeDisk.read( host.certPath + "/privkey.pem" ).toString()
					, ca : nativeDisk.read( host.certPath + "/fullchain.pem" ).toString()
					
				})
			})
		}
		var keyInfo = { cert : nativeDisk.read( certPath + "/cert.pem" ).toString()
			, key : nativeDisk.read( certPath + "/privkey.pem" ).toString()
			, ca : nativeDisk.read( certPath + "/fullchain.pem" ).toString()
			};
		createServer( keyInfo, hostlist );
	} else {
		var genInfo = { name: exports.serviceName || "Chatment Core HTTPS"
				, key: null, password: "password", expire:7
				, subject:{ DNS:dnsNames
				, IP: (internal?config.run.internal_addresses.concat(config.run.addresses):config.run.addresses).map( a=>a.address) }
			};

		_debug && console.log( "Starting HTTPS Services on port", port );
		initKeys( genInfo, keyInfo=>{
			//console.log( "got keys recover:", keyInfo );
			//console.log( "cert:", sack.TLS.certToString( keyInfo.cert ) );
			//console.log( "ca:", sack.TLS.certToString( keyInfo.ca ) );
					genInfo.key = keyInfo.key;
					genInfo.password = keyInfo.password;
					if( !config.caRoot )
						config.caRoot = exports.certGen.getRootCert()
					if( config.caRoot ) {
						var chain = keyInfo.ca + config.caRoot;
							//console.log( "config root:", config.caRoot );
						try {
							//console.log( "validate" );
							sack.TLS.validate( { cert:keyInfo.cert, chain:chain  } );
								//console.log( "validated" );
						} catch( err ) {
							//console.log( "cert:", keyInfo.cert );
							//console.log( "ca:", keyInfo.ca );
							console.log( "invalid chain... need to recreate?", err );
							recreateCert( );
							return;
						}
					}else console.log( "MISSING caRoot!" );
					
			var expiration = sack.TLS.expiration( keyInfo.cert );
			_debug&&console.log( "expiration:", expiration, expiration.getTime(), Date.now(), new Date().toISOString() );
			var expiration2 = sack.TLS.expiration( keyInfo.ca );
			_debug&&console.log( "expiration:", expiration2, expiration2.getTime(), Date.now(), new Date().toISOString() );
			if( expiration.getTime() > expiration2.getTime() )
				expiration = expiration2;
		
			if( ( expiration.getTime()  - (24*3600*1000) ) < Date.now() ) {
				console.log( "expired cert... need to recreate?" );
				recreateCert();
			} else {
				keyInfo.passphrase = genInfo.password;
				_debug&&console.log( "serferinfo:", keyInfo );
				createServer( keyInfo );
				_debug&&console.log( "Setup auto expire callback(1?)", dnsNames, port );
				exports.certGen.autoExpireCert( genInfo, keyInfo, ki=>{ ki.password=genInfo.password; keyInfo = ki; storeCertInfo( keyInfo ) } );
			}
		} );

		function storeCertInfo( keyInfo ) {
			genInfo.key = keyInfo.key;
			var chain = keyInfo.ca + config.caRoot;
			try {
				//console.log( "Validate:", keyInfo, chain  )
				sack.TLS.validate( { cert:keyInfo.cert, chain:chain } );
			}
			catch(err) {
				if( _debug ) console.log( "cert chain after create is still invalid?!", err, "keyinfo:", keyInfo, chain );
				else console.log( "cert chain after create is still invalid?!", err );
			}
			fc.store( "httpInfo-"+(internal?"i":"e")+".json", JSON.stringify( keyInfo ), ()=>{
				//console.log( "callback finish:", keyInfo );
				keyInfo.passphrase = genInfo.password;
				createServer( keyInfo );
				console.log( "Setup auto expire callback(2?)", dnsNames, port );
				exports.certGen.autoExpireCert( genInfo, keyInfo, storeCertInfo );
			} );
		}
		function recreateCert() {
			console.log( "Certificate expired, update cert." );
			exports.certGen.genCert( genInfo, storeCertInfo );
		}
	} 

	function createServer( keyInfo, hostlist ) {
		//console.trace( "server server:", keyInfo );
		//console.log( "server cert: \n", keyInfo.cert );
		//console.log( "server chain: \n", keyInfo.ca );
		var restarting = false;
		if( !(internal
			?config.run.internal_addresses.length
			:config.run.addresses.length ) ) {
					cb( null );
			return;
		}
		// really this needs to loop FOR ALL ADDRESSES
		if( internal && localData.internalServers.length ) {
			console.log( 'restart internal server(s).', localData.internalServers)
			restarting = true;
			localData.internalServers.forEach( server=>server.wsServer.close() );
			localData.internalServers = [];
		}
		if( !internal && localData.externalServers ){
			console.log( 'restart extern server(s).', localData.externalServers)
			restarting = true;
			localData.externalServers.forEach( server=>server.wsServer.close() );
			localData.externalServers = [];
		}
		var option = keyInfo;
		option.hosts = hostlist;
		option.port = port;
		option.passphrase = option.password;
		option.perMessageDeflate = false;
		option.perMessageDeflateAllow = false;
		//console.trace( "Starting server:", option );
		//var credentials = tls.createSecureContext ();

		var addresses = internal?(config.run.internal_addresses):(config.run.addresses);
		//console.log( "addresses:", addresses );
		addresses.forEach( (address)=>{ 
			option.address = address.address;

			// really this needs to loop FOR ALL ADDRESSES
			//_debug && 
				console.log( "Address:", option.address, option.port, internal );
			//console.log( "Create Server Parameters: ", option, option.hostlist );

			var server;
			try {
				server = WebSocketServer( option );
				if(_debug) server.options = Object.assign( {}, option );
			}catch(err){
				console.trace( "Fatal Error Processing Address:", option.address, option.port, internal );
				console.log( err );
				process.exit();
			}
			server.internal = internal;
			server.on("lowError",function(error,addr,buffr){
				//console.log( "GOT:", typeof buffr )
				if( (typeof buffr) === "string" ) {
				}else if( (typeof buffr) === "object" ) {
					var encodedString = String.fromCharCode.apply(null, new Uint8Array(buffr));
					//console.log( "ENC:", encodedString );
					try {
					        var decodedString = decodeURIComponent(escape(encodedString));
					}catch(err) {
						console.log( "TLS Failure: (size)", encodedString.length, "data:", encodedString.substr(0,128), "From:", addr );
						//console.log( err );
						return;
					}
					buffr = decodedString
				}
				//console.log( "Request:", buffr )
				if( buffr.startsWith( "GET " ) ) {
					console.log( "Redirect...", buffr.length, buffr.substr(0,128) );
					server.disableSSL();
					return;	

				}
				console.log( "Error connect from:", addr, "size:", buffr.length, "data:", buffr.substr(0,128) );
			} );
			server.on("close",()=>{
				console.log( "SERVER SOCKET HAS CLOSED?" );
			})
			server.on( "error", (failedWs)=>{
				console.log( "SERVER SOCKET ERROR from:", failedWs, failedWs.remoteAddress );
			} );
			const reqOpts = { requestDb : requestDb };
			server.on( "request", (req, res) => {
				if( req.redirect ) {
					console.log( "Got request with redirect" );
				        //console.log( "THIS SHOULD write back a 301..." );
					res.writeHead( 301, { 'Content-Type': 'text/html'
			                	, 'Location':'https://' + req.headers.Host + req.url }); 
					res.end( "<HTML><HEAD><TITLE>301 HTTPS Redirect</TITLE></HEAD><BODY>This site is only accessable with HTTPS.</BODY></HTML>");
					return;
				}
				//console.log( "got request" + req.url );
				if( http_server ) {
					return http_server( internal, req, res, reqOpts );
				}
				res.writeHead(404);
				res.end('<HTML><head><title>No resource</head><BODY>No Resource</BODY></HTML>');
			});
			let thisServer = new httpServer( server );
			server.on('accept', function(ws){validateWebSock(thisServer, ws) } ) // ws NPM
			server.on('connect', webSockConnected );
			if( internal )
				localData.internalServers.push( thisServer );
			else
				localData.externalServers.push( thisServer );
		} );
		//if( !restarting )
		cb( internal?localData.internalServers:localData.externalServers );
	}

	function initKeys(genInfo, cb) {
		fc.reload( "httpInfo-"+(internal?"i":"e")+".json").then( ( err, data )=> {
			var key;
			if( err ) {
				console.log( "FAILED TO RECOVER OLDINFO, create new keys.", internal );
				genInfo.key = sack.TLS.genkey( 1024, genInfo.password );
				fc.store( "httpKeys-"+(internal?"i":"e")+".json", genInfo.key, initCerts );
			} else { 
				var keyInfo = JSON.parse( data );
				keyInfo.password = genInfo.password;
				cb( keyInfo );
			}
			function initCerts() {
							console.log( "GENERATE WITH genInfo" );
	 			exports.certGen.genCert( genInfo, (keyInfo)=>{
 					fc.store( "httpInfo-"+(internal?"i":"e")+".json", JSON.stringify( keyInfo ), ()=>{
 						cb( keyInfo );
 					} );
	 			} );
			}
		} ).catch(err=>{console.log( "File reload failed:", err) } );
	}

}



function httpServer( ws ) {
	this.wsServer = ws;
	this.protocols = [];
	this.addProtocol = function(protocol,callback){
		_debug && console.log( "Adding CONNECTION protocol:", protocol, "on", ws.options.address, ws.options.port );
		this.protocols.push( {name:protocol, connect:callback } );
	};
}

//---------------------- Websocket Protocol Interface -----------------------

var protocols = [];
var peers = [];
function addProtocol( protocol, connect ) {
	_debug&&console.log( "Adding GLOBAL protcol:", protocol );
	protocols.push( { name:protocol, connect:connect });
}

function validateWebSock( httpServer, ws ) {
	//console.log( "connect?", ws.upgradeReq.headers, ws.upgradeReq.url )
	//console.log( "connect?", ws )
	//console.log( "connect?", req )

	var proto = ws.headers['Sec-WebSocket-Protocol'];
	ws.internal = httpServer.internal;
	//console.log( "ws:", ws );
	//_debug&&
	_debug && console.log( "protocols:", protocols, "\n", proto, ws.connection.remoteAddress );

	// this is the way 'websocket' library gives protocols....
	//console.log( "other", ws.protocolFullCaseMap[ws.requestedProtocols[0]])
	var p = protocols.find( p=>{
		//if( p.name === ws.protocolFullCaseMap[ws.requestedProtocols[0]] ) {
			_debug && console.log( "Test global protocols:", p.name, proto )
		if( p.name === proto ) return true;
		return false;
	} );
	if( !p )
		p = httpServer.protocols.find( p=>{
			//if( p.name === ws.protocolFullCaseMap[ws.requestedProtocols[0]] ) {
			_debug && console.log( "Test specific protocols:", p.name, proto )
			if( p.name === proto ) return true;
			return false;
		} );
	if( !p )
		(httpServer.internal?localData.internalServers:localData.externalServers).find( server=>p=server.protocols.find( p=>{
			//if( p.name === ws.protocolFullCaseMap[ws.requestedProtocols[0]] ) {
			_debug && console.log( "Test internal/external protocols:", p.name, proto )
			if( p.name === proto ) return true;
			return false;
		} ) );

	if( p ) {
		_debug && console.log( "Found protocol... settting to p", p, ws.connection.remoteAddress )
		ws.protocol = p;
		httpServer.wsServer.accept();
	}
	else
	{
		console.log( "unknown protocol:", proto, ws.headers )
		httpServer.wsServer.reject();
	}
}

function webSockConnected( ws ) {
	//console.log( "connect?", ws.upgradeReq.headers, ws.upgradeReq.url )
	//console.log( "connect?", ws )
	//console.log( "connect?", req )

	const p = ws.protocol;

	const ip = ( ws.headers && ws.headers['x-forwarded-for'] ) ||
		 ws.connection.remoteAddress ||
		 ws.socket.remoteAddress ||
		 ws.connection.socket.remoteAddress;
	ws.clientAddress = ip;
	_debug&&console.log( "ws Connected from:", ip , p, ws.protocol, ws.headers['Sec-WebSocket-Protocol']);

	if( p ) {
		if( _debug && ws.internal )
			console.log( "accept websock:", p )
		ws.send = ((orig)=>(buf)=>{
			var origBuf = buf;
			if( typeof buf === "string" ) {
				_ll_debug && console.log( p.name, "Send:", buf.slice( 0, 128) );
				buf = idGen.u8xor( buf, ws.keyt );
				_ll_debug && console.log( p.name, "Send real:", JSON.stringify([...buf].map(c=>c.codePointAt(0))) );
			}
			else
				_ll_debug && console.log( p.name, "Send:", buf );

			try {
				if( ws.readyState == WS.OPEN )
					orig(buf);
			} catch(err) {
				console.log( "Probably already closed even after check:", ws.readyState, err, "\nMSG:", origBuf );
			}
			//else throw new Error( "Connection is not open:" + ws.readyState );
		})(ws.send.bind(ws));

		ws.close = ((orig)=>()=>{
			console.log( "CLOSE socket:", ip, p );
	   		orig();
		})(ws.close.bind(ws));
		ws.ban = ((orig)=>(()=>{
			console.trace( "close generate this side (ban)" );
			exports.firewall.ban( ws.clientAddress );
			orig.close();
		}))(ws);

		Object.defineProperty( ws, "onmessage", {
			set(cb) { ws.on( "message", cb ) },
			get() { console.log( "getting 'onmessage' callback?" ) }
		})
		Object.defineProperty( ws, "onclose", {
			set(cb) { ws.on( "close", cb ) },
			get() { console.log( "getting 'onclose' callback?" ) }
		})
		Object.defineProperty( ws, "onopen", {
			set(cb) { ws.on( "open", cb ) },
			get() { console.log( "getting 'onopen' callback?" ) }
		})
		Object.defineProperty( ws, "onerror", {
			set(cb) { ws.on( "error", cb ) },
			get() { console.log( "getting 'onerror' callback?" ) }
		})

		ws.on = ((orig)=>(event,cb)=>{
			if( typeof( cb ) !== "function" )
				throw new Error( "Callback is not a function?" );
			//console.trace( "websock on: ", event, cb)
			if( event === "message" ) {
				orig(event, (msg)=>{
					//console.log( "Raw Recieve:", typeof( msg ), msg );
					if( !ws.keyt ) {
						ws.keyt = idGen.xkey( msg, 1 );
						ws.keyr = idGen.xkey(msg);
						return;
					}
					//console.log( "got:", msg, ws.keyr )
					try {
						msg = idGen.u8xor( msg, ws.keyr );
					} catch( err ){
						console.trace( "protocol error.", msg, err );
						ws.close();
						return;
					}
					//console.log( "Received msg: ", msg )
					_ll_debug&&console.log( p.name, "RECV", msg );
					cb( msg );
				})
			} else {
				orig( event, cb )
			}
		})(ws.on.bind(ws));
		p.connect(ws);
	}
	else
	{
		console.log( "unknown protocol:", ws.protocol, ws.headers )
		ws.close();
	}
}

