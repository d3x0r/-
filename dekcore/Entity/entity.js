"use strict";
const _debug_require = false;
const _debugPaths = _debug_require || false;
const _debug_threads = false;

const events = require('events');
const os = require( 'os' );
const url = require( 'url' );
const tls = require( 'tls' );
const https = require( 'https' );
const path = require( 'path' );
const cp = require( 'child_process');
const vm = require('vm');
const fs = require('fs');
const stream = require('stream');
const util = require('util');
const process = require('process');
const crypto = require('crypto');
const sack = require( "sack.vfs" );
const vfs = require('sack.vfs');
const vol = vfs.Volume();
const vfsNaked = require('sack.vfs');
const JSOX = sack.JSOX;
const netRequire = require('../util/myRequire.js');
var fc = require('../file_cluster.js');

const config = require('../config.js');

function doLog(...args){
	var s = util.format(...args);
	vfs.log(s);
	console.log(s);
}

var entity = module.exports = exports = {
	create: makeEntity,
	theVoid: null,
	getObjects: exported_getObjects,
	getEntity: getEntity,
	netRequire: netRequire,
	addProtocol: null, // filled in when this returns
	config : config,
	makeEntity: makeEntity,
	idMan : null//idMan
}

const wake = require('../Sentience/wake');
//const idMan = require('../id_manager.js');

const ee = events.EventEmitter;
var objects = [];
var remotes = new WeakMap();
var childPendingMessages = new Map();

/*
JSOX.defineClass( "Entity", { name:null } );
JSOX.registerToJSOX( "Entity", Entity, (obj)=>{
		return '"THIS STRING REPRESENTS AN ENTITY"';
	} );
*/

function sandboxWS( url, protocols ) {
	let self = this;
	if( !(this instanceof sandboxWS) )
		return new sandboxWS( url, protocols );

	this.ws = new sack.WebSocket.Client( url, protocols );
	this.keyt = entity.idMan.xkey(null);
	this.keyr = entity.idMan.xkey(null);
	//doLog( "Key is:", this.keyt)
	this.send = (buf)=>{
		if( !this.keyt.key ) {
			this.keyt.setKey( buf, 0 );
			this.keyr.setKey( buf, 1 );
			this.ws.send( buf );
		} else {
			this.ws.send( entity.idMan.u8xor( buf, this.keyt ) );
		}
	};
	this.close = function() { this.ws.close() };
	this.onopen = function(cb){ this.on( "open", cb ) }
	this.onmessage = function(cb){ this.on( "message", cb ) }
	this.onerror = function(cb){ this.on( "error", cb ) }
	this.onclose = function(cb){ this.on( "close", cb ) }
	this.on = function(event,cb) {
		if( event === 'message' ) {
			this.ws.on( 'message', function(buf){
				//doLog( "sending...", self)
				cb( entity.idMan.u8xor( buf, self.keyr ) );
			})
		}else {
			this.ws.on( event, cb );
		}
	}
	const tmp = ["keyr", "keyt", "ws"];
	tmp.forEach(function(key) {
		Object.defineProperty(self, key, { enumerable: false, writable: false, configurable: false });
	})
}

function sandboxWSS( opts ) {
	let self = this;
	if( !(this instanceof sandboxWSS) )
		return new sandboxWS( url, protocols );

	this.ws = new ws.Server( opts );

	this.on = function(event,cb) {
		if( event === 'connection' ) {
			this.ws.on( 'connection', function(ws) {
				
				ws.keyt = entity.idMan.xkey(null);
				ws.keyr = entity.idMan.xkey(null);
				doLog( "Key is:", ws.keyt)
		                				
				ws.send = ((orig)=>{(buf)=>{
					orig( entity.idMan.u8xor( buf, ws.keyt ) );
				}} )(ws.send.bind( ws ) );
				//ws.close = function() { ws.close() };
				ws.onopen = function(cb){ ws.on( "open", cb ) }
				ws.onmessage = function(cb){ ws.on( "message", cb ) }
				ws.onerror = function(cb){ ws.on( "error", cb ) }
				ws.onclose = function(cb){ ws.on( "close", cb ) }
				ws.on = (( orig )=>{ return function(event,cb) {
					if( event === 'message' ) {
						orig( 'message', function(buf){
							if( !ws.keyt.key ) {
								ws.keyt.setKey( buf, 1 );
								ws.keyr.setKey( buf, 0 );
							}else {
								//doLog( "sending...", self)
								cb( entity.idMan.u8xor( buf, self.keyr ) );
							}
						} );
					} else {
						orig( event, cb );
					}
				} } )( ws.on.bind( ws ) );
				const tmp = ["keyr", "keyt" ];
				tmp.forEach(function(key) {
					Object.defineProperty(ws, key, { enumerable: false, writable: false, configurable: false });
				})
						
				cb( ws );	
			} );
		}else {
			doLog( "unknown event specified:", event );
		}
	}
}



//doLog( "dirname is", __dirname );
// Entity events
//  on( 'create', (self)=>{  } )
//  on( 'restore', (self)=>{ } )
//  on( "attachted", ( self,toOther)=>{ })
//  on( "dropped", ( self, old_container )=>{ } )
//  on( "detached", (self, fromOther){ } )
// on( "contained", ( self ){ } )
// on( "relocated", ( self, old_container )=>{ } )
// on( "rebase", ( self )=>{ } )

// onWake after Sentient

// Entity Methods
// Entity( maker ) // returns Entity
// e.create( Object )  // returns new e
//   with maker as object


// e.grab( something[ ,(something)=>{ /*something to run on success*/  }] )
//       if a thing is known, move it to internal storage
//           invoke onrelocated
//
// e.store( something )
// e.store( somthing [,inthing] )
// e.drop( thing )
//   thing has to have been contained in e
//   if thing is attachd to other things,
//        if that thing is the immediate content in e, all objects get moved.
//        if that thing is only attached to the single point, that thing itself wil be detatched
//             and that thing willl be dropped, receiving both detached and reloated events
// returns thing

// e.rebase(a)
//       if a is something that's attached, set that as the 'contained' objects
//          if it's not already the contained object... emit event rebase( a)
//    returns e
// e.debase()
//     if there is something attached to it, mkae that the contained objects
//         if( moved contained ) event rebase( a)
//          if( moved contained ) event newroot(a) to container
//    returns e


