"use strict";
const webRoot = "./uiRoot";
//var fs = require( 'fs');
var vfs = require( 'sack.vfs');
var vol = vfs.Volume();
const config = require ( "./config.js" )
const idGen = require( "./util/id_generator.js")
const url = require( 'url' );
const crypto = require( 'crypto');
const tls = require( 'tls');
const https = require( 'https')
const path = require('path');


//------ setup websocket compatibility
const ws = vfs.WebSocket;
const WebSocket = ws.Client;
const WebSocketServer = ws.Server;

exports.Server = scriptServer;
exports.addProtocol = addProtocol;

var wsServer = null;

function scriptServer( port, internal ) {
    if( !port ) port = 8550;

    console.log( "Starting Script Services on port", port );
    var privateKey = null;//vol.read('ca-key.pem').toString();
    var certificate = null;//vol.read('ca-cert.pem').toString();
    var option = {key: privateKey, cert: certificate};
    var credentials = tls.createSecureContext ();
    var server = https.createServer( option,
//  var server = http.createServer(
        (req, res) => {

	    if( req.upgrade ) {
        	console.log( "is upgrade, how to switch here?" );
        }
      console.log( "got request" + req.url );

      if( !internal ) {
	      var filePath = config.run.defaults.webRoot + unescape(req.url);
	      if (filePath == './uiRoot/') filePath = './uiRoot/index.html';
	}
	else
	      var filePath = '.' + unescape(req.url);

      var extname = path.extname(filePath);
      var contentType = 'text/html';
      switch (extname) {
          case '.js':
          case '.mjs':
              contentType = 'text/javascript';
              break;
          case '.css':
              contentType = 'text/css';
              break;
          case '.json':
              contentType = 'application/json';
              break;
          case '.png':
              contentType = 'image/png';
              break;
          case '.jpg':
              contentType = 'image/jpg';
              break;
          case '.wav':
              contentType = 'audio/wav';
              break;
      }


        {
            console.log( "serving a relative...", req.url, filePath );
            if( vol.exists( filePath  ) ) {
                var content = vol.read( filePath );
                            res.writeHead(200, { 'Content-Type': contentType });
                            res.end(new Buffer(content), 'utf-8');
                    }
                    else{
                        console.log( "exists on", filePath, "is false.")
                        res.writeHead(404);
                        res.end('<HTML><head><script src="userAuth/unauthorized.js"></script></head></HTML>');
                    }
        }
    });
    server.listen( port, ( err ) => {
	if( err ) console.log( "Err?", err );
	console.log( "bind success");
    } );
    /*
    exports.gun.wsp(server, ()=>{
        console.log( "want a websocket?")
    });
    */
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

function validateWebSock( ws, req ) {
    //console.log( "connect?", ws.upgradeReq.headers, ws.upgradeReq.url )
    console.log( "validate websock got:", ws.protocol );//, JSOX.stringify(ws,null,3), JSOX.stringify(req,null,3) );
    var proto = decodeURIComponent( req.headers['sec-websocket-protocol'] );

	var ip = req.headers['x-forwarded-for'] ||
	     req.connection.remoteAddress ||
	     req.socket.remoteAddress ||
	     req.connection.socket.remoteAddress;
	ws.remoteAddress = ip;

	// this is the way 'websocket' library gives protocols....
	//console.log( "other", ws.protocolFullCaseMap[ws.requestedProtocols[0]])
	wsServer.acceptingProtocol = null;
	if( !protocols.find( p=>{
		if( p.name === proto ) {
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
							console.trace( "protocol error.", msg );
							ws.close();
							return;
	        				}
        	        			//console.log( "Decoded msg: ", msg )
						cb( msg );
					})
				} else {
					orig( event, cb )
				}
	        	})(ws.on.bind(ws));
                        p.connect(ws);
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

