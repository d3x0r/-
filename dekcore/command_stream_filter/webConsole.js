
//const Entity = require( '../Entity/entity.js');

const util = require('util')
const stream = require('stream')

var sack = require( "sack.vfs" );
const JSOX = sack.JSOX;
const path = require( "path" );
console.warn( "This is include sentience, in a sandbox." );
const shell = require( "shell.js" );


const root = require.resolve("./ui");

var disk = sack.Volume();
var myDisk = sack.Volume( "myDisk" );

//console.warn( "Disk is open in:", disk.dir() );


function createSpawnServer( sandbox ) {

	//console.warn( "Got 'sandbox...", sandbox.name );
	options = sandbox || {};
	var _this = this;

	//  this.console = openConsole( _this.push.bind(_this) );

	//options.decodeStrings = false;
	stream.Duplex.call(this,options)
	

	var serverOpts;
	var server = sack.WebSocket.Server( serverOpts = { port: Number(process.argv[2])||9912 } )
	console.warn( "serving on " + serverOpts.port + " at " + root);

	server.onrequest( function( req, res ) {
		var ip = ( req.headers && req.headers['x-forwarded-for'] ) ||
			req.connection.remoteAddress ||
			req.socket.remoteAddress ||
			req.connection.socket.remoteAddress;
		//ws.clientAddress = ip;

		console.trace( "Received request:", req.url );
		if( req.url === "/" ) req.url = "/index.html";
		var filePath = root + unescape(req.url);
		var extname = path.extname(filePath);
		var contentType = 'text/html';
		console.trace( ":", extname, filePath )
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
					case '.crt':
							contentType = 'application/x-x509-ca-cert';
							break;
					case '.pem':
							contentType = 'application/x-pem-file';
							break;
					case '.wasm': case '.asm':
						contentType = 'application/wasm';
							break;
		}
		if( disk.exists( filePath ) ) {
			res.writeHead(200, { 'Content-Type': contentType });
			console.warn( "Read:", "." + req.url );
			res.end( disk.read( filePath ) );
		} else {
			console.warn( "Failed request: ", req );
			res.writeHead( 404 );
			res.end( "<HTML><HEAD><TITLE>404</TITLE></HEAD><BODY>Resource Not Found...</BODY></HTML>");
		}
	} );

	server.onaccept( function ( ws ) {
	//	console.log( "Connection received with : ", ws.protocols, " path:", resource );
			if( process.argv[2] == "1" )
			this.reject();
			else
			this.accept();
	} );

	server.onconnect( function (ws) {

		var entity = null;	
			var sendTo = null;
		spawnEntity( ws, sandbox, (e, input )=>{
			entity = e;
					sendTo = input;
				
			} );

		ws.onmessage( function( msg ) {
				//console.warn( "Received data:", msg );
				var msg_ = JSOX.parse( msg );
					if( msg_.op === "write" ) {
					sendTo( msg_.data );
					} else {
				
			}
			} );
		ws.onclose( function() {
				//console.log( "Remote closed" );
			} );
	} );


}



function spawnEntity( ws, sandbox, resultTo ) {

	//console.trace( "create interface entity:", ws, sandbox )

	function localClientFilter(options) {
		options = options || {};
		options.decodeStrings = false;
                stream.Duplex.call(this,options)
	}

	util.inherits(localClientFilter, stream.Duplex)

	localClientFilter.prototype._read = function( size ) {
		//console.warn( "Read called...", size );  // 16384 by default... 
	}

	localClientFilter.prototype._write = function( chunk, decoding, callback ) {
		//console.warn( "write called:", chunk );
		ws.send( JSON.stringify( {op:'write', data:chunk.toString( 'utf8' )} ) );
		callback();
	}


	function clientFilter() {
		var tmp = {
        		filter : new localClientFilter( {} )
	        	, connectInput : function(stream) { 
        	        	stream.pipe( this.filter );
	                }
        	        ,connectOutput : function(stream) { 
                		this.filter.pipe( stream );
	                } 
        	};
	        return tmp;

	}
	                
        create( sandbox.name, sandbox.description, 
                (e)=>{
			// new entity exists now... (feedback created?)
			
			if( !("io" in e.sandbox) ) e.sandbox.io = {};

			var shellFilter = e.sandbox.io.command = shell.Filter( e.sandbox );

			var cons = clientFilter();
                        var send = cons.filter.push.bind(cons.filter);

			var nl = require(  './command_stream_filter/strip_newline.js' ).Filter();
			    
			nl.connectInput( cons.filter );

			shellFilter.connectInput( nl.filter);			
			shellFilter.connectOutput( cons.filter );
    
			//send( "/help" );
                        resultTo( e, send );
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

if( !module.parent ) {
	openServer( null );//newConsole( {} );
}

