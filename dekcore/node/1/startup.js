
console.trace( "Hello from startup script" );

console.log( "This:", Object.keys( global ) );
//var fs = require( 'fs');

//io.firewall.allocatePort( ( port )=>{ 

const vfs = require( 'sack.vfs');
const vol = vfs.Volume();
const url = require( 'url' );
const crypto = require( 'crypto');
const tls = require( 'tls');
const https = require( 'https')
const path = require('path');


//------ setup websocket compatibility
//const WebSocket = require( 'ws' );
const WebSocketServer = require( 'wss' );

//process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";  // enable wss for gun without mods....

var wsServer = null;

function scriptServer( port ) {
    if( !port ) port = 6000;

    var privateKey = vol.read('ca-key.pem').toString();
    var certificate = vol.read('ca-cert.pem').toString();
    var option = {key: privateKey, cert: certificate};
    var credentials = tls.createSecureContext ();
    var server = https.createServer( option,
//  var server = http.createServer(
        (req, res) => {

	    if( req.upgrade ) {
        	console.log( "is upgrade, how to switch here?" );
        }
      	console.log( "got request" + req.url );
        {
                    res.writeHead(404);
                    res.end('<HTML><head><script src="userAuth/unauthorized.js"></script></head></HTML>');
        }
    });
    server.listen( port, ( err ) => {
	if( err ) console.log( "Err?", err );
	else console.log( "bind success");
    } );

    wsServer = new WebSocketServer( {
        server: server, // ws npm
        httpserver: server, // websocket npm
        autoAcceptConnections : false // want to handle the request
    })
    wsServer.acceptResource = null;
    //wsServer.on('request',validateWebSock )
    wsServer.on('connection',validateWebSock )
    return new httpServer( server, wsServer );
}

function httpServer( http, ws ) {
	this.server = http;
	this.wsServer = ws;
	this.protocols = [];
	this.addProtocol = function(protocol,callback){
		this.protocols.push( {name:protocol, connect:callback } );
	};
}

//---------------------- Websocket Protocol Interface -----------------------

var protocols = [];
var peers = [];
function addProtocol( protocol, connect ) {
	console.log( "Adding protcol:", protocol );
    protocols.push( { name:protocol, connect:connect });
}

function validateWebSock( ws ) {
    //console.log( "connect?", ws.upgradeReq.headers, ws.upgradeReq.url )
    var proto = decodeURIComponent( ws.upgradeReq.headers['sec-websocket-protocol'] );

	console.log( "ws:", ws );
	console.log( "protocols:", protocols, "\n", proto );

	// this is the way 'websocket' library gives protocols....
	//console.log( "other", ws.protocolFullCaseMap[ws.requestedProtocols[0]])
    wsServer.acceptingProtocol = null;
    if( !protocols.find( p=>{
            //if( p.name === ws.protocolFullCaseMap[ws.requestedProtocols[0]] ) {
            if( p.name === proto ) {
                console.log( "accept websock:", p )
                //wsServer.acceptingProtocol = p;
				ws.send = ((orig)=>(buf)=>{
					buf = idGen.u8xor( buf, ws.keyt );
					orig(buf);
				})(ws.send.bind(ws));

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
						console.log( "Raw Recieve:", typeof( msg ), msg );
							if( !ws.keyt ) {
								ws.keyt = idGen.xkey( msg, 1 );
								ws.keyr = idGen.xkey(msg);
								return;
							}
							console.log( "got:", msg, ws.keyr )
							try {
								msg = idGen.u8xor( msg, ws.keyr );
							} catch( err ){
								console.trace( "protocol error.", msg );
								ws.close();
								return;
							}
                            				console.log( "Decoded msg: ", msg )
							cb( msg );
						})
					} else {
                        orig( event, cb )
                    }
				})(ws.on.bind(ws));
                p.connect(ws);
                //ws.accept( ws.requestedProtocols[0], null );
                return true;
            }
            return false;
        } )
      ) {
          console.log( "unkown protocol:", proto )
          ws.close();
      }
      //ws.reject( "Unknown Protocol" );
}

addProtocol( "Auth", (ws)=>{
	ws.on( "open", (ws)=>{
		console.log( "received new connection on Auth0" );
		io.firewall.mapService( "Auth", (address)=>{
			ws.send( JSON.stringify( {op:"redirect", addr: address} ) );
		} );
	} );
	ws.on( "message", (ws)=>{ 
		console.log( "No message handling really." );
	} );
} );
scriptServer();

//} )