//
//doLog( "vfsNaked is something?", vfsNaked );

const volOverride = `(function(vfs, dataRoot) {
	vfs.mkdir = vfs.Volume.mkdir;
	vfs.Volume = (function (orig) {
		// entities that want to use the VFS will have to be relocated to their local path
		return function (name, path, v, a, b) {
			//doLog("what's config?", config);
			if( name === undefined ) 
				return orig();
			var privatePath = dataRoot + "/" + config.run.Λ + "/" + path;
			//doLog("Volume overrride called with : ", name, dataRoot + "/" + config.run.Λ + "/" + path, orig);
			//doLog("Volume overrride called with : ", a, b );
			try {
				return orig(name, privatePath, v, a, b);
			} catch(err) {
				doLog( "limp along?" );
			}
		}
	})(vfs.Volume);
	var tmp = vfs.Sqlite.op;

	vfs.Sqlite = (function(orig) {
		return function (path) {
			//doLog("what's config?", config);
			if( path[0] === "$" ) return orig( path );
			if( path.includes( "." ) ) {
				var privatePath = dataRoot + "/" + config.run.Λ + "/" + path;
				if( dataRoot !== "." ) {
					var zz1 = privatePath.lastIndexOf( "/" );
					var zz2 = privatePath.lastIndexOf( "\\\\" );
					var pathPart = null;
					if( zz1 > zz2 )
						pathPart = privatePath.substr( 0, zz1 )
					else
						pathPart = privatePath.substr( 0, zz2 )
					doLog( "Make directory for sqlite?", pathPart, privatePath )
					vfs.mkdir( pathPart );
				}
				doLog("Sqlite overrride called with : ", dataRoot + "/" + config.run.Λ + "/" + path);
				try {
					return orig( privatePath );
				} catch(err) {
					doLog( "limp along?", err );
				}
			}
			else return orig( path );
		}
	})(vfs.Sqlite);
	vfs.Sqlite.op = tmp;
})`

config.start( ()=>eval( volOverride )( vfs, config.run.defaults.dataRoot ) )



//var all_entities = new WeakMap();
var objects = new Map();

var drivers = [];

var nextID = null;

//Λ

//const sentience = require( "../Sentience/shell.js");

function EntityExists(key, within) {
	if (objects.get(key))
		return true;
	if (entity.idMan.Auth(key)) {
		fc.restore(within, key, (error, buffer) => {
			if (error)
				throw error;
			var e = makeEntity(config.run);
			e.fromString(buffer);
		})
	}
}

var createdVoid = false;
var base_require;


function sealEntity(o) {
	//doLog( "before sealing:", JSOX.stringify(o ) );
	[ //"container", 
		//"contents", 
		"attached_to", "created", "created_by"
	].forEach(key => {
		Object.defineProperty(o, key, { enumerable: true, writable: true, configurable: false });
	})

	/*
	for( var k in o ){
		if( typeof o[k] === "function")
			Object.defineProperty(o, k, { enumerable: false, writable: true, configurable: false });
	}
	*/
	if(0)
		[ "attach", "create"
		, "has_value", "loaded"
		, "assign", "detach", "rebase", "debase", "drop", "store", "fromString", "toString"
		, "EventEmitter", "usingDomains", "defaultMaxListeners", "init", "listenerCount", "requested"
		, "addListener", "removeListener", "removeAllListeners", "vol"
		//,"nearObjects"
		].forEach(key => {
		});
	["Λ", "JSOX", "sandbox"].forEach(key => {
		Object.defineProperty(o, key, { enumerable: false, writable: true, configurable: false });
	})
	Object.defineProperty(o, "io", { enumerable: false, writable: true, configurable: true });
}


