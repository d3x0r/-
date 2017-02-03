"use strict";

var fs = require( 'fs');
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

var services = [];

//var config = require( './config.js');
//var keyManager = require( "./id_manager.js" );
// server listening 0.0.0.0:41234

exports.Server = scriptServer;
exports.Service = addService;
exports.addProtocol = addProtocol;

//exports.Gun = Gun;
var ID = require( './id_generator.js' );

exports.Gun = Gun;
exports.gun = Gun(  { uuid : ID.generator, file : null } );;

exports.gun.on( "get", (a,b,c)=>console.log("gun get:", a,b,c) )
exports.gun.on( "put", (a,b,c)=>console.log("gun put:", a,b,c) )

Gun.on( "get", (a,b,c)=>console.log("GUN get:", a,b,c) )
Gun.on( "put", (a,b,c)=>console.log("GUN put:", a,b,c) )

var wsServer = null;

function addService( name, serviceHandler ) {
	if( !( name in services ) )
    		services[name] = serviceHandler;
        else
        	throw new Error( "Duplicate declaration of a service handler" );
}

function scriptServer( port ) {
    if( !port ) port = 8000;

    console.log( "Starting Script Services on port", port );
    var privateKey = fs.readFileSync('ca-key.pem').toString();
    var certificate = fs.readFileSync('ca-cert.pem').toString();
    var option = {key: privateKey, cert: certificate};
    var credentials = tls.createSecureContext ();
    var server = https.createServer( option,
//  var server = http.createServer(
        (req, res) => {

	    if( req.upgrade ) {
        	console.log( "is upgrade, how to switch here?" );
        }
      console.log( "got request" + req.url );
      
      
      var filePath = '.' + req.url;
      if (filePath == './')
          filePath = './index.html';

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


      if( req.url=== '/' )   {
          console.log( "something   ");
            res.writeHead(200);
            res.end('<HTML><head><script src="login/login.js"></script></head></HTML>');
        }
        else {
            let relpath;
            console.log( "serving a relative...", req.url );
            fs.access( relpath = req.url.substring(1,req.url.length), (err)=>{
                if( !err ) {
                    console.log( "Existed as a file...", relpath );
                    fs.readFile(relpath, function(error, content) {
                        if (error) {
                            if(error.code == 'ENOENT'){
                                fs.readFile('./404.html', function(error, content) {
                                    res.writeHead(200, { 'Content-Type': contentType });
                                    res.end(content, 'utf-8');
                                });
                            }
                            else {
                                res.writeHead(500);
                                res.end('Sorry, check with the site admin for error: '+error.code+' ..\n');
                                res.end();
                            }
                        }
                        else {
                            console.log( "write head 200");
                            res.writeHead(200, { 'Content-Type': contentType });
                            res.end(content, 'utf-8');
                        }
                    });
                }
                else {
                    console.log( "access result : ", err )
                    {
                        console.log( "and truth?", relpath );
                        //console.log( req );
                        res.writeHead(404);
                        res.end('<HTML><head><script src="core/no such thing.js"></script></head></HTML>');
                    }
                }
            });
        }
    });
    server.listen( port, () => {
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
    protocols.push( { name:protocol, connect:connect });
}

function validateWebSock( req ) {
    //console.log( "connect?", req.upgradeReq.headers, req.upgradeReq.url )
    wsServer.acceptingProtocol = null;
    var proto = req.upgradeReq.headers['sec-websocket-protocol'];
    if( !protocols.find( p=>{
            //if( p.name === req.protocolFullCaseMap[req.requestedProtocols[0]] ) {
            if( p.name === req.upgradeReq.headers['sec-websocket-protocol'] ) {
                console.log( "accept websock:", p )
                //wsServer.acceptingProtocol = p;
                p.connect(req);
                //req.accept( req.requestedProtocols[0], null );
                return true;
            }
            return false;
        } ) 
      ) {
          console.log( "unkown protocol:", proto )
          req.close();
      }
      //req.reject( "Unknown Protocol" );
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

