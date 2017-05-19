"use strict";
const webRoot = "./uiRoot";
//var fs = require( 'fs');
var vfs = require( 'sack.vfs');
var vol = vfs.Volume();

const idGen = require( "./util/id_generator.js")
const url = require( 'url' );
const crypto = require( 'crypto');
const tls = require( 'tls');
const https = require( 'https')
const path = require('path');

//------ setup websocket compatibility
const ws = require( 'ws' );
const WebSocket = ws.Client;
const WebSocketServer = ws.Server;

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";  // enable wss for gun without mods....
const Gun = require('gun');
//require('gun/lib/file.js');
//require('gun/lib/wsp/server.js');
//require('gun/lib/wsp/server-push.js');
//require('gun/lib/S3.js');


//const WebSocketServer   = ws.Server

exports.Server = scriptServer;
exports.addProtocol = addProtocol;

var ID = require( './util/id_generator.js' );

exports.Gun = Gun;
exports.gun = Gun(  { uuid : ID.generator, file : null } );;

//exports.gun.on( "get", (a,b,c)=>console.log("gun get:", a,b,c) )
//exports.gun.on( "put", (a,b,c)=>console.log("gun put:", a,b,c) )

//Gun.on( "get", (a)=>console.log("GUN get:", a['#'], a.get ) )
//Gun.on( "put", (a,b,c)=>console.log("GUN put:", a,b,c) )

var wsServer = null;

function scriptServer( port ) {
    if( !port ) port = 8000;

    console.log( "Starting Script Services on port", port );
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


      var filePath = './uiRoot' + unescape(req.url);
      if (filePath == './uiRoot/') filePath = './uiRoot/index.html';

      var extname = path.extname(filePath);
      var contentType = 'text/html';
      switch (extname) {
          case '.js':
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
}

//---------------------- Websocket Protocol Interface -----------------------

var protocols = [];
var peers = [];
function addProtocol( protocol, connect ) {
	console.log( "Adding protcol:", protocol );
    protocols.push( { name:protocol, connect:connect });
}

function validateWebSock( req ) {
    //console.log( "connect?", ws.upgradeReq.headers, ws.upgradeReq.url )
    var proto = decodeURIComponent( ws.upgradeReq.headers['sec-websocket-protocol'] );

	//console.log( "protocols:", protocols, "\n", proto );

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
                                                                ws.onmessage = (cb)=>ws.on( "message", cb );
								ws.on = ((orig)=>(event,cb)=>{
									if( event === "message" ) {
										orig(event, (msg)=>{
											if( !ws.keyt ) {
												ws.keyt = {key:msg,step:1};
												ws.keyr = {key:msg,step:0};
												return;
											}
											//console.log( "got:", msg, ws.keyr )
											try {
														msg = JSON.parse( idGen.u8xor( msg, ws.keyr ) );
											} catch( err ){
												console.log( "protocol error.", msg );
												ws.close();
												return;
											}

												cb( msg );
										}
									}
								})(ws.on);
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

addProtocol( "gunDb", (conn)=>{
    //console.log( "connected gundb, add peer")
    peers.push( conn );

    exports.gun.on('out', (msg)=>{
        msg = JSON.stringify({headers:{},body:msg});
        peers.forEach( (p)=>{ try { p.send( msg ) }catch  (err) {console.log( "Peer is bad... maybe closing?", err );} })
    })

    conn.on( 'message',(msg)=>{
            console.log( "gundb is getting", msg );
            exports.gun.on('in',msg.body)
        })
    conn.on( 'close', (reason,desc)=>{
        // gunpeers gone.
        var i = peers.findIndex( p=>p===conn );
        if( i >= 0 )
            peers.splice( i, 1 );
    })
})
