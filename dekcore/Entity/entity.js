"use strict";
const _debug_require = false;
const _debugPaths = _debug_require || false;
const _debug_threads = false;
const _debug_run = false;

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

//JSOX.registerToJSOX( "entity", Entity,

function EntityToJSOX (){
	const r = this.toString();
	return r
}

//JSOX.fromJSOX( "entity", Entity, function(field,val){
function EntityFromJSOX(field,val ) {
	//console.log( "Revive entity info:", field, val )
	if( !field ) {
		if( this.Λ instanceof Promise ) {
			const this_ = this;
			console.log( "Still waiting for our identity to revive?")
			this.Λ.then( Λ=>{
				setObj( Λ.Λ, this_ );
			} )
		} else 
			setObj( this.Λ.toString(), this );

		function setObj( id,o ) {
			objects.set( id,o );
			// fixup contains and attach maps... but...
			const newContains = new Map();
			o.contains.forEach(content=>{
				//console.log( "Copying content...", content );
				if( content instanceof Promise ) {
					//console.log( "Attaching to promised item");
					content.then( c=>{
							//console.log( "promised item is now resolved" );
							newContains.set( c.Λ, c )
						} )
				}
				else
					newContains.set( content.Λ, content );
				
			})			
			o.contains = newContains;

			const newAttaches = new Map();
			o.attached_to.forEach(content=>{
				//console.log( "Copying attachment...", content );
				if( content instanceof Promise ) {
					//console.log( "Attaching to promised item");
					content.then( c=>{
						//console.log( "promised item is now resolved" );
						newAttaches.set( c.Λ, c )
						} )
				}
				else
					newAttaches.set( content.Λ, content );
			})			
			o.attached_to = newAttaches;
		}
		

		return this;
	}
	if( field === "created_by") {
		//console.log( "This is just bad... no cread?", this, field, val );
		if( !val )  console.log ( "LOST VAL", val, field );
		this.created.length = 0; // on revival, this will have been wrong (all objects get created like TheVoid)
		const this_ = this;
		if( val instanceof Promise ) 
			val.then( (val)=>val.created.push(this_));
		else
			val.created.push(this);
		//if( pval && pval.created )
		//	pval.created.push(this);
	}
	/*
	if( field === "contains" || field === "attached_to") {
		const this_ = this;
		val.forEach( content=>this_.contains.set(content.Λ,content));
		return this.contains;
	}
	*/
	return this[field] = val;
}


function EntityRefFromJSOX( field,val ) {
	if( field !== undefined ) {
		return this[field] = val;
	}
	console.log( "in this context what params?", field, val );
}

/*
JSOX.defineClass( "entity", { Λ:null
	, name: null
	, description: null
	, within: null
	, attached_to: null
	, created_by: null
	, sandbox : null
	, _module : null
	, value : null
} )
*/
// this is used to generate an http request to the real core(if there is one?)
const netRequire = require('../util/myRequire.js');


var fc = require('../file_cluster.js');

const config = require('../config.js');

config.start( ()=>{
	fc.addEncoders( [{tag:"~E",p:Entity,f:EntityToJSOX }] );
	fc.addDecoders( [{tag:"~E",p:Entity,f:EntityFromJSOX }] );
	fc.addDecoders( [{tag:"Er",p:null,f:EntityRefFromJSOX }] );
	
})
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
var objects = new Map();
var remotes = new WeakMap();
var childPendingMessages = new Map();
const requireCache = new Map();

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

//config.start( ()=>eval( volOverride )( vfs, config.run.defaults.dataRoot ) )



//var all_entities = new WeakMap();

var drivers = [];

var nextID = null;

//Λ

//const sentience = require( "../Sentience/shell.js");

var createdVoid = false;
var theVoid = null; // private tracker, to validate someone didn't cheat the export
var base_require;