function makeEntity(obj, name, description, callback, opts) {
	if (this instanceof makeEntity) throw new Error("Please do not call with new");
	if (!name && !description) {
		//var all = all_entities.get(obj);
		var named = objects.get(obj);
		//doLog( "Got",  named, obj )
		obj = named || obj;
		return named;
	}
	//doLog("Called with obj:", name, description, JSOX.stringify(obj,null,"\t"), JSOX.stringify(createdVoid,null,"\t"));

	if (typeof (obj) === "string") {
		//doLog( "resolve obj as entity ID")
		obj = objects.get(obj);
		//if( obj ) return obj;
		//doLog( "resolve obj as entity ID", obj)
	}

	if (obj && !obj.Λ) {
		base_require = require;
		obj = null;
	}
	if ((!obj || !(objects.get(obj.Λ))) && createdVoid) {
		doLog("All Entities", all_entities);
		doLog("Objects", objects);
		doLog("invalid object is ", obj);
		throw new Error(["Invalid creator object making this one", obj].join(" "));
	}
	if (!config.run.Λ) {
		doLog( "had to wait for config.run", name, description )
		config.start(() => { makeEntity(obj, name, description, callback, opts) })
		return;
	}
	if (!obj) {
		if( !entity.idMan ) { config.start(() => { makeEntity(obj, name, description, callback, opts) })
			return }
		createdVoid = entity.idMan.localAuthKey;
		//doLog( "Setting void to localAuthkey..." );
	}
	var o = new Entity( obj, name, description );
	if( nextID ) {
		o.Λ = nextID;
		nextID = null;
		finishCreate();
	}
	else entity.idMan.ID(obj || createdVoid, config.run, (key) => {
		o.Λ = key.Λ;
		//doLog( "object now has an ID", o.name, o.Λ, key.Λ );
		finishCreate();
	} );
	function finishCreate( ) {
		//doLog( " ----- FINISH CREATE ---------" );
		if( opts && opts.fork ) {

			o.child = cpts.fork( "childEntity.js", [o.Λ, ] )
			o.child.on( "message", (msg)=>{
				if( msg.op === "present" ) {
					o.child.send( { op:"first message test"});
				}
			})
		} else {
			//doLog( "Used tocreate sandbox here, after getting ID")
		}

		if (o.within) o.within.contains.set(o.Λ, o);
		else {
			o.within = o;
			objects.set(o.Λ, o);
			objects.set(createdVoid.Λ, o);
		}
		objects.set(o.Λ, o);
		//o.attached_to.set(o.Λ, o);

		sealEntity(o);
		if( o.within ) {
			if( o.within.thread ) {
				o.within.thread.emit("created", o.Λ);
				o.within.thread.emit("stored", o.Λ);
			}
		}
		o.within.contains.forEach(near => (near !== o) ?
			( near.thread )&&
				near.thread.emit("joined", o.Λ) 
			: 0 
		);

		if (!callback)
			throw ("How are you going to get your object?");
		else {
			//doLog(" ---------- Result with completed, related object ------------------ ");
			if( typeof( callback ) === "string" )  {
				o.sandbox.require( callback );
				opts(o);
			}
			else
				callback(o);
		}

	}

}


	async function sandboxRequire(o,src) {
		if( !o || !src )
			console.trace( "FIX THIS CALLER this is", o, src );

		//var o = this ; //makeEntity( this.me );
		_debug_require && console.trace("sandboxRequire ",  src );
		//doLog( "module", o.sandbox.module );
		if (src === "entity.js") return exports;
		if (src === "shell.js") return exports.Sentience;
		if (src === "text.js") return text;
		if (src == 'ws') {
			return sandboxWS;
		}
		if (src == 'wss') {
			return sandboxWSS;
		}
		if (o.permissions.allow_file_system && src == 'fs') return fs;
		if (o.permissions.allow_file_system && src == 'stream') return stream;
		if (src == 'crypto') return crypto;
		if (src == 'util') return util;
		if (src == 'vm') return vm;
		if (src == 'os') return os;
		if (src == 'url') return url;
		if (src == 'tls') return tls;
		if (src == 'https') return https;
		if (src == 'path') return path;
		if( src == 'child_process' ) return cp;
		if( src == 'process' ) return process;
                if( src.substr( src.length-8 ) == "sack-gui" ) return sack;
		//if (src == 'path') return path;

		if (src == 'events') return events;

		if (src == 'sack.vfs') {
			doLog( "Should change default volume interface?");
			/*
			if( o.sandbox )
			if( !("_vfs" in o.sandbox ) ) {
				//doLog( "Overriding internal VFS", o.name )
				try {
					o.sandbox._vfs = Object.assign( {}, vfsNaked );
				}catch(err ) {
					doLog( "vfsNaked is:", vfsNaked );
				}
				o.sandbox._vfs.Volume = o.sandbox._vfs.Volume.bind( {} );
				o.sandbox._vfs.Sqlite = o.sandbox._vfs.Sqlite.bind( {} );
				try {
					return new Promise( (resolve,reject)=>{
						e.thread.run( src, "(" + volOverride + ')(this._vfs,"' +  "." +'")' ).then( resolve ).catch(reject);
					})

					//vm.runInContext( "(" + volOverride + ')(this._vfs,"' +  "." +'")' , o.sandbox
					//	, { filename: "moduleSetup" , lineOffset: 0, columnOffset: 0, displayErrors: true, timeout: 1000 })
				} catch( err) {
					doLog( "VM Error:", err );
				}
			}
			*/
			return vfs;
			//return o.sandbox._vfs;
		}

		//doLog( "blah", o.sandbox.scripts)
		if( o.scripts.index < o.scripts.code.length ) {
			var cache = o.scripts.code[o.scripts.index];
			//doLog( "cache is?", typeof cache, cache);
			if( cache.source === src ) {
				o.scripts.index++;

				var oldModule = o._module;
				var root = cache.closure.root;
				if( !cache.closure.paths ){
					doLog( "About to log error?" );
					doLog( "Undefined paths:", cache.closure.paths, __dirname , ".");
					cache.closure.paths = [process.cwd()];
				}
				var thisModule = {
					filename: cache.closure.filename
					, src : cache.closure.src
					, source : "/*debughidden*/"//cache.closure.source
					, file: ""
					, parent: o._module
					, paths: cache.closure.paths
					, exports: {}
					, includes : []
					, loaded: false
				}
				//doLog( "NEW MODULE HERE CHECK PATHS:", cache.closure.paths, cache.closure.filename )

				oldModule.includes.push( thisModule );
				//        { name : src.substr( pathSplit+1 ), parent : o.module, paths:[], root : rootPath, exports:{} };
				//oldModule.children.push( thisModule );
				doLog( "THIS IS ANOHER RUN THAT SETS o_MODULE");
				o._module = thisModule;

				var root = cache.closure.filename;
				try {
					//doLog( "closure recover:", root, cache.closure )
					var file = fs.readFileSync(root, { encoding: 'utf8' });
				} catch (err) {
					doLog("File failed... is it a HTTP request?", src, root, err);
					return undefined;
				}
				if( file !== cache.closure.source ) {
					doLog( "updating cached file....", src )
					cache.closure.source = file;
					exports.saveAll();
				}
				var code = ['(async function(exports,module,resume){'
					, cache.closure.source
					, '})(_module.exports, _module, true );\n//# sourceURL='
					, root
				].join("");

				//doLog( "Executing with resume TRUE")
				try {
						doLog( "Run this script..." );
					await o.thread.run( {src:src,path:thisModule.paths[0]}, code );
					//vm.runInContext( code, o.sandbox
					//	, { filename: cache.source , lineOffset: 0, columnOffset: 0, displayErrors: true, timeout: 1000 })
				} catch( err ) {
					doLog( "VM Error:", err );
				}
				doLog( "THIS IS THE OTHER POP FOR THAT ")
				o._module = oldModule;
				//doLog( "active base module is ... ")
				return thisModule.exports;
			}
		}

		var rootPath = "";
		// resolves path according to relative path of parent modules and resolves ".." and "." parts
		_debugPaths && doLog( o.name, JSOX.stringify( o._module,null, "\t"   ));
		var root = src;//netRequire.resolvePath(src, o._module);
		_debugPaths && doLog("src could be", src);
		_debugPaths && doLog("root could be", root);
		_debugPaths && doLog("working root is ", rootPath);
		try {
			var file = fs.readFileSync(root, { encoding: 'utf8' });
		} catch (err) {
			doLog("File failed... is it a HTTP request?", err);
			return undefined;
		}
		//doLog( o.module.name, "at", rootPath,"is loading", src );
		//var names = fs.readdirSync( "." );
		//doLog( names );
		var pathSplita = src.lastIndexOf("/");
		var pathSplitb = src.lastIndexOf("\\");
		if (pathSplita > pathSplitb)
			var pathSplit = pathSplita;
		else
			var pathSplit = pathSplitb;

		if (src.startsWith("./"))
			rootPath = rootPath + src.substr(2, pathSplit - 2);
		else if (src.startsWith("../"))
			rootPath = rootPath + src;//src.substr(2,pathSplit-2 );
		else
			rootPath = rootPath + src.substr(0, pathSplit);

		//doLog( "set root", rootPath );

		const filePath = netRequire.stripFile(root);
		//doLog( "This will be an async function...posted to run..." );
		var code =
			['(async function() { var module={ path:'+ JSON.stringify(filePath) +',src:'+ JSON.stringify(src) +',parent:{},exports:{}}; '
				, 'this.module.paths.push(' + JSON.stringify(filePath)  + ");"
				, 'await (async function(global,exports,module,resume){'
				, file
				, '}).call(this,this,module.exports,module,false );'
				, 'this.module.paths.pop();'
				, 'return module.exports;})().catch(err=>{doLog( "caught require error:", err)})\n//# sourceURL='
				, root
			].join("");

		var oldModule = o._module;
		var thisModule = {
			filename: root
			, src : src
			, source : "/*DebugHIdeenSource"//file
			, file: netRequire.stripPath(root)
			, parent: o._module
			, paths: [netRequire.stripFile(root)]
			, exports: {}
			, includes : []
			, loaded: false
			, toJSON() {
				//doLog( "Saving this...", this );
				return JSOX.stringify( { filename:this.filename, file:this.file, paths:this.paths, src:this.src, source:this.source })
			}
			, toString() {
				return JSOX.stringify( {filename:this.filename, src:this.src })
			}
		}
		oldModule.includes.push( thisModule );

		o._module = thisModule;

		_debug_threads &&  doLog( o.name, "POSTED CODE TO RUN TO THE OTHER THREAD... AND WE WAIT (upushed to stack", o._module.src );
			return o.thread.run( {src:src,path:thisModule.paths[0]}, code ).then( (v)=>{
				
				o._module = oldModule;
				//doLog( o.name, "RUN RESULT:", v, thisModule.file );
			}).catch( e=>{
				o._module = oldModule;
				//doLog( "Catch error of course?", e );
			} );
	}

