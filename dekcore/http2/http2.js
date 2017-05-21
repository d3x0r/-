#!/usr/bin/env node

var myself = module.exports = exports = {};

var config = require( "./config.json" );

//var WebSocketServer = require('ws').Server;
var WebSocketServer = require('websocket').server;
var https = require('https');
var http = require('http');
var url = require('url');
var fs = require('fs');
var path = require('path');
var Gun = require('../../../../../../../javascript/gun');


var wsServer;
var wsServer2;
	var authGunPeers = [];
	var gameGunPeers = [];


function sendAuthGun(msg) {
		msg = JSON.stringify({headers:{}, body: msg});
		authGunPeers.forEach(function(ws){
			ws.send(msg)
		} )
}
function sendGameGun(msg) {
		msg = JSON.stringify({headers:{}, body: msg});
		gameGunPeers.forEach(function(ws){
			ws.send(msg)
		} )
}

myself.startServer = function( 
	wsCallback, 
        wsClose 
        ) 
{
	function webSocketAcceptor( req ) {
			console.log( 'websocket acceptor got called??? NO!')
        	validateWebSock( req );
        }
	myself.gameGun = Gun( { file:"game.json", ws: { protocol: "gunDb" } } );
	myself.gameGun.on('out', sendGameGun );
	myself.authGun = Gun( { file:"auth.json", ws: { protocol: "gunDb" } } );
	myself.authGun.on('out', sendAuthGun );
	var server = http.createServer(
		function(request, response) {
			console.log((new Date()) + ' Received request for ' + request.url);
			handleRequest( request, response );
	});

	var privateKey = fs.readFileSync('keygen/key.pem').toString();
	var certificate = fs.readFileSync('keygen/ca-cert.pem').toString();
	var option = {key: privateKey, cert: certificate};

	var server2 = https.createServer( option,
		function(request, response) {
			console.log((new Date()) + ' Received request for ' + request.url);
			handleRequest( request, response );
	});


	function handleRequest(req, res){
		//console.log( req );
		console.log( req.url );

		if( req.upgrade ) {
				console.log( "WEBSOCK BEGIN" );
			}
			
			var _rurl = url.parse( req.url );
		var rurl = _rurl.pathname;

		var stream = fs.createReadStream(path.join(__dirname+"/..", rurl))
		stream.on('error',function(){ // static files!
				console.log( "Failed so...?", rurl );
			if( rurl === "/" ) {
				res.end(fs.readFileSync(path.join(__dirname+"/..", 'index.html'))); // or default to index
			}
			else {
				res.writeHead(404, {'Content-Type': 'text/html'});
				res.end();
			}
		});

		if( rurl.endsWith( ".js" ) ) {
			res.writeHead(200, {'Content-Type': 'application/javascript'});
		} else if( rurl.endsWith( ".json" ) ) {
			res.writeHead(200, {'Content-Type': 'application/json'});
		} else if( rurl.endsWith( ".css" ) )
			res.writeHead(200, {'Content-Type': 'text/css'});
		else if( rurl.endsWith( ".png" ) ){
			res.writeHead(200, {'Content-Type': 'image/png'});
			stream.on( 'data', function( img) {
				res.write( img, "binary" );
			})
			stream.on( 'end', function( ) {
				res.end();
			})
			return;
		}
		else
			res.writeHead(200, {'Content-Type': 'text/html'});

		stream.pipe(res); // stream
	}

	server.listen(config.serve.port, function() {
		console.log((new Date()) + ` Server is listening on port ${config.serve.port}`);
	});

	server2.listen(config.serve.port+1, function() {
		console.log((new Date()) + ` Server is listening securely on port ${config.serve.port+1}`);
	});

	wsServer = new WebSocketServer({
		server: server,
		httpServer: server,
		// You should not use autoAcceptConnections for production
		// applications, as it defeats all standard cross-origin protection
		// facilities built into the protocol and the browser.  You should
		// *always* verify the connection's origin and decide whether or not
		// to accept it.
		autoAcceptConnections: false
	});

	wsServer2 = new WebSocketServer({
		server: server2,
		httpServer: server2,
		// You should not use autoAcceptConnections for production
		// applications, as it defeats all standard cross-origin protection
		// facilities built into the protocol and the browser.  You should
		// *always* verify the connection's origin and decide whether or not
		// to accept it.
		autoAcceptConnections: false
	});
	wsServer2.acceptedResource = null;
	

	wsServer2.on('request',validateWebSock ); 
	//wsServer.on('connection',handleWebSock );
        


	function validateWebSock( req ) {
		console.log( "validate WebSock got called... ", req.resource, req.requestedProtocols, req.protocolFullCaseMap[req.requestedProtocols[0]])
			//if( r = req.requestedProtocols.find( function(p){ return req.protocolFullCaseMap[p]===gun.__.opt.ws.protocol } ) )
			if( req.protocolFullCaseMap[req.requestedProtocols[0]] == 'gunDb' ) {
				//handleGunClient(req)
				if( req.resource == "/gameState" || req.resource == "/userAuth"  ) {
					wsServer2.acceptedResource = req.resource;
					req.accept( req.requestedProtocols[0], null );
				}
			}
			else if( req.protocolFullCaseMap[req.requestedProtocols[0]] == 'eQube.LinQ' ) {
				wsServer2.acceptedResource = req.resource;
				req.accept( req.requestedProtocols[0], null );
			}
			else {
				console.log( "unhandled check protocols: ", req.requestedProtocols, req.resource );
				if( !req.requestedProtocols || req.requestedProtocols.length === 0 ) {
					//console.log( 'issue accept here? even if it"s not for me?' );
					wsServer2.acceptedResource = req.resource;
					req.accept( null, null );
				}
				else if( req.requestedProtocols && req.requestedProtocols[0] === 'null' ) {
					//console.log( 'issue accept here? even if it"s not for me?' );
					wsServer2.acceptedResource = req.resource;
					req.accept( 'null', null );
				}

			}

			return handleWebSock;
	}
        
	wsServer2.on('connect',handleWebSock ); 
	wsServer.on('connect',handleWebSock );

	function originIsAllowed(origin) {
		// put logic here to detect whether the specified origin is allowed.
		if( origin.indexOf( 'game' )>=0 )
			return false;
		return true;
	}

	function input() {
	}

	function handleWebSock(connection) {
        /*
		console.log( "do we even get this?",connection.upgradeReq.url )
		if (!originIsAllowed(connection.upgradeReq.url)) {
			console.log( "blah" );
			// Make sure we only accept requests from an allowed origin
			//request.reject();
			console.log((new Date()) + ' Connection from origin ' + connection.upgradeReq.headers.origin + ' rejected.');
			return;
		}
                */
		//
		//console.log( "connection:", connection.protocol, wsServer2.acceptedResource )
		if( connection.protocol === 'something' )  {
			console.log((new Date()) + ' Connection accepted.');

			connection.on('message', function(message) {
				wsCallback( connection, message );
			});
			connection.on('close', function(reasonCode, description) {
				wsClose( connection );
				console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
			});
		}
		
		else 
		{
			//console.log( "protocols?", connection.protocol, wsServer2.acceptedResource )
			if( wsServer2.acceptedResource === "/channel1" ) {
				authGunPeers.push( connection );
				connection.on( 'message', (msg)=>{ console.log( "receive on auth" ); myself.authGun.on('in', JSON.parse(msg.utf8Data).body); })
				connection.on('close', function(reasonCode, description) {
					console.log((new Date()) + ' GUN Peer ' + connection.remoteAddress + ' disconnected.');
					authGunPeers.splice( authGunPeers.findIndex( p=>p===connection  ), 1 );
				});
			}
			if( wsServer2.acceptedResource === "/channel2" ) {
				gameGunPeers.push( connection )
				connection.on( 'message', (msg)=>{ console.log( "receive on game" ); myself.gameGun.on('in', JSON.parse(msg.utf8Data).body); })
				connection.on('close', function(reasonCode, description) {
					console.log((new Date()) + ' GUN Peer ' + connection.remoteAddress + ' disconnected.');
					gameGunPeers.splice( gameGunPeers.findIndex( p=>p===connection  ), 1 );
				});
			}
		}
		
	}

}