function sealEntity(o) {
	//doLog( "before sealing:", JSOX.stringify(o ) );
	[ //"container", 
		//"contents", 
		"attached_to", "created", "created_by", "owner", "save_"
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
			Object.defineProperty(o, key, { enumerable: false, writable: true, configurable: false });
		});
	["V","Λ", "JSOX", "sandbox"].forEach(key => {
		Object.defineProperty(o, key, { enumerable: false, writable: true, configurable: false });
	})
	Object.defineProperty(o, "io", { enumerable: false, writable: true, configurable: true });
}


function makeEntity(obj, name, description, callback, opts) {
	if (this instanceof makeEntity) throw new Error("Please do not call with new");
	if (!name && !description) {
		//var all = all_entities.get(obj);
		//console.trace( "Lookup:", objects, obj );
		var named = objects.get(obj.toString());
		//doLog( "Got",  named, obj )
		obj = named || obj;
		return named;
	}
	//console.trace( "Shouldn't be making entities until config.js finishes" );
	if (typeof (obj) === "string") {
		obj = objects.get(obj);
	}
	
	if (obj && !obj.Λ) {
		console.log( "Clearing obj...");
		base_require = require;
		obj = null;
	}
	if ((!obj || !(objects.get(obj.Λ.toString()))) && createdVoid) {
		//doLog("All Entities", all_entities);
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
		if( !entity.idMan ) { 
			console.log( "Entity required an id manager (idMan=", entity.idMan );
			config.start(() => { makeEntity(obj, name, description, callback, opts) })
			return 
		}
		if( exports.theVoid ) {
			if( theVoid ) 
				throw new Error( "User corrupted entity interface" );
			throw new Error( "The Void already exists; intitialzation sequence error" );
		}
		
		createdVoid = entity;
	}
	//console.log( "calling a new Entity:", name, description );
	const o = new Entity( obj, name, description );
	if( !exports.theVoid ) {
		if( theVoid )
			throw new Error( "User corrupted entity interface" );
		theVoid = exports.theVoid = o;
	}
	if( !o.Λ ){
		//console.log( "Setting the root of all objects.", config.run.Λ, theVoid === o, theVoid );
		if( theVoid === o ) 
		{
			o.Λ = config.run.Λ;
		}

		if( nextID ) {
				throw new Error( "NextID should NOT be being used?");
				o.Λ = nextID;
				nextID = null;
				finishCreate();
			}
			else {
				if( theVoid !== o ) {
					//console.log( "create new ID?")
					entity.idMan.ID(obj || createdVoid, config.run, (key) => {
						o.Λ = key.Λ;
						//doLog( "object now has an ID", o.name, o.Λ, key.Λ );
						finishCreate();
					} );
				} else {
					//console.log( "Manufacturing new locally authorized key");
					entity.idMan.localAuthKey.then(lkey=>entity.idMan.ID(config.run, lkey,  (key) => {
						//console.log( "the void's id needs to be forged into a key", key );
						o.Λ = key.Λ;
						//doLog( "object now has an ID", o.name, o.Λ, key.Λ );
						finishCreate();
					}) );
				}
			}
	} else
		finishCreate();

	function finishCreate( ) {
		//doLog( " ----- FINISH CREATE ---------" );
		if( opts && opts.fork ) {
			o.child = cpts.fork( "childEntity.js", [o.Λ] )
			o.child.on( "message", (msg)=>{
				if( msg.op === "present" ) {
					o.child.send( { op:"first message test"});
				}
			})
		} 
		//console.log( "Finish create and set in container:", o.Λ );
		if (o.within) o.within.contains.set(o.Λ.toString(), o.Λ.toString() );
		else {
			o.within = o;
            //console.log( "Set object:", o.Λ, o);
			//objects.set(createdVoid.Λ.toString(), o);
		}
		o.within.contains.forEach(near => {
			const nearo = objects.get(near);
			nearo&&	nearo.thread&&nearo.thread.emit("created", o.Λ.toString()) 
		});
		let oldId = o.Λ.toString();
		objects.set(oldId, o);
		
		o.Λ.on(()=>{
			const newId = o.Λ.toString();
			objects.delete(oldId);
			objects.set(newId, o);

			o.within.contains.delete( oldId );
			o.within.contains.set( newId, o );
			for( let a of o.attached_to ) {
				a.attached_to.delete( oldId );
				a.attached_to.set( newId, o );
			}
			if( o.thread )
				o.thread.emit( "rekey", o.Λ );
			o.saved = o.saved; // save it if it is saved.
		})
		//o.attached_to.set(o.Λ.toString(), o);

		sealEntity(o);
		if( o.within ) {
			if( o.within.thread ) {
				o.within.thread.emit("created", o.Λ);
				o.within.thread.emit("stored", o.Λ);
			}
		}
		o.within.contains.forEach(near => (near !== o.Λ) ?
			( near.thread )&&
				near.thread.emit("joined", o.Λ) 
			: 0 
		);

		if (!callback)
			throw ("How are you going to get your object?");
		else {
			//doLog(" ---------- Result with completed, related object ------------------ ");
			if( typeof( callback ) === "string" )  {
				o.wake().then( (thread)=>{
					
					thread.runFile( callback );
				} );
				opts(o);
			}
			else
				callback(o);
		}

	}

}

	function runModule( o, thisModule ) {
		( _debug_threads || _debug_run ) &&  doLog( o.name, "POSTED CODE TO RUN TO THE OTHER THREAD... AND WE WAIT (pushed to stack)", thisModule.src );
		o._module = thisModule;
		return o.thread.run( {src:thisModule.src,path:thisModule.paths[0]}, thisModule.code ).then( (v)=>{
			// when this happens, I don't care about the result... 
			// I shouldn't have to pop 'module' because it's all async.
			// and I don't know if this is running, or another thing is running...

			_debug_run && console.log( "Run resulted... this is in the core; this should translate the result RuNID... (and pop stack)", v);
			o._module = thisModule.parent;
			return v;
		}).catch( e=>{
			o._module = thisModule.parent;
			//doLog( "Catch error of course?", e );
		} );
	}


	function sandboxRequire(o,src,parentPath) {

		if( !o || !src )
			console.trace( "FIX THIS CALLER this is", o, src );

		//var o = this ; //makeEntity( this.me );
		_debug_require && console.trace("sandboxRequire ",  src, parentPath );

		// resolves path according to relative path of parent modules and resolves ".." and "." parts
		//_debugPaths && doLog( o.name, JSOX.stringify( o._module,null, "\t"   ));

		const thisModule_ = 
				requireCache.get( parentPath );
		_debug_require && console.log( "This Module is current:", src, thisModule?thisModule_.filename :"-" );
		if( thisModule_ ){
			var include = thisModule_.includes.find( i=>{
					if( i.src === src ) return true;
					//if( i.filename === ( thisModule_.paths[0] +'/'+ src ) ) return true;
					return false;
			}
		 );
			if( include ) {
				include.parent = thisModule_;  // not sure why this isn't reviving.
				//console.log( "SEtting cache:", include );
				requireCache.set( include.filename, include );
				return runModule( o, include );
			}
		}
		parentPath = parentPath && thisModule_ && thisModule_.paths[0];
		_debugPaths && console.log( "ParentPath:", parentPath )

		var root = (parentPath?parentPath+'/':'')+src;//netRequire.resolvePath(src, o._module);
		_debugPaths && console.log( "ParentPath root...:", root )

		try {
			var file = vol.read( root ).toString();
			//console.log( "FILE TO LOAD:", root,'=',file );
			//fs.readFileSync(root, { encoding: 'utf8' });
		} catch (err) {
			doLog("File failed... is it a HTTP request?", err);
			return undefined;
		}
			
		const strippedFile = netRequire.stripPath(root);
		const strippedRoot = netRequire.stripFile(root);

		_debugPaths && doLog("root could be", root, strippedFile, strippedRoot );

		var reloaded = o._module.includes.find( (module)=>{
			if( module.src === src || module.file === strippedFile )
				return true;
			return false;
				
		} );
		if( reloaded ) {
			console.log( "Entity already had the code for this module... running immediate" );
			return runModule( o, reloaded );
		}

		if( o.scripts.index < o.scripts.code.length ) {
			// using an existing script?
			var cache = o.scripts.code[o.scripts.index];
			//doLog( "cache is?", typeof cache, cache);
			if( cache.source === src ) {
				o.scripts.index++;
				console.log( "Require is currently in context:", o._module.src )
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
				//        { name : src.substr( pathSplit+1 ), parent : o.module, paths:[], exports:{} };
				//oldModule.children.push( thisModule );
				doLog( "THIS IS ANOHER RUN THAT SETS o_MODULE");
				
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
				doLog( "Run this script..." );
				return runModule( o, thisModule );
			}
		}


		const filePath = netRequire.stripFile(root);
		//doLog( "This will be an async function...posted to run..." );
		var code =
			['(async function() { var module={ path:'+ JSON.stringify(filePath) +',src:'+ JSON.stringify(src) 
				+',parent:'+ JSON.stringify(root)  +',exports:{}, require(what){return sandbox.global.require(what,module.parent); }}; module.require.resolve=function(what){return sandbox.fillSandbox.require.resolve(what)};'
				, 'await (async function(global,exports,module,resume,require){'
				, file
				, '}).call(this,this,module.exports,module,false,module.require );'
				//, 'console.log( "Returning exports(not undefined:)", module.exports );'
				, 'return module.exports;})().catch(err=>{doLog( "caught require error:", err)})\n//# sourceURL='
				, root
			].join("");

		var oldModule = o._module;
		var thisModule = {
			filename: root
			, src : src
			, code : code
			, source : "/*DebugHiddenSource"//file
			, file: strippedFile
			, parent: o._module
			, paths: [strippedRoot]
			, exports: {}
			, includes : []
			, loaded: false
			, toJSON() {
				doLog( "Saving this...", this );
				return JSOX.stringify( { filename:this.filename, file:this.file, paths:this.paths, src:this.src, source:this.source })
			}
			, toString() {
				return JSOX.stringify( {filename:this.filename, src:this.src })
			}
		}
		oldModule.includes.push( thisModule );

		requireCache.set( thisModule.filename, thisModule );
		return runModule( o, thisModule );

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
		, V: null
		, within: obj
		, attached_to: new Map()//[]
		, contains: new Map()//[]
		, created_by: null
		, created: []
		, owner : null 
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
		, thread : null
		, save_ : false // saved.
		, watchers : new Map()
		, scripts : { code: [], index : 0, push(c){ this.index++; this.code.push(c)} }
		, sandbox : {} // enabled methods.
		, _module: {
			filename: "internal"
			, src: null
			, source : "this"
			, file: "memory://"
			, parent: null
			, paths: [module.path + "/.."]
			, exports: {}
			, loaded: true
			, rawData: ''
			, includes: []
		}
	}
	o.created_by = obj || this;
	//console.log( "o.created_by:", o.created_by, obj, this )

	Object.assign( this, o );
	this.created_by.created.push( this );

	if( !exports.theVoid ) theVoid = exports.theVoid = this;
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
			console.log( "REmotes must be a very strange lookup...");
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
		, get contents() { 
			var refs = [];  t
			his.contains.forEach( c=>refs.push(c.Λ.toString() ) );
			console.log( "Returning refs:", refs );
			return refs; }
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
			if( this.within ) return {parent:this.within.Λ,at:this.Λ,from:null};
			return this.container;
		}
		, get container() {
			var anchor = findContained( this );
			var from = anchor;
			while( from = from.from ) {
				from.parent = from.parent.Λ.toString();
				from.at = from.at.Λ.toString();
			}
			anchor.parent = anchor.parent.Λ.toString();
			anchor.at = anchor.at.Λ.toString();
			return anchor;
		}
		, get nearObjects() {
			var near = new Map();
			var c = new Map();
			this.attached_to.forEach( e=>c.set(e.Λ.toString(),e.Λ.toString()) );
			near.set("holding", c );
			c = new Map();
			this.contains.forEach( e=>{
				if( "object" === typeof e )
					c.set(e.Λ.toString(),e.Λ.toString())
				else
					c.set(e,e)
			 } );
			 near.set("contains", c );
			near.set("near", (function (on) {
				var result = new Map();

				if (on.within) {
					on.within.contains.forEach((nearby,nearE) => {
						//doLog( "my room contains:", nearby, nearE );
						if (nearby !== on) {
							//let realNear = objects.get( nearby );
							result.set(nearE.toString(),nearE.toString() );
						}
					});
					on.within.attached_to.forEach((nearby,nearE) => {
						//doLog( "my room attached to:", nearby, nearE );
						result.set(nearE.toString(), nearE.toString() );
					});
					return result;
				}
			})(this));
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
			if( a.within ) a.rebase();

			{
				a.attached_to.set(this.Λ.toString(), this);
				this.attached_to.set(a.Λ.toString(), a);

				if( this.thread )
					this.thread.emit('attached', a.Λ);
				if( a.thread )
					a.thread.emit('attached', this.Λ);
			}
		}
		, detach(a) {
			if( "string" === typeof a ) a = objects.get(a);
			const aΛ = a.Λ.toString();
			const tΛ = this.Λ.toString();
			if( a.attached_to.get( tΛ ) )
				if( this.attached_to.get( aΛ )) {
					// one or the other of these is within.
					// both have to be attached to the third.
					a.attached_to.delete(tΛ);
					this.attached_to.delete(aΛ);
					if( this.thread )
						this.thread.emit('detached', aΛ);
					if( a.thread )
						a.thread.emit('detached', tΛ);				
					console.log( "Success detaching..." );
					return true;
				}
			throw "objects are not attached: " + this.name + " & " + a.name;
			return false;
		}
		, watch(a) {
			a = objects.get( a );
			console.log( this.name, " is watching:", a.name );
			if( a ) {
				//console.log( "A has a sandbox?", a.sandbox );
				for( let method in a.sandbox ) {
					//console.log( "Method to watch?", method );
					this.emit( "enable", [a.Λ, a.sandbox[method]] );
				}
				a.thread && a.watchers.set(this.Λ.toString(), this);
			}else {
				console.log( "getting A for watch failed?", a)
			}
		}
		, ignore(a) {
			a = objects.get( a );
			a && a.watchers && a.watchers.delete(this.Λ);
		}
		, insert(a) {
			a.within = this;
			if( this.thread )
				this.thread.emit('stored', a.Λ );
			this.contains.forEach( peer=>{peer = objects.get( peer );
				if( peer.thread )
					peer.thread.emit('joined', a.Λ );
			});
			this.contains.set( a.Λ.toString(), a.Λ.toString() );
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
				room.contains.forEach( (id)=>{
					const content = objects.get( id );
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
		, enable( method, args, code ) {
			var ability = { method:method, args:args, code:code };
			const this_ = this;
			this.sandbox[method] = ability;
			this.watchers.forEach( watcher=>{
				// tell everyone watching this that there's a method...
				watcher.emit( "enable", [this_.Λ, ability] );
			} );
			// tell this thread about its own method...
			if( this.thread ) this.thread.emit( "enable", [this.Λ.toString(), ability] );
		}
		, disable( method ) {
			
		}
		, leave(to) {
			if( !to ) to = this.within;
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
			doLog( "THing:", this, "A:", a );
			var grabobj = ( "string" === typeof a && objects.get( a ) ) || objects.get( a.entity.Λ.toString() );
			if( grabobj ) {
				if( !grabobj.within ) {
					throw new Error( "Entity cannot be grabbed, it is not the anchor point.", grabobj.Λ.toString() );
				}
				grabobj.rebase(); // moves object to use me as a base...
				this.attach( grabobj );
			}
		}
		, hold(a) {
			//doLog( "THing:", this, "A:", a );
			var grabobj = ( "string" === typeof a && objects.get( a ) ) || objects.get( a.entity.Λ.toString() );
			if( grabobj ) {
				this.attach( grabobj );
			}
		}
		, drop(a) {
			var outer = this.within || (outer = findContained(this).parent );
			var grabobj = ( "string" === typeof a && objects.get( a ) ) || objects.get( a.entity.Λ.toString() );
			//doLog( "Core:Drop Command", grabobj, this.detach );
			if( this.detach( grabobj ) ) {
				//doLog( "Detached, can insert", grabobj )
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
		, owns(a) {
			return isOwned( this, a );
		}
		, store(a) {
			const grabobj = ( ( "string" === typeof a ) && objects.get( a ) ) || a;
			if( this.owns( grabobj ) ) {
				if( this.detach( grabobj ) ) {
					this.insert( grabobj );
				}
			}else 
				throw new Error( "Not allowed to store items you don't own.");
		}
		, run(file,command) {
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
			a.watchers.forEach( e=>e.emit( "delete", a.Λ ) );
			this.contains = null;
			this.attached_to = null;
			this.within = null;
			objects.delete( this.Λ );
			entity.idMan.delete( this.Λ, config.run.Λ );
		}
		, require (file) { 
			if( "object" === typeof file ){
				_debug_require && doLog( "calling sandbox require...", file);
				if( "runId" in file && this.thread ){
					const run = this.thread.pendingRuns.find( run=>run.id===file.runId );
					if( run ) this._module = run.module;
				}
		
				return sandboxRequire(this,file.src, file.from);
			} else
				return sandboxRequire(this,file );
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
		, idGen() {
			var this_ = this;
			return new Promise( (res)=>{
				doLog( "o:", o.name, o.Λ)
				entity.idMan.ID(this_.Λ, this_.created_by.Λ, (id)=>{
					res(id);
				});
			})
		}
		, toString() {
			var attached = null;
			var strngfr = sack.JSOX.stringifierActive;
			if( this.attached_to ) {
				this.attached_to.forEach((member) => { 
					let newVal;
					if( "string" === typeof member ) member = objects.get(member);
					if( strngfr ) {
						let status = member.V;
						if(status)
							newVal =  '~or"'+status+'"';
						else {
							newVal = strngfr.encodeObject( member );
							if( newVal === member ) {
								if( member === this )
									newVal = strngfr.stringify( member )
								else
									newVal =  null;
							}
						}
					} else
						newVal = '"'+member.Λ.toString()+'"';
					if( newVal ) {
						if (attached) attached += ','; 
						else attached = ' ['; 
						attached += newVal
					}
				 })
				if (attached) attached += ']';
				else attached = '[]';
			} else attached = "don't stringify me";

			var contained = null;
			if( this.contains ){
				//this.contains.forEach((member) => { if (contained) contained += ','; else contained = ' ['; contained += strngfr?strngfr.stringify( member ):'"'+member.Λ.toString()+'"' })
				this.contains.forEach((member) => { 
					let newVal;// = strngfr?((member.saved||member===this)?strngfr.stringify( member ):''): ('"'+member.Λ.toString()+'"' );
					if( "string" === typeof member ) member = objects.get(member);
					if( strngfr ) {
						//console.trace( "Has stringifier this pass", this.saving, member.saving );
						let status = member.V;
						if(status && member !== this )
							newVal =  '~or"'+status+'"';
						else {
							newVal = strngfr.encodeObject( member );
							if( newVal === member ) {
								if( member === this ) // encode object reference.
									newVal = strngfr.stringify( member )
								else
									newVal =  null;
							}
						}
					} else {
						console.log( "No stringifier this pass");
						newVal = '"'+member.Λ.toString()+'"';
					}
					if( newVal ) {
						if (contained) contained += ','; 
						else contained = ' ['; 
						contained += newVal
					}
				 })
				if (contained) contained += ']';
				else contained = '[]';
				//sack.log( util.format( "Saving:", this)) ;
			}

			var wthn = null;
			if( strngfr ){
				const tmp = strngfr.encodeObject(this.within);
				if( tmp !== this.within )
					wthn = tmp;
				else
					wthn = strngfr.stringify( this.within );
			}
			if( !wthn  ) {
				wthn = this.within.V?('~or"'+this.within.V+'"'):('Er[i"'+this.within.Λ+'"]');
			}
			var crtd = null;
			if( strngfr ){
				const tmp = strngfr.encodeObject(this.created_by);
				if( tmp !== this.created_by ) crtd = tmp;
				else crtd = strngfr.stringify( this.created_by );
			}
			if( !crtd  ) {
				crtd = this.created_by.V?('~or"'+this.created_by.V+'"'):('Er[i"'+this.created_by.Λ+'"]');
			}
			const mods = (strngfr?strngfr.stringify(this._module,null,null,"_module"):JSOX.stringify( this._module ));
			//console.log( "encoded mods with stringifier? or just raw?", !!strngfr, mods );
			return '{Λ:i"' + this.Λ.toString()
				+ '",V:"' + this.V
				+ '",value:' + (this.value && this.value.toString())
				+ ',name:"' + (this.name)
				+ '",description:"' + (this.description)
				+ '",within:' + wthn
				+ ',attached_to:' + attached
				+ ',contains:' + contained
				+ ',created_by:' + crtd
				//+ ',"code":' + JSOX.stringify( this.sandbox.scripts.code )
				+ ',_module:'+ mods
				+ '}\n';
			
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
				, sandbox : this.sandbox
				, _module : this._module
				, value : this.value
			};
			return rep;
		}
	}

	Object.getOwnPropertyNames(entityMethods).forEach(function (prop) {
		var descriptor = Object.getOwnPropertyDescriptor(entityMethods, prop);
		Object.defineProperty(Entity.prototype, prop, descriptor);
	});
	Entity.prototype.save = function() {
		this.saved = true;
		return this.saved;
	}
	Object.defineProperty(Entity.prototype, "saved", { enumerable: false, configurable: false
		, get(){ return this.save_; }
		, set(val){ 
			//console.log( "Key Saved?", this, val)
			if( val ) {
				if( this.V ) {
					return fc.put(this );
				}
				const this_ = this;
				this_.saving = true;
				//console.trace( "Before PUT");
				this.save_ = new Promise( (res,rej)=>{
					//console.log( "SAVED KEYREF?", x, this );
					this.Λ.save().then( (id) =>{
						if( !id ) console.log( "Save somehow failed... (it won't)");
						this.save_ = fc.put( this ).then( (id )=>{
							if( this.created_by !== this )
								this.created_by.save();
							//console.log( " storage identifier:", this.name, id );
							this_.V = id;
							//console.log(" Resolving with new id");
							res( id );

							// all other things which have this as a reference, and have been saved need to update.
							// if the container is not a saved thing, must also save that thing.
							if( this_.within !== this_ )
								this_.within.saved=val;
							this.saving = false;
							//this.save_ = '~os"'+id+'"';
							return id;
						} );
						/* do we require any other things to be saved because this is saved? */
					});
				})
			}
		} }
	);
	
		

Entity.fromString = function(s) {
	s = JSOX.parse(s);
	if( s.parent === s.Λ )
		s.parent = null;
	var entity = createEntity( s.parent, s.name, s.description )

	o.Λ = s.Λ;
		console.warn( "create sandbox here, after getting ID --------- FROM STRING?!")

		if (o.within) {
			console.log( "From String  create and set in container:", o.Λ );

			o.within.contains.set(o.Λ.toString(), o);
		} else
			o.within = o;

		var oldId = o.Λ.toString();
		o.Λ.on(()=>{
			o.within.contains.delete( oldId );
			o.within.contains.set( o.Λ.toString(), o );
			for( let a of o.attached_to ) {
				a.attached_to.delete( oldId );
				a.attached_to.set( o.Λ.toString(), o );
			}
			objects.delete( oldId );
			objects.set(o.Λ.toString(), o);
			o.thread.emit( "rekey", o.Λ );
		})
		objects.set(o.Λ.toString(), o);

		sealEntity(o);

		if (!o.within) {
			//o.attached_to.set(o.Λ.toString(), o);
		}else {
			if( o.within.thread ) {
				o.within.thread.emit("created", o.Λ);
				o.within.thread.emit("inserted", o.Λ);
			}
		}
		//o.within.contains.forEach(near => (near !== o) ? near.thread.emit("joined", o) : 0);

		if (!callback)
			throw ("How are you going to get your object?");
		else {
			doLog(" ---------- Result with completed, related object ------------------ ");
		}
}

exports.reloadAll = function( ) {
	//console.log( "So? Config.run used to have a proper ID...", config.run )
	return new Promise( (res,rej)=>{
		fc.get( config.run["The Void"] ).then ((obj)=>{
			return fc.map( obj, {depth:-1} ).then( obj=>{

				//doLog( "recovered core entity...", !!entity.theVoid, !!theVoid, entity.theVoid === theVoid );

				// this is already a made entity.
				// wake anyone that had scripts loaded.... 
				// probalby should save this as a flag instead?
				const waking = [];
				function wakeEntities( o ){
					if( waking.find(e=>o===e))return;
					waking.push(o);
					o.contains.forEach( e=>wakeEntities(e));
					o.attached_to.forEach( e=>wakeEntities(e));
					if( o._module.includes.length ){
						const include = o._module.includes[0];
						//console.log( "References?", JSOX.stringify( o._module ) );
						//console.log( "References2?", JSOX.stringify( o._module .includes) );

						wake.WakeEntity( o, false ).then( thread=>{
							const thisModule = o._module;
							console.log( "fill cache with module's code?")
							//console.log( "Module had some script....", thisModule.src, requireCache, thisModule.filename );
							function addCodeToCache( thisModule ) {
								for( var i = 0; i < thisModule.includes.length; i++ ) {
									console.log( "tick:", i );
									requireCache.set( thisModule.includes[i].filename, thisModule.includes[i] );
									addCodeToCache( thisModule.includes[i] );
								}
							}
							addCodeToCache( thisModule );
							console.log( "Cache:", requireCache );
							runModule( o, thisModule.includes[0] )
								/*.then( ()=>{
								console.log( "Script resulted... and there's still requires...")
							});*/

						})
					}
				}
				wakeEntities(obj);
				waking.length = 0;
				
				//doLog( "Is this really serial at this time?", defer );
				res();
			})
		})
		.catch(err=>{
			console.log( "Nothing to reload.." );
		})
	})
}

exports.saveAll = function() {
	return console.trace( "Don't really want to Save ALL....");
	if( createdVoid ) {
		var saved = new Map();
		var output = [];
		var o = makeEntity( createdVoid.Λ );
		recurseSave( o );

		//for( var n = 0; n < output.length; n++ )
		//		output[n] = output[n].toString();
		doLog( 'output  "core/entities.jsox"', output );
		fc.store( "core/entities.jsox", JSOX.stringify( output, null, 2 ) )
		function recurseSave( o ) {
			if( saved.get(o.Λ) ) return; // already saved.
			if( o.save_ ) {
				output.push( o.toRep() );
			}
			saved.set( o.Λ.toString(), o );
			o.attached_to.forEach( recurseSave );
			//doLog( "Saving:", o.toString() )
			o.contains.forEach( recurseSave );
			o.created.forEach( recurseSave );
		}
	}

}

// this 
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

function isOwned( owner, obj, checked) {
	if (obj.within) return false;
	
	if (!checked)
		checked = {};
	var attached = obj.attached_to[Symbol.iterator]()
	for (let content of attached) {
		content = content[1];
		if( content === owner ) continue; // this object's container doesn't matter.
		if (checked[content.Λ]) continue; // already checked.
		checked[content.Λ] = true;
		if (content.within) return false;
		var result = isOwned( obj, content, checked);
		if (result) return result;
	}
	// nothing else attached to the object has a container point.
	return true;
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
	console.trace( "********SaveConfig Volume (FIXME)" );
	return;
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
	console.trace( "********LoadConfig Volume (FIXME)" );
	return;
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