function sandboxRequireResolve(path){
	var o = makeEntity( this.me );
	if( !o || !this ) {
		//doLog( "Not in a sandbox, relative to object, so ...", module.path  );
		var tmp = module.path + "/" + path;
		tmp = tmp.replace( /[/\\]\.[/\\]/g , '/' );
		tmp = tmp.replace( /([^.]\.|\.[^.]|[^.][^.])[^/\\]*[/\\]\.\.[/\\]/g , '' );
		tmp = tmp.replace( /([^.]\.|\.[^.]|[^.][^.])[^/\\]*[/\\]\.\.$/g , '' );
		doLog( "final otuput:", tmp );
		return tmp;
	}
	doLog( "RESOLVE IS TRYING:", path , o._module.paths, o.name );

	var usePath = o._module.paths?o._module.paths[0]+"/":"";
	var tmp = usePath + path;
	//doLog( "append:", tmp );
	tmp = tmp.replace( /[/\\]\.[/\\]/g , '/' );
	tmp = tmp.replace( /([^.]\.|\.[^.]|[^.][^.])[^/\\]*[/\\]\.\.[/\\]/g , '' );
	tmp = tmp.replace( /([^.]\.|\.[^.]|[^.][^.])[^/\\]*[/\\]\.\.$/g , '' );
	while( ( newTmp = tmp.replace( /[/\\][^/\\\.]*[/\\]\.\.[/\\]/, '/' ) ) !== tmp ) {
		tmp = newTmp;
	}
	tmp = tmp.replace( /[^/\\]*[/\\]\.\.[/\\]/g , '' );
	tmp = tmp.replace( /[^/\\]*[/\\]\.\.$/g , '' );
	//doLog( "final otuput:", tmp );
	return tmp;
}
sandboxRequire.resolve = sandboxRequireResolve;

function Entity(obj,name,desc ) {
	var o = {
		Λ: null
		, within: obj
		, attached_to: new Map()//[]
		, contains: new Map()//[]
		, created_by: null
		, created: []
		, loaded: false
		, has_value: false
		, value: null
		, name: name
		, description: desc
		, command: null
		, permissions: { allow_file_system: true }
		, sandbox: null // operating sandbox
		, child : null // child process
		, vol: null
		, require (file) { 
			//doLog( "calling sandbox require...", file);
			return sandboxRequire(this,file)
		 }
		, thread : null
		, watchers : new Map()
		, scripts : { code: [], index : 0, push(c){ this.index++; this.code.push(c)} }
		, _module: {
			filename: "internal"
			, file: "memory://"
			, parent: null
			, paths: [module.path + "/.."]
			, exports: {}
			, loaded: false
			, rawData: ''
			, includes: []
		}
		, idGen() {
			var this_ = this;
			return new Promise( (res)=>{
				doLog( "o:", o.name, o.Λ)
				entity.idMan.ID(this.Λ, this.created_by.Λ, (id)=>{
					res(id);
				});
			})
		}
		, postRequire( src  ){
			//var o = objects.get( Λ );
			//doLog( "Requiring for something:", src )
			return  sandboxRequire( this, src );
		}
		, wake() {
			if( !this.thread ) {
				return wake.WakeEntity( this );
			}
			return Promise.resolve(this.thread);
		}
	}
	o.created_by = obj || o;
	o.created_by.created.push( o );

	Object.assign( this, o );

	//Object.assign(o, ee.prototype); ee.call(o);
	//return o;
}


