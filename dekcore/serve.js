//-------------------------------------------------
//  default file server for https_server.js 
//-------------------------------------------------

const vfs = require( 'sack.vfs');
const vol = vfs.Volume();
const path = require( 'path' );
const config = require( "./config.js" );
const idGen = require( "./util/id_generator.js" );
const generator = ()=>idGen.generator(3);
const _debug_req = false; // first level; just enables logging the request and its remapping.
const _debug_info = false; // controls just logging 'serving X to Y'
const _debug = false;
const sessions = new Map();

var cgiHandler = null;
const webCache = new Map();
const webFileCache = new Map();



var trackingService = null;
var noAuthPage = null;


var firstRun = true;

var watchers = {};

function fixPath( s ) {
	return s.replace( /\\/g, "/" ).replace( /\/\//g, "/" );
}

function cacheResource( host, request, path, resource, contentType, dynamic, cb ){
	var c = webCache.get( request );
	var nameslash = path.lastIndexOf( "/" );
	var pathRoot = path.substr( 0, nameslash );

	_debug && console.log( "CacheResource Called:", pathRoot, path );
	if( resource && !watchers[pathRoot] ) {
		function scanDir( pathRoot ) {
			if(0) {
			var dir = vol.dir( pathRoot );
			for( var file in dir ) {
				file = dir[file];
				if( file.folder ) {
					if( file.name === '.' || file.name === '..' ) continue;
					scanDir( pathRoot+"/"+file.name );
				}
			}
			}
			if( !watchers[pathRoot] ) {
				watchers[pathRoot] = {
					monitor : vfs.FileMonitor( pathRoot ),			
				}
				watchers[pathRoot].monitor.addFilter( "*", (file)=>{
                                	file.path = fixPath( file.path );
					console.log( "Event on: ", file, request );
					c = webFileCache.get( file.path );
					if( c ) {
						//console.log ("Reloading resource:", c.path, file.path );
						c.resource = vol.read( file.path ); // it exists...
					} else {
						//console.log( "THis is probably more like, not cached yet, change doesn't matter..." );
						//console.log( "Failed to find changed file:", file );
					}
				} );
			}
		}
		scanDir( pathRoot );
	}
	if( !c ) {
		c = {
			path : path,
			//request:request,
			resource : resource,
			contentType : contentType,
			dynamic : dynamic,
			accessors : new Map(),
			id : null
		}
		_debug && console.log( "CACHE IS?", trackingService );
		if( trackingService )  {
			_debug && console.log( "Get tracking id:", trackingService, request, path );
			_debug && console.log( "THIS IS NOT NULL!", trackingService );
			trackingService.cache( host, request, path, contentType, dynamic, (id)=>{
				c.id = id;
				cb();
			} );
		}
                //console.log( "standard path?", path, fixPath( path ) )
		webCache.set( request, c );
		webFileCache.set( path, c );
	}
	return c;
}


function setupWatcher( path ) {
	var filename
}

module.exports = exports = function( internal, req, res, opts ) {
	var usePath = config.run.defaults.webRoot;
	var realReq = req.url;
	var reqHost = req.headers.Host;
	//console.log( "reqHost:", reqHost, req.connection.remoteAddress );
	if( reqHost )
		reqHost = reqHost.split( ":" )[0];
	
        var reqOriginal = req.url;
	if( !reqOriginal ) {
		cacheResource( reqHost||"NO HOST", "NO-PATH", "unauthorized.js", null, null, false, (cid)=>{
			trackingService && trackingService.access( cid, req.connection.remoteAddress );
		} );

		res.writeHead(404);
		res.end('<HTML><head><script src="userAuth/unauthorized.js"></script></head></HTML>');
		return;
	}
	        var n;
		for( n = 0; reqOriginal[n] == '/'; n++ );
		if( n ) reqOriginal = reqOriginal.substr( n -1 );
		req.url = reqOriginal;
		var useHost = config.run.defaults.webMap;
		{
			var list = config.run.defaults.hostList;
			if( list && req.headers.Host ) {
				useHost = list.find(( host)=>{
					var hosts = host.publicName.split( "~" );
					if( hosts.find( host=>host===reqHost ) )
						return true;
					return false;
				}) 

			}
		}
	//console.log( "UseHost is : ", useHost );

	//console.log( "original request:", req.url );
	if( !useHost ) {
		useHost = config.run.defaults; 
        }

	if( useHost && useHost.webMap ) {
		//console.log( "Path is:", useHost.webMap );
		usePath = useHost.webMap.find( dir=>req.url.startsWith(dir.path) )
		if( usePath ){
			req.url = req.url.substr( usePath.path.length );
			 usePath = usePath.filePath;
			console.log( "URL: PATH", req.url, usePath );
		}
	}
	else if( "webMap" in config.run.defaults ) {
		//console.log( "MAP:", config.run.defaults.webMap );
		usePath = config.run.defaults.webMap.find( dir=>req.url.startsWith(dir.path) )
		if( usePath ){
			req.url = req.url.substr( usePath.path.length );
			 usePath = usePath.filePath;
			console.log( "URL: PATH", req.url, usePath );
		}
	}
		if( usePath ) {
		    //console.log( "USE PATH : ", usePath )
		} else {
			usePath = useHost.webRoot;
		}

	var filePath;
	if( req.url.startsWith( "/cgi/" ) ) {
		if( cgiHandler ) {
			return cgiHandler( req, res );
		}
	}
	try {
		if( !internal ) {
			if( req.url.includes( ".." ) ) {
				res.writeHead(404);
				res.end('<HTML><head><script src="userAuth/unauthorized.js"></script></head></HTML>');
				return;
			}
			filePath = usePath + unescape(req.url);
			if (filePath === usePath + ''
			  ||filePath === usePath + '/'
			  ||filePath === usePath + '.'
			  ||filePath === usePath + './'
			  ||( vol.isDir( filePath ) )
			  ) {
				res.writeHead( 301, { 'Content-Type': 'text/html'
                                                , 'Location':'https://' + req.headers.Host + reqOriginal + "/index.html" });
				res.end( "<HTML><HEAD><TITLE>301 Index Redirect</TITLE></HEAD><BODY>This path requires a resource name..</BODY></HTML>");
				//console.log( "REPLIED WITH A 301", filePath );
				return;
			}
		}
		else {
			filePath = '.' + unescape(req.url);
						if( filePath === "./" ) {
							filePath = "./index.html";
						}
		}
	} catch(err) {
		console.log( "Is there a error we're missing somehow?", err );
	}

	console.log( "Serve:", filePath, "for:",  req.connection.remoteAddress );

	var cache = webCache.get( realReq );

	//_debug && console.log( "Request is from:", req.connection.remoteAddress );
	// req.connection.remotePort
	// req.headers.origin?  // not impelmented yet for sure in request
	if( !cache )  {
		var extname = path.extname(filePath);
		var contentType = 'text/html';
		switch (extname) {
			case '.bat':
			case '.dll':
			case '.exe':
			case '.cmd':
			case '.com':
			case '.msi':
				contentType = 'application/x-msdownload';
				break;
			case '.js': case '.mjs':
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
		}
	} else 
		contentType = cache.contentType;
		
	_debug || _debug_req &&  console.log( "serving a relative...", contentType, req.url, filePath );

	if( cache || vol.exists( filePath  ) ) {
		var content;
		if( (cache && cache.dynamic) || filePath.endsWith( ".js.html" ) ) {
			var newCache = cache || cacheResource( reqHost, realReq, filePath, vol.read( filePath ), contentType, true, ()=>{
		                trackingService && trackingService.access( newCache.id, req.connection.remoteAddress );
			} ) ;
			if( newCache )
				content = process( req,  newCache.resource );
			else {
				console.log( "if caching fails, this would fail too?" );
				content = process( req,  vol.read( filePath ) );
			}

		} else {
			if( cache ){
				if(!( content = cache.resource ))
				{
                                	trackingService && trackingService.access( cache.id, req.connection.remoteAddress );

					res.writeHead(404);
					res.end('<HTML><head><script src="userAuth/unauthorized.js"></script></head></HTML>');
					return;					
				}

			}else {
				var tmp = vol.read( filePath );
				if( tmp ) {
					content = tmp/*.toString()*/;
					cache = cacheResource( reqHost, realReq, filePath, content, contentType, false, ()=>{
				                trackingService && trackingService.access( cache.id, req.connection.remoteAddress );
					} );
				} else {
					cache = cacheResource( reqHost, realReq, "FILE NOT FOUND", null, null, false, (id)=>{
	                                	trackingService && trackingService.access( id, req.connection.remoteAddress );
					} );

					res.writeHead(404);
					res.end('<HTML><head><script src="userAuth/unauthorized.js"></script></head></HTML>');
					return;
				}
			}
		}
		if( cache.id )
	                trackingService && trackingService.access( cache.id, req.connection.remoteAddress );
		res.writeHead(200, { 'Content-Type': contentType });
        	// console.log( "send buffer...", content );
                //console.log( "Content:", content );
		res.end(content);
		_debug && console.log( "serve.js:ending with success...", content.Length );
	}
	else{
		_debug && console.log( "exists on", filePath, "is false.")
		cache = cacheResource( reqHost, realReq, "FILE NOT FOUND", null, null, false, (id)=>{
			trackingService && trackingService.access( id, req.connection.remoteAddress );
		} );
		res.writeHead(404);
		res.end('<HTML><head><script src="userAuth/unauthorized.js"></script></head></HTML>');
	}
}

// define this.session and this.bodyCGI.sesskey
const session_header = '${(function(_this) {                                     \
	if( _this.content ) {                                                    \
		_this.bodyCGI = _this.content.split( "&" ).reduce( (acc,line)=>{ \
			line = line.replace( /[\+]/g, " " );                     \
			var l=line.split( "=" );                                 \
			if( l[0].includes("%") )                                 \
				l[0] = decodeURIComponent(l[0]);                 \
			if( l[1].includes("%") )                                 \
				l[1] = decodeURIComponent(l[1]);                 \
			acc[l[0]]=l[1]; return acc; }, {} );                     \
	}                                                                        \
	_this.bodyCGI = _this.bodyCGI || { sesskey:idGen.generator() };          \
	_this.session = sessions.get( _this.bodyCGI.sesskey );                   \
	if( !_this.session ) {                                                   \
		_this.session = {                                                \
			created : Date.now()                                     \
			, updated: Date.now()                                    \
			, connection: _this.connection                            \
		};                                                               \
		sessions.set( _this.bodyCGI.sesskey, _this.session );            \
	}                                                                        \
        else {                                                                   \
		if( _this.connection.remoteAddress !== _this.session.connection.remoteAddress ) { \
                        return "<SCRIPT>location.href = location.href;</SCRIPT>";  \
		}                                                                \
        }                                                                        \
	_this.session.updated = Date.now();                                      \
	return "";                                                               \
})(this) }\n';


function process( ThisState, HTML ) {
	if( HTML.includes( "\\" ) ) HTML = HTML.replace( /[\\]/g, "\\\\`" );
	if( HTML.includes( "`" ) ) HTML = HTML.replace( /[`]/g, "\`" );
	//n> var tstr = "${this.x}?"; new Function("return `" + tstr + "`").call({x:1})
	try {
		//console.log( ["return `",session_header,HTML,"`"].join("") )
		var page = new Function( "idGen", "sessions", ["return `",session_header,HTML,"`"].join("")).call( ThisState, idGen, sessions );
	} catch( err ) {
		console.log( "Fault:", err, err.toString() );
		return err.toString();
	}
	return page;
}

// delete sessions that have been unused for 1 hour.
function timeoutSessions() {
	var now = Date.now();
	sessions.forEach( (val,key,map)=>{
		if( now - val.updated < ( 4 * 15 * 60 * 1000 ) )
			sessions.delete( key );
	} );
	setTimeout( timeoutSessions, 5 * 60 * 1000 ); // every 5 minutes, check if they are 1 hour old.
}
timeoutSessions();

exports.cgiHandler = function(cb) {
	cgiHandler = cb;
}

exports.trackingService = function( cb ) {
	//console.log( "Setting trackingSErvice to websock:", cb );
	trackingService = cb;
}

