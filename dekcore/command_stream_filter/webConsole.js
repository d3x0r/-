
//const Entity = require( '../Entity/entity.js');

const util = require('util')
const stream = require('stream')

var sack = require( "sack.vfs" );
const JSOX = sack.JSOX;
const path = require( "path" );
console.warn( "This is include sentience, in a sandbox." );
const shell = require( "shell.js" );
console.warn( "!!!!!!!!!! Shell:", shell );

const root = require.resolve("./ui");

var disk = sack.Volume();

console.trace( "Disk is open in:", disk.dir() );


function createSpawnServer( sandbox ) {

   console.warn( "Got 'sandbox...", sandbox.name );
  options = sandbox || {};
  var _this = this;

//  this.console = openConsole( _this.push.bind(_this) );

  //options.decodeStrings = false;
  stream.Duplex.call(this,options)
  

var serverOpts;
var server = sack.WebSocket.Server( serverOpts = { port: Number(process.argv[2])||9912 } )
console.trace( "serving on " + serverOpts.port + " at " + root);

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
	console.warn( "SPAWNING AN ENTITY..." );
	spawnEntity( ws, sandbox, (e, input )=>{
		console.warn( "Input callback?", input );
		entity = e;
                sendTo = input;

		input( "Some String" );
        	
        } );

	//console.log( "Connect:", ws );

	ws.onmessage( function( msg ) {
        	console.warn( "Received data:", msg );
        	var msg_ = JSOX.parse( msg );
                if( msg_.op === "write" ) {
                	console.warn( "Sending command data...", msg_.data, sendTo );
        		sendTo( msg_.data );
                }
		//ws.close();
        } );
	ws.onclose( function() {
        	//console.log( "Remote closed" );
        } );
} );


}




function filter( opts ) {
	return 
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
			console.warn( "THIS IS A RESULT ENTITY", e );
			
                        // new entity exists now... (feedback created?)
                        if( !("io" in e.sandbox) ) e.sandbox.io = {};

			e.sandbox.io.command = shell.Filter( e.sandbox );

			console.warn( "THis is something:", e.sandbox.io.command );

			var cons = clientFilter();

                        var send = cons.filter.push.bind(cons.filter);

			var nl = require(  './command_stream_filter/strip_newline.js' ).Filter();
			var cmd = require( './command_stream_filter/command.js').Filter();;
			    
			var shellFilter = e.sandbox.io.command;
    
			nl.connectInput( cons.filter );
			nl.connectOutput( shellFilter.filter );
			shellFilter.connectOutput( cons.filter );
    
			send( "/help" );
                        resultTo( e, send );
                    } );


}


util.inherits(createSpawnServer, stream.Duplex)

createSpawnServer.prototype._read = function( size ) {
	console.trace( "Read called...", size );  // 16384 by default... 
}
createSpawnServer.prototype._write = function( size ) {
	console.trace( "Write called...", size );  // 16384 by default... 
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

exports.Filter = Filter.bind(this );

if( !module.parent ) {
	openServer( null );//newConsole( {} );
}