var entityMethods = {
		get container() { /*doLog( "Getting container:",this); */return this.within; }
		, create(name, desc, cb, value) {
			//console.trace("Who calls create?  We need to return sandbox.entity?");
			if (typeof desc === 'function') {
				cb = desc; desc = null;
			}
			var this_ = this;
			makeEntity(this, name, desc, (newo) => {
				newo.value = value;
				if (typeof cb === 'string') {
					newo.sandbox.require(cb); // load and run script in entity sandbox

					if (value) value(newo);
				} else
					if (cb) cb(newo) // this is a callback that is in a vm already; but executes on this vm instead of the entities?
			});
			
		}
		, birth( ) {
			remotes.set( this, this );
			this.child = cp.fork( __dirname + "/childEntity.js", [this.Λ, config.run.defaults.defaultPort.toString()])
			this.child.on( 'message', (msg)=>{
				if( msg.op === "driver" ) {
					var driver = drivers.find( d=>d.name === msg.driver );
					runDriverMethod( this, driver, msg );
				}
			} )
			this.child.on( 'close', (code)=>{
				remotes.delete( this );
			});
		}
		, look() {
			var done = [];
			getObjects(this, null, true, (o,location) => {
				//doLog( "Got a object to look at?", o, o.entity.name );
				done.push({ name: o.entity.name, ref: o.me, o:o, loc:location });
			})
			//doLog( "result:", done );
			return done;
		}
		, getObjects(...args){ return getObjects(this, ...args) }
		, get contents() { var refs = new Map();  this.contains.forEach( c=>refs.set(c.Λ, c.Λ) );return refs; }
		, get near() {
			var result = [];
			for( let near of this.within.contains){
				if( near[1] !== this ){
					result.push( near[0] );
				}
			} 
			return result;
		}
		, get exits() {
			var result = [];
			var anchor = findContained( this );
			for( let near of anchor.parent.attached_to){
				result.push( near.Λ );
			} 
			return result;
		}
		, get room() {
			doLog( "Getting room of :", this.name);
			if( this.within )
				return this.within.Λ;
			return this.container;
		}
		, get container() {
			var anchor = findContained( this );
			var from = anchor;
			while( from = from.from ) {
				from.parent = from.parent.Λ;
				from.at = from.at.Λ;
			}
			anchor.parent = anchor.parent.Λ;
			anchor.at = anchor.at.Λ;
			return anchor;
		}
		, get nearObjects() {
			//doLog( "getting near objects", this.contains )
			var near = new Map();
			var c = new Map();
			this.attached_to.forEach( e=>c.set(e.Λ,e.Λ) );
			near.set("holding", c );
			c = new Map();
			this.contains.forEach( e=>c.set(e.Λ,e.Λ) );
			near.set("contains", c );
			near.set("near", (function (on) {
				var result = new Map();

				if (on.within) {
					on.within.contains.forEach((nearby) => {
						//doLog( "my room contains:", nearby );
						if (nearby !== on) {
							result.set(nearby.Λ, nearby.Λ );
						}
					});
					on.within.attached_to.forEach((nearby) => {
						//doLog( "my room attached to:", nearby );
						result.set(nearby.Λ, nearby.Λ );
					});
					return result;
				}
			})(this));
			//doLog( this.name, "near", near );
			return near;
		}
		, assign: (object) => {
			this.value = object;
			if (config.run.debug)
				sanityCheck(object);
		}
		, attach(a) {
			if( "string" === typeof a ) a = objects.get(a);
			if( a === this )
				throw new Error( "Why would you attach a thing to itself?" );
			
			if( a.attached_to.get( this.Λ ) ) {
				throw new Error( "objects are already attached." );
				return;
			}
			console.log( "Attaching %s to %s", this.name, a.name );
			if( a.within )
			   a.rebase();

			{
				a.attached_to.set(this.Λ, this);
				this.attached_to.set(a.Λ, a);

				if( this.thread )
					this.thread.emit('attached', a.Λ);

				if( a.thread )
					a.thread.emit('attached', this.Λ);
			}
		}
		, detach(a) {
			if( "string" === typeof a ) a = objects.get(a);
			if( a.attached_to.get( this.Λ) )
				if( this.attached_to.get( a.Λ) ) {
					// one or the other of these is within.
					// both have to be attached to the third.
					a.attached_to.delete(this.Λ);
					this.attached_to.delete(a.Λ);
					if( this.thread )
						this.thread.emit('detached', a.Λ);
					if( a.thread )
						a.thread.emit('detached', this.Λ);				

					return true;
				}
			throw "objects are not attached: " + this.name + " & " + a.name;
			return false;
		}
		, watch(a) {
			a = objects.get( a );
			a.thread && a.watchers.set(this.Λ, this);
		}
		, insert(a) {
			a.within = this;
			if( this.thread )
			this.thread.emit('stored', a.Λ );
			this.contains.forEach( peer=>{
				if( peer.thread )
				peer.thread.emit('joined', a.Λ );
			});
			this.contains.set( a.Λ, a );
			if( a.thread )
				a.thread.emit('placed', this.Λ );
		}
		, rebase() {
			// this removes an entity from space...
			// it is no longer within
			// it remains attached... so either
			// the
			const room = this.within;
			if( room ){
				room.contains.delete(this.Λ);
				// tell room it lost something
				if( room.thread )
					room.thread.emit( "lost", this.Λ );
				if( this.thread )
					this.thread.emit('displaced', room.Λ );
				// tell others in the room some parted the room.
				// headed to?
				room.contains.forEach( content=>{
					if( content.thread )
						content.thread.emit( "parted", this.Λ );
				})
				this.within = null;
			}else {
				throw new Error( "Entity is not the anchor in the chain, please drop a proper object" );
				// doesn't matter, it's detached enough from contants.
			}
		}
		, debase(a) {
			// debase changes which object in a set of objects is the one
			// that is within a container; all other attached objects are 
			// not immediately visible within.
			if (a.within) {
				if (a.attached_to.length) {
					a.attached_to.forEach((key, val) => {
						if (val.within) {
							a.within = null;
							throw "attempt to debase failed...";
						}
					})
					if (a.attached_to[0].within) {
						a.within = null;
						throw "attempt to debase failed...";
					}
					try {
						// just ned to get the first element...
						// so we throwup here (*puke*)
						a.attached_to.forEach((key, val) => {
							key.within = a.within;
							a.within.contains.set(key, val);
							a.within.contains.delete(a.Λ);
							throw 0;
						})
					} catch (err) { if (err) throw err; }
					a.within = null;
				}
				else {
					// already debased (that is, this isn't the thing within)
					return;
				}
			}
		}
		, leave(to) {
			to = objects.get( to );
			this.rebase(); // free from container
			outerRoom.insert( to ); // put in new container
		}
		, escape() {
			var outer = this.within || findContained(this).parent;
			var outerRoom = outer.within || findContained(outer).parent;
			this.rebase(); // free from container
			outerRoom.insert( this ); // put in new container
		}
		, enter( newRoom ){
			newRoom = objects.get( newRoom );
			this.rebase(); // free from container
			newRoom.insert( this );  // put in new container
		}
		, grab(a) {
			//doLog( "THing:", this, "A:", a );
			var grabobj = ( "string" === typeof a && objects.get( a ) ) || objects.get( a.entity.Λ );
			if( grabobj ) {
				if( !grabobj.within ) {
					throw new Error( "Entity cannot be grabbed, it is not the anchor point.", grabobj.Λ );
				}
				grabobj.rebase();
				this.attach( grabobj );
            }
		}
		, hold(a) {
			//doLog( "THing:", this, "A:", a );
			var grabobj = ( "string" === typeof a && objects.get( a ) ) || objects.get( a.entity.Λ );
			if( grabobj ) {
				this.attach( grabobj );
            }
		}
		, drop(a) {
			var outer = this.within || (outer = findContained(this).parent );
			var grabobj = ( "string" === typeof a && objects.get( a ) ) || objects.get( a.entity.Λ );

			if( this.detach( grabobj ) ) {
				doLog( "Detached, can insert", grabobj )
				if( !findContainer( grabobj, null )){
					//doLog( "Is not contained...");
					outer.insert( grabobj );
				}else {
					// this is okay too... just letting go of a rope, but
					// then it retracts to its source room immediately.
					// there is no 'parted' event generated
					// nor is it lost to the room... 
					//doLog( "Found that there was a ccontainer" );
				}
			}else {
				// this is really OK tooo... 
				// it is probably somehting resently assembled/attached in hand.
				console.log( "Object is still attached to you, somehow." );
			}
		}
		, store(a) {
			var grabobj = ( "string" === typeof a && objects.get( a ) ) || objects.get( a.entity.Λ );
			
			if( this.detach( grabobj ) )
				this.insert( grabobj );
		}
		, async run(file,command) {
			if( !command ) throw new Error( " PLEASE UPDATE USAGE");
			if( this.thread ) {
				return this.thread.run(file,command) ;
			} else 
				throw new Error( this.name+ ": Please wake() this object first.");
		}
		, addProtocol(p, cb) {
			entity.addProtocol(this.Λ + p, cb);
		}
		, delete() {
			for( var c in this.created ) c.delete();
			if( this.within )
				this.within.contains.delete( this.Λ );
			this.attached_to.foEach( a=>{
				a.attached_to.delete( this.Λ );
			})
			this.contains.forEach( c=>{
				this.within.store( c );
			} )
			this.contains = null;
			this.attached_to = null;
			this.within = null;
			objects.delete( this.Λ );
			entity.idMan.delete( this.Λ, config.run.Λ );
		}
		, toString() {
			var attached = null;
			this.attached_to.forEach((member) => { if (attached) attached += '","'; else attached = ' ["'; attached += member.Λ })
			if (attached) attached += '"]';
			else attached = '[]';

			var contained = null;
			this.contains.forEach((member) => { if (contained) contained += '","'; else contained = ' ["'; contained += member.Λ })
			if (contained) contained += '"]';
			else contained = '[]';
			return '{"Λ":"' + this.Λ
				+ '","value":' + (this.value && this.value.toString())
				+ ',"name":"' + (this.name)
				+ '","description":"' + (this.description)
				+ '","within":"' + (this.within && this.within.Λ)
				+ '","attached_to":' + attached
				+ ',"contains":' + contained
				+ ',"created_by":"' + this.created_by.Λ
				//+ ',"code":' + JSOX.stringify( this.sandbox.scripts.code )
				//+ ',"config":'+ JSOX.stringify( this.sandbox.config )
				+ '"}\n';
		}
		, toRep() {
			var attached = [];
			this.attached_to.forEach((member) =>attached.push( member.Λ ) )
			var rep = { Λ:this.Λ
				, name: (this.name)
				, description: (this.description)
				, within: (this.within && this.within.Λ)
				, attached_to: attached
				, created_by: this.created_by.Λ
				, scripts : ( this.sandbox && this.sandbox.scripts.code )
				, config : (this.sandbox && this.sandbox.config)
				, value : this.value
			};
			return rep;
		}
		/*
		, fromString: (string, callback) => {
			let tmp = JSON.parse(string);
			for (key in tmp) {
				if (!idMan.Auth(key)) {
					throw "Unauthorized object"
					return;
					tmp.Λ = key;
					delete tmp[key];
					break;
				}
				this.within = tmp.within || objects.get(tmp.within) || all_objects.get(tmp.within);
				this.created_by = tmp.created_by || objects[tmp.created_by];
				tmp.attached_to.forEach((key) => { this.attached_to.push(objects[key]) })
				Object.assign(this, tmp);
			}
		}
		*/
	}

	Object.getOwnPropertyNames(entityMethods).forEach(function (prop) {
		var descriptor = Object.getOwnPropertyDescriptor(entityMethods, prop);
		Object.defineProperty(Entity.prototype, prop, descriptor);
	});
	

