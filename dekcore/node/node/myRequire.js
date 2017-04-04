"use strict";

var https = require( 'https' );
const sack = require( 'sack.vfs' );
var fs = sack.Volume( "cache", "cache.dat" );
var ws = require( 'ws' );

var loadedModules = [];

exports.require = doRequire;
exports.resolve = doResolve;
exports.stripFile = stripFile;
exports.stripPath = stripPath;
exports.resolvePath = resolvePath;
exports.provide = provideDefault;
exports.sack = sack;
exports.eval = null;

var requireConfig = exports.config = { host:"", port:8000, config: null };

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
      } )  ;
}

provideDefault( "myRequire.js", exports );

function doRequire( file ) {

  var f = stripPath( file );
  var m = loadedModules.find( (m)=>m.file === f );
  if( m ) {
    console.log( "found by filename: ", f )
    return m.exports;
  }

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

  //console.log( "load module:", thisModule)
  // http access requires leading slash for resources
  if( thisModule.filename[0] !== '/' )
    thisModule.filename = '/' + thisModule.filename;

  if( file === "./config.js" || file === "../config.js" ) {
    console.log( "well... ", file ) 
    return requireConfig.config;
  }
  //console.log( "module is ", thisModule )
  if( !(file[0] === '.' ) && !( file[0] === '/' ) && (file.indexOf('/')<0) ) {
      // check for allowed modules.
      return require( file );
  }

  //console.log( "in another level?", file )
  if( fs.exists( file ) ) {
	thisModule.rawData = fs.read( file).toString();
	thisModule.local = true;
  }

    let evalCode = false;
    let evalJson = false;

    var opts = {  hostname: requireConfig.host,
                  port : requireConfig.port,
                  method : "GET",
                  rejectUnauthorized: false,
                  path : thisModule.filename
                };
                
    //console.log( "options ", opts );
    
    https.get( opts,   
      (res) => {
        const statusCode = res.statusCode;
        const contentType = res.headers['content-type'];
        let error;
        if (statusCode !== 200) {
          error = new Error(`Request Failed.\n` +
                            `Status Code: ${statusCode}`);
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
          console.log(error.message);
          // consume response data to free up memory
          res.resume();
          return;
        }

        res.setEncoding('utf8');
        res.on('data', (chunk) => thisModule.rawData += chunk);
        res.on('end', () => {
          //console.log( "end" );
          //console.trace( "loaded..." );
          sack.Λ();
          thisModule.loaded = true;
        });
      }).on('error', (e) => {
        console.trace(`Got error: ${e.message}`, e);
      });
      
    while(!thisModule.loaded) sack.Δ(); 

    var prior = runningModule;
    runningModule = thisModule;
    if( evalJson ) {
            try {
              thisModule.exports = JSON.parse(thisModule.rawData);
            } catch (e) {
              console.log(e.message);
            }
	}
	else {
	    loadedModules.push( thisModule );
	if( !thisModule.local )
	    fs.write( file, thisModule.rawData );
            try {
              var c=['(function(exports,config,module,require){', thisModule.rawData, '})(thisModule.exports,requireConfig.config,thisModule, doRequire);\n//# sourceURL=',file].join("");
              //console.log( "Evaluating module....", thisModule.file );
              if( exports.eval )
                thisModule.exports = exports.eval( c );
              else
                thisModule.exports = eval(c)
              //console.trace( "Finished..." );
            } catch( err ) {
              console.log( "module threw...", err );
            }
	}
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
  //console.log( "File input is : ", file );
  var i = file.lastIndexOf( "/" );
  var j = file.lastIndexOf( "\\" );
  return file.substr( ((i>j)?i:j)+1 );
}

function doResolve( path ) {
	console.log( "returning just path; is there... a current?", runningModule );
	return resolvePath( path, runningModule );
}

function resolvePath( base, myModule ) {
  var tmp = base;
  var moduleParent = myModule;
  if( moduleParent 
          && tmp[0] == '.' 
          && tmp[1] !== ':' 
          && !( tmp.startsWith( "//" ) 
              || tmp.startsWith( "\\\\" ) )
        ) {
	var p = moduleParent.paths[0];
	
	//console.log( "path is ", tmp, moduleParent.paths);
      if( tmp[1] == '/' )
        tmp = (p.length?p + "/":"") + tmp.substr( 2 );
      else
        tmp = (p.length?p + "/":"") + tmp;
       // console.log( "new is ", tmp )
      moduleParent = moduleParent.parent;
  }
  do
  {
      //console.log( "build", tmp )
      let x = tmp.indexOf( "/../" );
      if( x < 0 )x = tmp.indexOf( "/..\\" );
      if( x < 0 )x = tmp.indexOf( "\\../" );
      if( x < 0 )x = tmp.indexOf( "\\..\\" );
      if( x > 0 ) {
        var prior = tmp.substr( 0, x );
        //console.log( "prior part is", prior );
        var last1 = prior.lastIndexOf( "/" );
        var last2 = prior.lastIndexOf( "\\" )
        var priorStripped = prior.substr( 0, (last1>last2?last1:last2)+1 );
        tmp = priorStripped + tmp.substr( x + 4 );
        //console.log( "result:", base )
      } else {
	/*
	if( tmp.startsWith( "..\\" ) 
	   || tmp.startsWith( "../" ) )
	{
		
	}
	*/
        base = tmp;       
        break;
      }
  }
  while( true )
  //console.log( "using path", base )
  return base;
}

