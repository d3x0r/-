

//const Entity = require( '../Entity/entity.js');

const util = await require('util')
const stream = await require('stream')

var sack = await require( "sack.vfs" );
const JSOX = sack.JSOX;
const path = await require( "path" );

const shell = await require( "../Sentience/shell.js" );


const root = await require.resolve("./command_stream_filter/ui");

var disk = sack.Volume();
var myDisk = sack.Volume( "myDisk" );

console.warn( "Disk is open in:", root, shell, disk.dir() );


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

		console.warn( "Received request:", req.url );
		if( req.url === "/" ) req.url = "/index.html";
		var filePath = root + unescape(req.url);
		var extname = path.extname(filePath);
		var contentType = 'text/html';
		console.warn( ":", extname, filePath )
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
		var pend = [];
		spawnEntity( ws, sandbox, (e, input )=>{
			try {
				e.run( "webConsole Init", `wsThread.accept(Λ,(ws)=>{ 
							
							ws.onmessage( function( msg ) {             
								console.warn( "Received data:", msg );   
								var msg_ = JSOX.parse( msg );    \
								if( msg_.op === "write" ) {   \
									if( sendTo )   \
										sendTo( msg_.data );  \
									else   \
										pend.push(msg_.data ); \
								} else {   \
									\
							}  
							} );  
						ws.onclose( function() {  
								//console.log( "Remote closed" );  
							} );
							
							\
						}) ` )

				sack.WebSocket.Thread.post( e.Λ, ws )
				process.stdout.write( util.format("Completed creating entity for connection..., but then I have the WS and he needs it?", e, input ));
					pend.forEach( p=>input(p));
					pend.length = 0;
					entity = e;
					sendTo = input;
			}catch(err) {
				process.stdout.write( util.format( "OnConnect ERROR:", err ));
			}
		} );

			
		ws.onmessage( function( msg ) {
				console.warn( "Received data:", msg );
				var msg_ = JSOX.parse( msg );
				if( msg_.op === "write" ) {
					if( sendTo )
						sendTo( msg_.data );
					else
						pend.push(msg_.data );
				} else {
				
			}
			} );
		ws.onclose( function() {
				//console.log( "Remote closed" );
			} );
	} );
}

var counter = 1;

async function spawnEntity( ws, sandbox, resultTo ) {

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
		try {
		ws.send( JSON.stringify( {op:'write', data:chunk.toString( 'utf8' )} ) );
		} catch( err) { /* already closed... */ }
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
			tmp.filter.on("finish", ()=>{
				console.trace( "WebConsole Finish Event");
			});
			tmp.filter.on("end", ()=>{
				console.trace( "WebConsole End Event");
			});
			tmp.filter.on("close", ()=>{
				console.trace( "WebConsole Close Event");
			});
	        return tmp;

	}
	console.log( "So name:");

	create( await name+":"+counter, await description)
	.then( (e)=>{
			// new entity exists now... (feedback created?)
			
			//if( !("io" in e.sandbox) ) e.sandbox.io = {};
			//e.sandbox.io.command = 
			try {

			var shellFilter =  shell.Filter( e );


			var cons = clientFilter();
			var send = cons.filter.push.bind(cons.filter);
			process.stdout.write( "Should have send here...");
			var nl = require(  './command_stream_filter/strip_newline.js' ).Filter();
			    
			nl.connectInput( cons.filter );

			shellFilter.connectInput( nl.filter);			
			shellFilter.connectOutput( cons.filter );
    
			resultTo( e, send );
			}
			catch(err) {
				process.stdout.write( util.format( "Error in spawn callback", err ));
			}
		} )
	;


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
	//openServer( null );//newConsole( {} );
}