Entity.fromString = function(s) {
	s = JSOX.parse(s);
	if( s.parent === s.Λ )
		s.parent = null;
	var entity = createEntity( s.parent, s.name, s.description )

	o.Λ = s.Λ;
		console.warn( "create sandbox here, after getting ID")
		//o.sandbox = vm.createContext(makeSystemSandbox(o, true));
		//o.Λ = makeEntityInterface(o);
		//sealSandbox(o.sandbox);

		if (o.within)
			o.within.contains.set(o.Λ, o);
		else
			o.within = o;

		objects.set(o.Λ, o);

		sealEntity(o);

		if (!o.within) {
			//o.attached_to.set(o.Λ, o);
		}else {
			if( o.within.thread ) {
				o.within.thread.emit("created", o);
				o.within.thread.emit("inserted", o);
			}
		}
		//o.within.contains.forEach(near => (near !== o) ? near.thread.emit("joined", o) : 0);

		if (!callback)
			throw ("How are you going to get your object?");
		else {
			doLog(" ---------- Result with completed, related object ------------------ ");
		}
}

exports.reloadAll = function( onLoadCb, initCb ) {
	// if reload failed, run initCb; else run code already in the thing...
	//return initCb();

	var file = fc.reload( "core/entities.json", (err, file)=>{
		if( !file ) return initCb();
		try {
			file = fc.Utf8ArrayToStr(file);
			//doLog( "got:", err, file );
			var input = JSOX.parse( file );
		}catch(err) {
			doLog( "input json is corrupt; defaulting to first run.\n", err)
			return initCb();
		}
		nextID = input[0].Λ;
		makeEntity( null, input[0].name, input[0].description, (o)=>{
			var defer = [];
			doLog( "recovered core entity...", input[0].name );
			o.value = input[0][o.Λ];
			if( o.sandbox ) {
				doLog( "restore scripts to ....", o.sandbox.scripts );
				o.sandbox.config = input[0].config;
				o.sandbox.scripts.code = input[0].scripts;
				doLog( "closure source?", o.sandbox.scripts.code);
				for( var c in o.sandbox.scripts.code ) { c.closure = JSOX.parse( c.closure ) }
			}
			var executable = [];

			doList( input, 1 );

			function doList( list, start ) {
				//doLog( "do list of things...", list, n, list.length );
				for( var n = start; n < list.length; n++ ) {
					var ths = list[n];
					var creator = makeEntity(ths.created_by);
					if( !creator ) {
						//doLog( "Defered this creaation..." );
						defer.push( ths );
						continue;
					}

					var parent = ths.within && makeEntity(ths.within);

					//doLog( "Creator:", creator );
					nextID = ths.Λ;
					creator.create( ths.name, ths.description, (o)=>{
						//doLog( "creator created..." );
						o.value = input[o.Λ];
						ths.entity = o;

						if( parent ) {
							if( parent != creator ) {
								parent.store( o );
							}
						} else {
							// detach from everything for a second...
							// (probably attached_to will re-join this to the mesh)
							o.within.contains.delete( o.Λ );
							o.within = null; // temporarily floating
						}

						if( o.sandbox ) {
							doLog( "restoring scripts")
							o.sandbox.config = ths.config;
							if( ths.scripts.length )
								executable.push( o );
							o.sandbox.scripts.code = ths.scripts;
							//doLog( "Storing scripts?", ths.scripts )
						}
						//doLog( "Created :", ths );
					})
				}
				for( var n = start; n < list.length; n++ ) {
					ths.attached_to.find( (a)=>{
						var ae = makeEntity(a);
						if( !ae ) return true;
						// attach method will fail, because one and or the other has no parent.
						ae.attached_to.set( ths.entity.Λ, ths.entity );
						ths.entity.attached_to.set( ae.Λ, ae );
					} );
				}
			}

			//doLog( "Is this really serial at this time?", defer );
			while( defer.length ) {
				var doit = defer;
				defer = [];
				doList( doit, 0 );
			}

			onLoadCb();
			//doLog( "first run ran --------- start other things loaded...", executable )
			for( var e of executable ) {
				// it may have already started...
				if( !e.scripts.index ) {
					doLog( "")
					e.require( e.scripts.code[0].source )
					// after require, things might be run on it...
				}
				/*
				if( e.sandbox.scripts.index < e.sandbox.scripts.code.length ) {
					var cache = e.sandbox.scripts.code[e.sandbox.scripts.index];
					doLog( "is this cache a run?", e.sandbox.scripts, cache );
					if( cache )
						if( cache.type==="run")
							e.run( cache.code );
					else doLog( "index less than end?", cache)
				}
				*/
			}
			//exports.saveAll();
		})
	})
}

