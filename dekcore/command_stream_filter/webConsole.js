

//const Entity = require( '../Entity/entity.js');

const util = await require('util')
const stream = await require('stream')

var sack = await require( "sack.vfs" );
const JSOX = sack.JSOX;
const path = await require( "path" );

//const shell = await require( "../Sentience/shell.js" );
doLog( util.format("What sort of require?", require.toString() ));

const root = await require.resolve("./command_stream_filter/ui");


function createSpawnServer( sandbox ) {

	//console.warn( "Got 'sandbox...", sandbox.name );
	options = sandbox || {};
	var _this = this;

	stream.Duplex.call(this,options)
	

	var serverOpts;
	var server = sack.WebSocket.Server( serverOpts = { port: Number(process.argv[2])||5000 } )
	console.warn( "serving on " + serverOpts.port + " at " + root);

	server.onrequest( function( req, res ) {
		var ip = ( req.headers && req.headers['x-forwarded-for'] ) ||
			req.connection.remoteAddress ||
			req.socket.remoteAddress ||
			req.connection.socket.remoteAddress;
		//ws.clientAddress = ip;

		console.warn( "Received request:", req.url );
		if( req.url === "/" ) req.url = "/index.html";
		var filePath = root + unescape(req.url);
		//console.warn( "Path? failed?", filePath, path );
		var parts = filePath.split("." );
		var extname = parts.length?parts[parts.length-1]:'';
		//var extname = path.extname(filePath);
		var contentType = 'text/html';
		switch (extname) {
			case 'js':
			case 'mjs':
				contentType = 'text/javascript';
				break;
			case 'css':
				contentType = 'text/css';
				break;
			case 'json':
				contentType = 'application/json';
				break;
			case 'png':
				contentType = 'image/png';
				break;
			case 'jpg':
				contentType = 'image/jpg';
				break;
			case 'wav':
				contentType = 'audio/wav';
				break;
					case 'crt':
							contentType = 'application/x-x509-ca-cert';
							break;
					case 'pem':
							contentType = 'application/x-pem-file';
							break;
					case 'wasm': case 'asm':
						contentType = 'application/wasm';
							break;
		}
		if( nativeDisk.exists( filePath ) ) {
			res.writeHead(200, { 'Content-Type': contentType });
			//console.warn( "Read:", "." + req.url );
			res.end( nativeDisk.read( filePath ) );
		} else {
			console.warn( "Failed request: ", req );
			res.writeHead( 404 );
			res.end( "<HTML><HEAD><TITLE>404</TITLE></HEAD><BODY>Resource Not Found...</BODY></HTML>");
		}
	} );

	server.onaccept( async function (conn) {
		sack.log( util.format("Connection received with : ", conn.headers['Sec-WebSocket-Protocol'], " path:", conn.url) );
		conn.block(); // need to do this before async returns.
		create( await name+":"+counter++, await description).then( (e)=>{
			//sack.log( "created new entity... waking it up...")
			e.wake().then( ()=>{
				//sack.log( "Tell it to require web connection startup")
				e.require(  "./startupWebConnection.js" ).then( ()=>{
					conn.post( e.Λ );
				})
			})
		} );
	} );

	server.onconnect( function (ws) {
		console.log( "On connect event should never happen here, the socket is posted in accept")
	} );
}


util.inherits(createSpawnServer, stream.Duplex)

createSpawnServer.prototype._read = function( size ) {
	console.trace( "webConsole Server:Read called...", size );  // 16384 by default... 
}
createSpawnServer.prototype._write = function( size ) {
	console.warn( "webConsole Server:This is lost output Write called...", size );  // 16384 by default... 
}


function Filter() {
	
	var tmp = {
        	filter : new createSpawnServer( this )
        	, connectInput(stream) { 
                	stream.pipe( this.filter );
                }
                ,connectOutput(stream) { 
                	this.filter.pipe( stream );
                } 
        };
        return tmp;

}

exports.Filter = Filter.bind(this);  // bind this to the filter.

