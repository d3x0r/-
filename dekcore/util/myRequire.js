"use strict";

const _debug = false;

const sack = require( 'sack.vfs' );
const https = sack.HTTPS;
const config = require( "../config.js" );
const nativeVol = sack.Volume();
const vm = require( 'vm' );
var fs;


var loadedModules = [];

exports.require = doRequire;
exports.resolve = doResolve;
exports.stripFile = stripFile;
exports.stripPath = stripPath;
exports.resolvePath = resolvePath;
exports.provide = provideDefault;
exports.sack = sack;
exports.eval = null;

var requireConfig = exports.config = { host:"", port:8550, config: null };

var runningModule = module;

function provideDefault( name, exports ) {
	loadedModules.push(  {
		filename: name,
		file : name,
		parent : runningModule,
		paths : ["."],
		exports : exports,
		loaded : true,
		local : true,
		rawData : '',
	} );
}

provideDefault( "myRequire.js", exports );

function doRequire( file ) {

	_debug&&console.warn( "DO REQUIRE:", file );
	var f = stripPath( file );
	var m = loadedModules.find( (m)=>m.file === f );
	if( m ) {
		//console.warn( "found by filename: ", f )
		return m.exports;
	}

	_debug&&console.warn( "Require for:", file );
	var thisModule = {
		filename: resolvePath( file, runningModule ),
		file : f,
		parent : runningModule,
		paths : [stripFile( file )],
		exports : {},
		loaded : false,
		local : true,
		rawData : '',
	};
	["rawData"].forEach( key=>{
		Object.defineProperty( thisModule, key, { enumerable:false, writable:true,configurable:false} );
	})


	if( file === "./config.js" || file === "../config.js" ) {
		console.warn( "well... ", file )
		return requireConfig.config;
	}

	let evalCode = false;
	let evalJson = false;
	let evalJson6 = false;

	if( file.endsWith( '.json' ) )
		evalJson = true;
	else 
	if( file.endsWith( '.json6' ) )
		evalJson6 = true;
	else {
		evalCode = true;
	}

	//console.warn( "module is ", file )
	if( file[1] === ':' || file[0] == '/' ) {
		_debug&&console.warn( "doing internal require for absolute path");
		thisModule.rawData = nativeVol.read( file );
		if( thisModule.rawData ) {
			thisModule.loaded = true;
		}
		else thisModule.rawData = "";
	}

	if( !thisModule.loaded ) {
		if( !(file[0] === '.' ) && !( file[0] === '/' ) && (file.indexOf('/')<0) ) {
			// check for allowed modules.
			_debug&&console.warn( "doing internal require for node module")
			return require( file );
		}

		if( (file[0] === '.' ) && ( file[1] === '/' ) ) {
			// check for allowed modules.
			_debug&&console.warn( "doing internal require for local module")
                        var data = nativeVol.read( file );
                        if( data ) {
	       			thisModule.rawData = data.toString();
				thisModule.local = true;
				thisModule.loaded = true;
                        }
		}



		_debug&&console.warn( "check in cache...");
		if( !fs ) fs = sack.Volume( "core/cache.dat" );

		_debug&&console.warn( "in another level?", file )
                
		if( fs.exists( file ) ) {
			var data = fs.read(file);
			if( data ) {
				thisModule.rawData = data.toString();
				thisModule.local = true;
			}
		}

		if( file[0] === ':' ) // ':' leading into a path forces reading a file from local storage
		{
			var buf = nativeVol.read( file.substr( 1 ) );
			if( buf ) {
				thisModule.rawData = buf.toString();
				thisModule.loaded = true;
			}
		}

		//console.warn( "load module:", thisModule)
		// http access requires leading slash for resources
		if( thisModule.filename[0] !== '/' )
			thisModule.filename = '/' + thisModule.filename;
	}

	if( !thisModule.loaded ) {
		var opts = {  hostname: requireConfig.host,
					  port : requireConfig.port,
					  method : "GET",
					  ca : config.caRoot,
					  rejectUnauthorized: true,
					  path : thisModule.filename// "/"+file
                                          //, agent : false
					};
        
		//console.warn( "options ", opts );
		_debug&&console.warn( "DO HTTP REQUIRE:", file );
if( true ) {        
		var res = https.get( opts );
                if( res.error ) {
			thisModule.loaded = true;
                        throw new Error( res.error + " FILE : " + file );
                } else {
	       		const statusCode = res.statusCode;
			const contentType = res.headers['Content-Type'];
			let error;
                        _debug && console.warn( "http get response happened..." );
			if (statusCode !== 200) {
				error = new Error(`Request Failed.\n` +
						`Status Code: ${statusCode}` + opts.path );
			} else if (/^text\/javascript/.test(contentType)) {
				evalCode = true;
			} else if (/^application\/javascript/.test(contentType)) {
				evalCode = true;
			} else if (/^application\/json/.test(contentType)) {
				evalJson = true;
			}
			else {
				error = new Error(`Invalid content-type.\n` +
								`Expected application/json or application/javascript but received ${contentType}`);
        
			}
			if (error) {
				console.warn(error.message);
				// consume response data to free up memory
				//res.resume();
				return;
			}
        		
			//res.setEncoding('utf8');
			thisModule.rawData = res.content;
                        
			_debug && console.warn( "http request ending" );
			_debug && console.trace( "loaded..." );
			thisModule.loaded = true;
		}
}
if( false) {        
		https.get( opts,
			(res) => {
			const statusCode = res.statusCode;
			const contentType = res.headers['content-type'];
			let error;
                        //console.warn( "http get response happened..." );
			if (statusCode !== 200) {
				error = new Error(`Request Failed.\n` +
						`Status Code: ${statusCode}` + JSON.stringify( opts ) );
			} else if (/^text\/javascript/.test(contentType)) {
				evalCode = true;
			} else if (/^application\/javascript/.test(contentType)) {
				evalCode = true;
			} else if (/^application\/json/.test(contentType)) {
				evalJson = true;
			}
			else {
				error = new Error(`Invalid content-type.\n` +
								`Expected application/json or application/javascript but received ${contentType}`);
        
			}
			if (error) {
				console.warn(error.message);
				// consume response data to free up memory
				res.resume();
				return;
			}
        
			res.setEncoding('utf8');
			res.on('data', (chunk) =>{ thisModule.rawData += chunk} );
			res.on('end', () => {
				console.warn( "http request ending" );
				//console.trace( "loaded..." );
				sack.Λ();
				thisModule.loaded = true;
			});
		}).on('error', (e) => {
			console.trace(`Got error in ${file}  ${e.message}`, e);
		});
		while(!thisModule.loaded) {
			//console.warn( "waiting to block until http request finishes", file )
			sack.Δ();
		}
}
	}

	var prior = runningModule;
	//console.trace( "Set running Module to ... thisModule" );
	runningModule = thisModule;
	if( evalJson || evalJson6 ) {
			try {
				if( evalJson6 )
					thisModule.exports = sack.JSON6.parse(thisModule.rawData);
				else
					thisModule.exports = JSON.parse(thisModule.rawData);
				_debug&&console.warn( "module resulted in", thisModule.exports, "\nFOR \n", thisModules.rawData)
			} catch (e) {
				console.warn(e.message);
			}
	}
	else {
		loadedModules.push( thisModule );
		if( !thisModule.local )
			fs.write( file, thisModule.rawData );
		try {
			var c=['//# sourceURL=',file,'\n'
					//,'try{
					, '(function(exports,rconfig,module,require){'
					, thisModule.rawData
					, '})(thisModule.exports,requireConfig.config,thisModule, doRequire);\n'
					//,'}catch(err){ console.warn( "EvalCatch:", err); console.warn( Object.keys(err));}\n'
					,'//# sourceURL=',file
					].join("");
			_debug&&console.warn( "Evaluating module....", thisModule.file, exports.eval, c );
			if( exports.eval )
				exports.eval( c );
			else {
				try {
					eval(c)
				} catch( err ) {
					try {
						vm.runInThisContext( c );		
					}catch( err1 ) {
						console.warn( "vm attempt:", err );
						throw { err,err1 };
					}
				}

            }
			//console.trace( "Finished... EXPORTS:", thisModule.exports );
		} catch( err ) {
			console.warn( "module threw...", err, " in ", file );
		}
	}
	//console.warn( "Set running Module to ...", prior );
	runningModule = prior;

	return thisModule.exports;
}