exports.saveAll = function() {
	if( createdVoid ) {
		var saved = new Map();
		var output = [];
		var o = makeEntity( createdVoid.Λ );
		recurseSave( o );
		//for( var n = 0; n < output.length; n++ )
		//		output[n] = output[n].toString();
		//doLog( "output", output );
		fc.store( "core/entities.json", JSOX.stringify( output, null, 2 ) )
		function recurseSave( o ) {
			if( saved.get(o.Λ) ) return; // already saved.
			output.push( o.toRep() );
			o.attached_to.forEach( a=>recurseSave( a  ) );
			//doLog( "Saving:", o.toString() )
			o.contains.forEach( a=>recurseSave( a ) );
			saved.set( o.Λ, o );
		}
	}

}

	function getObjects(me, src, all, callback) {
		// src is a text object
		// this searches for objects around 'me' 
		// given the search criteria.  'all' 
		// includes everything regardless of text.
		// callback is invoked with value,key for each
		// near object.
		var object = src && src[0];
		if( !src ) all = true;
        var name = object && object.text;
		var count = 0;
		//var all = false;
		var run = true;
		var tmp;
		var in_state = false;
		var on_state = false;

		//console.trace( "args", me, "src",src, "all",all, "callback:",callback )
		if (typeof all === 'function') {
			callback = all;
			all = false;
		}

		if (object && name == 'all' && object.next && object.next.text == '.') {
			all = true;
			object = object.next.next;
		}
		if (object && (tmp = Number(name)) && object.next && object.next.text == '.') {
			object = object.next.next;
            name = object.text;
			count = tmp;
		}

		if( src&& src.length > 1  && src[1].text === "in" ) {
			console.warn( "checking 'in'");
			in_state = true;
			src = src.slice(2);
			getObjects( me, src, all, (o,location,moreargs)=>{
				o = objects.get( o.me );
				doLog( "THIS FUNCTION IS MROEVED TO LOCAL THREADSin Found:", o.name, name );
				o.contents.forEach( content=>{
					//if (value === me) return;
					if (!object || content.name === name ) {
						doLog( "found object", content.name )
						if (count) {
							count--;
							return;
						}
						if (run) {
							doLog("and so key is ", location, content.name )
							callback(content.sandbox, location+",contains", src.splice(1) );
							run = all;
						}
					}
				})
			})
			return;
		}
		if( src&&src.length > 1  && (src[1].text == "on" || src[1].text == "from" || src[1].text == "of" ) ) {
			on_state = true;
			doLog( "recursing to get on's...")
			src = src.slice(2);
			getObjects( me, object, all, (o,location,moreargs)=>{
				o = objects.get( o.me );
				doLog( "Found:", o.name, location );
				o.attached_to.forEach( content=>{
					//if (value === me) return;
					if (!object || content.name === name ) {
						doLog( "found object", content.name )
						if (count) {
							count--;
							return;
						}
						if (run) {
							doLog("and so key is ", key, content.name )
							callback(content.sandbox, location+",holding", src.splice(1) );
							run = all;
						}
					}
				})
			})
			return;
		}

		//var command = src.break();
		//doLog( "get objects for ", me.name, me.nearObjects )
			var checkList;

			if( !("forEach" in me) )
				checkList = me.nearObjects;
			else
				checkList = me;

			checkList.forEach(function (value, location) {
				// holding, contains, near
				//doLog("checking key:", run, location, value)
				if( !value ) return;
				if (run) value.forEach(function (value, member) {

					//doLog( "value in value:", value.name, name );
					if (value === me) return;
					if (!object || value.name === name ) {
						//doLog( "found object", value.name )
						if (count) {
							count--;
							return;
						}
						if (run) {
							//doLog("and so key is ", key, value.name )
							callback(value.sandbox, location, src &&src.splice(1) );
							run = all;
						}
					}
				});
			})
	}


