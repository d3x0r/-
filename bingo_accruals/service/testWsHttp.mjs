

import sack from "sack.vfs";
import defaultExport,* as path from  "path";


const realServer = {
	set messageProcessor(cb) {
		processMessage = cb;
	},
	on(event,cb) {
		events[event]=cb;
	}
}

const events ={
	connect:null,
	disconnect:null,
}
export {realServer as server};
var processMessage;

var serverOpts;
var server = sack.WebSocket.Server( serverOpts = { port: Number(process.argv[2])||8080 } )
var disk = sack.Volume();
console.log( "serving on " + serverOpts.port );


server.onrequest( function( req, res ) {

	var ip = ( req.headers && req.headers['x-forwarded-for'] ) ||
		 req.connection.remoteAddress ||
		 req.socket.remoteAddress ||
		 req.connection.socket.remoteAddress;
	//ws.clientAddress = ip;

	//console.log( "Received request:", req );
	if( req.url === "/" ) req.url = "/index.html";
	var filePath = "./ui" + unescape(req.url);
	var extname = path.extname(filePath);
	var contentType = 'text/html';
	console.log( ":", extname, filePath )
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
	if( disk.exists( filePath ) ) {
		res.writeHead(200, { 'Content-Type': contentType });
		console.log( "Read:", "./ui/" + req.url );
		res.end( disk.read( filePath ) );
	} else {
		console.log( "Failed request: ", req );
		res.writeHead( 404 );
		res.end( "<HTML><HEAD>404</HEAD><BODY>404</BODY></HTML>");
	}
} );

server.onaccept( function ( ws ) {
	//console.log( "Connection received with : ", ws );
	this.accept();
	//this.accept( protocols );
} );

server.onconnect( function (ws) {
	//console.log( "Connect:", ws );

	ws.onmessage( function( msg ) {
		var msg_ = sack.JSOX.parse( msg );
		processMessage && processMessage( ws, msg_, msg );
        } );
	ws.onclose( function() {
		events.disconnect && events.disconnect(ws);
		console.log( "Remote closed" );
    } );
	events.connect && events.connect(ws);
} );