function stripFile( file ) {
	var i = file.lastIndexOf( "/" );
	var j = file.lastIndexOf( "\\" );
	i = ((i>j)?i:j);
	if( i >= 0 )
		return file.substr( 0, i );
	return "";
}
function stripPath( file ) {
	//console.warn( "File input is : ", file );
	var i = file.lastIndexOf( "/" );
	var j = file.lastIndexOf( "\\" );
	return file.substr( ((i>j)?i:j)+1 );
}

function doResolve( path ) {
	console.warn( "returning just path; is there... a current?", runningModule );
	return resolvePath( path, runningModule );
}
doRequire.resolve = doResolve;

function resolvePath( base, myModule ) {
	var tmp = base;
	var moduleParent = myModule;
	//_debug && 
	console.trace( "Resolving:", base, myModule, !!moduleParent, (tmp[0] == '.'
	&& tmp[1] !== ':'
	|| !( tmp.startsWith( "//" )
		&& tmp.startsWith( "\\\\" )  ) ));
	while( moduleParent ) {
		// is a path; stop building it.
		if( tmp[0] == '/' || tmp[0] == '\\' || tmp[1] == ':' )
			break;
		var p = moduleParent.paths[0];

		_debug&&console.warn( "path is ", tmp, moduleParent.paths);
		tmp = p + '/' + tmp;
		moduleParent = moduleParent.parent;
	}
	tmp = tmp.replace( /[/\\]\.[/\\]/g , '/' );
	var newTmp;
	console.log( "using path", tmp )
	while( ( newTmp = tmp.replace( /[/\\][^/\\\.]*[/\\]\.\.[/\\]/, '/' ) ) !== tmp ) {
		tmp = newTmp;
	}
	//tmp = tmp.replace( /([^.\\/]\.|[\.\\/][^.]|[^.\\/][^.])[^/\\]*[/\\]\.\.$/, '' );
	console.log( "using path", tmp )
	return tmp;
}