function findContained(obj, checked) {
	try {
	if (obj.within) return { parent: obj.within, at: obj, from:null };
	if (!checked)
		checked = {[obj.Λ]:true};
	var result;
	var attached = obj.attached_to[Symbol.iterator]()
	for( let content of attached ) {
		content = content[1];
		if (checked[content.Λ]) continue;
		doLog(  "check for within:", content.name);
		if (content.within) return { parent:content.within, at:content, from:null };
		var result = findContained(content, checked);
		checked[content.Λ] = true;
		if (result) return { parent:result.parent, at:content, from:result };
	}
	
} catch(err) {
	doLog( "Failed:", err);
}
	throw new Error("Detached Entity");
}

function findContainer(obj, checked) {
	if (obj.within) return obj.within;
	if (!checked)
		checked = [];
	var attached = obj.attached_to[Symbol.iterator]()
	for (let content of attached) {
		content = content[1];
		if (checked[content.Λ]) continue;
		checked[content.Λ] = true;
		if (content.within) return content.within;
		var result = findContainer(content, checked);
		if (result) return result;
	}
	return null;//throw new Error("Detached Entity");
}

function isContainer(obj, checked, c) {
	// this returns whether 'obj' is in 'c'.
	// Returns true is obj is attached to another
	// object which is within c.

	if (obj.within) return (obj.within.Λ === c.Λ);
	if (!checked)
		checked = {};
	else
		if( "result" in checked )
			return true;
	return recurseAttachments(obj, checked, c);

	function recurseAttachments(obj, checked, c) {
		var attached = obj.attached_to[Symbol.iterator]()
		for (let content in attached) {
			content = content[1];
			if (checked[content.Λ]) continue;
			checked[content.Λ] = true;
			if (content.within && content.within.Λ == c.Λ) {
				checked.result = content;
				return true;
			} 
			return recurseAttachments(content, checked, c);
		} 
		return false;
	}
}

function isAttached(obj, checked, c) {
	// returns true if this object is attached to some other object.
	doLog( "CHecked:", checked );
	if (!checked)
		checked = {};
	else
		for (let att of checked) {
			if( att === c )
				return true;
		}
	return recurseAttachments(obj, checked, c);

	function recurseAttachments(obj, checked, c) {
		for (let content of obj.attached_to) {
			if (checked[content.Λ]) continue;
			checked[content.Λ] = true;
			if (content.Λ === c.Λ) return true;
			return recurseAttachments(content, checked, c);
		} 
		return false;
	}
}


function getAttachments(obj, checked) {
	if (obj.within) return obj.within;
	for (content in obj.attached_to) {
		if (checked[content.Λ])
			break;
		checked[content.Λ] = content;
		getAttachments(content, checked);
	}
	return checked;
	throw "Detached Object";
}

function exported_getObjects(o, filter, all, callback) {
	//doLog( "getting objects from:", o.name );
	if (typeof all === 'function') {
		callback = all;
		all = null;
	}
	if( "string" === typeof o )
		o = objects.get(o);
	//doLog( "uhmm did we erase o?", o )
	if (o)
		o.getObjects(filter, all, callback)
}

function getEntity(ref) {
	var o = objects.get(ref);
	if (o) return o;
	return null;

}

function sanityCheck(object) {
	var s = JSOX.stringify(object);
	var t = object.toString();
	doLog(`json is ${s}`);
	doLog(`toString is ${t}`)
	var os = JSOX.parse(s);
	if (os !== object) {
		doLog(`did not compare for json conversion.  ${os}  ${object}`);
		doLog(os);
		doLog(object);
	}
}


function saveConfig(o, callback) {
	//if( !fs.exists( 'core') )
	if (!("vol" in o))
		o.vol = vfs.Volume(null, config.run.defaults.dataRoot + "/" + o.Λ);
	if( o.sandbox )		
		o.vol.write(JSOX.stringify(o.sandbox.config));
}

//res.sendfile(localPath);
//res.redirect(externalURL);
//
function loadConfig(o) {
	if( !o.sandbox ) return;
	if (!("vol" in o))
		o.vol = vfs.Volume(null, config.run.defaults.dataRoot + "/" + o.Λ);
	{
		var data = o.vol.read("config.json");
		if (data) {
			//doLog( "attempt to re-set exports...", result);
			var object = JSOX.parse(data.toString());
			Object.assign(o.sandbox.config, object);
			//doLog( "config reload is", config.run.Λ )
			//config.run = object;
			resume();
		}
		else {
			doLog("initializing config.")
			o.sandbox.config.defaults = require("./config.json");
			saveConfig(o, resume);
		}
	}
}

