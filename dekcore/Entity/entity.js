"use strict";
const events = require('events');
const os = require( 'os' );
const url = require( 'url' );
const tls = require( 'tls' );
const https = require( 'https' );
const path = require( 'path' );
const cp = require( 'child_process');
const vm = require('vm');
const fs = require('fs');
const ws = require('ws');
const stream = require('stream');
const util = require('util');
const process = require('process');
const crypto = require('crypto');

const idMan = require('../id_manager.js');


const ee = events.EventEmitter;
var objects = [];
var remotes = new WeakMap();
var childPendingMessages = new Map();

function sandboxWS( url, protocols ) {
	let self = this;
	if( !(this instanceof sandboxWS) )
		return new sandboxWS( url, protocols );

	this.ws = new ws( url, protocols );
	this.keyt = { key:null, step: 0 };
	this.keyr = { key:null, step: 1 };
	this.send = (buf)=>{
		if( !this.keyt.key ) {
			this.keyt.key = buf;
			this.keyr.key = buf;
			this.ws.send( buf );
		} else {
			this.ws.send( idMan.u8xor( buf, this.keyt ) );
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
				//console.log( "sending...", self)
				cb( idMan.u8xor( buf, self.keyr ) );
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

//console.log( "dirname is", __dirname );
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
var fc = require('../file_cluster.js');
var config = require('../config.js');
const vfs = require('sack.vfs');
const vol = vfs.Volume();
const vfsNaked = require('sack.vfs');

const volOverride = `(function(vfs, dataRoot) {
	vfs.Volume = (function (orig) {
		// entities that want to use the VFS will have to be relocated to their local path
		return function (name, path, a, b) {
			//console.log("what's config?", config);
			var privatePath = dataRoot + "/" + config.run.Λ + "/" + path;
			//console.log("Volume overrride called with : ", name, dataRoot + "/" + config.run.Λ + "/" + path, orig);
			//console.log("Volume overrride called with : ", a, b );
			try {
				return orig(name, privatePath, a, b);
			} catch(err) {
				console.log( "limp along?" );
			}
		}
	})(vfs.Volume);

	vfs.Sqlite = (function(orig) {
		return function (path) {
			//console.log("what's config?", config);
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
					//console.log( "Make directory for sqlite?", pathPart )
					vfs.mkdir( pathPart );
				}
				//console.log("Sqlite overrride called with : ", dataRoot + "/" + config.run.Λ + "/" + path);
				try {
					return orig( privatePath );
				} catch(err) {
					console.log( "limp along?" );
				}
			}
			else return orig( path );
		}
	})(vfs.Sqlite);
})`

config.start( ()=>eval( volOverride )( vfs, config.run.defaults.dataRoot ) )


const netRequire = require('../util/myRequire.js');

//var all_entities = new WeakMap();
var objects = new Map();

const _debugPaths = false;
var drivers = [];

var nextID = null;

var entity = module.exports = exports = {
	create: Entity,
	theVoid: null,
	getObjects: exported_getObjects,
	getEntity: getEntity,
	netRequire: netRequire,
	addProtocol: null, // filled in when this returns
	config : config,
	idMan : idMan
}

//Λ

function EntityExists(key, within) {
	if (objects.get(key))
		return true;
	if (idMan.Auth(key)) {
		fc.restore(within, key, (error, buffer) => {
			if (error)
				throw error;
			var e = Entity(config.run);
			e.fromString(buffer);
		})
	}
}

var createdVoid = false;
var base_require;

function sealSandbox(sandbox) {
	/*
	vm.runInContext(`function require() {
				return _require( global );
			}`
			, sandbox
			, { filename: "setRequire", lineOffset: 0, columnOffset: 0, displayErrors: true, timeout: 1000 });

*/
	["events", "crypto", "_module", "console", "Buffer", "require", "process", "fs", "vm"].forEach(key => {
		if( key in sandbox )
		Object.defineProperty(sandbox, key, { enumerable: false, writable: true, configurable: false });
	})

}

function sealEntity(o) {
	["Λ", "container", "contents", "attach", "create"
		, "has_value", "loaded", "created", "created_by"
		, "attached_to", "created_by", ""
		, "assign", "detach", "rebase", "debase", "drop", "store", "fromString", "toString"
		//,"nearObjects"
		, "sandbox"
		, "EventEmitter", "usingDomains", "defaultMaxListeners", "init", "listenerCount", "requested"
		, "addListener", "removeListener", "removeAllListeners", "vol"
	].forEach(key => {
		Object.defineProperty(o, key, { enumerable: false, writable: true, configurable: false });
	})
}



function Entity(obj, name, description, callback, opts) {
	if (this instanceof Entity) throw new Error("Please do not call with new");
	//console.log("Called with obj:", obj, createdVoid);
	if (!name && !description) {
		//var all = all_entities.get(obj);
		var named = objects.get(obj);
		//console.log( "Got",  named, obj )
		obj = named || obj;
		return named;
	}
	if (typeof (obj) === "string") {
		//console.log( "resolve obj as entity ID")
		obj = objects.get(obj);
		if( obj ) return obj;
		//console.log( "resolve obj as entity ID", obj)
	}

	if (obj && !obj.Λ) {
		base_require = require;
		obj = null;
	}
	if ((!obj || !(objects.get(obj.Λ))) && createdVoid) {
		console.log("All Entities", all_entities);
		console.log("Objects", objects);
		console.log("invalid object is ", obj);
		throw new Error(["Invalid creator object making this one", obj].join(" "));
	}
	if (!config.run.Λ) {
		//console.log( "had to wait for config.run", name, description )
		config.start(() => { Entity(obj, name, description, callback, opts) })
		return;
	}
	if (!obj) {
		createdVoid = idMan.localAuthKey;
	}
	var o = createEntity( obj, name, description );
	if( nextID ) {
		o.Λ = nextID;
		nextID = null;
		finishCreate();
	}
	else idMan.ID(obj || createdVoid, config.run, (key) => {
		//console.log( "object now has an ID", o, key );
		o.Λ = key.Λ;
		finishCreate();
	} );
	function finishCreate( ) {
		if( opts && opts.fork ) {
			o.child = cp.fork( "childEntity.js", [o.Λ, ] )
			o.child.on( "message", (msg)=>{
				if( msg.op === "present" ) {
					o.child.send( { op:"first message test"});
				}
			})
		} else {
			//console.log( "create sandbox here, after getting ID")
			o.sandbox = vm.createContext(makeSystemSandbox(o, true));
			o.sandbox.entity = makeEntityInterface(o);
			sealSandbox(o.sandbox);
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

		o.within.sandbox.emit("created", o);
		o.within.sandbox.emit("inserted", o);
		o.within.contains.forEach(near => (near !== o) ? near.emit("joined", o) : 0);

		if (!callback)
			throw ("How are you going to get your object?");
		else {
			//console.log(" ---------- Result with completed, related object ------------------ ");
			if( typeof( callback ) === "string" )  {
				o.sandbox.require( callback );
				opts(o);
			}
			else
				callback(o);
		}

	}

}

var timerId;  // static varible to create timer identifiers.

	function makeSystemSandbox(o,local) {
		if (config.run.Λ === o.Λ)
			var theVoid = true;
		else
			var theVoid = false;

		if (!local) {
			console.log("hmm... I want this to be because my ID was from someone else...")
		}

		//if( config.run.Λ === o.Λ )
		//    theVoid = true;
		//if( config.run.Λ === o.created_by.Λ )
		//    local = true;

		var sandbox = {
			require: local ? sandboxRequire : netRequire.require
			, process: process
			, Buffer: Buffer
			, crypto: crypto
			, config: {
				commit() {
					exports.saveAll();
				} }   // sram type config; reloaded at startup; saved on demand
			, global: null
			, scripts : { code: [], index : 0, push(c){ this.index++; this.code.push(c)} }
			, _timers : null
			, _module: {
				filename: "internal"
				, file: "memory://"
				, parent: null
				, paths: [local ? __dirname + "/.." : "."]
				, exports: {}
				, loaded: false
				, rawData: ''
				, includes: []
			}
			, get now() { return new Date().toString() }
			, get me() { return o.Λ; }
			//, get room() { return o.within; }
			, idGen(cb) {
				return idMan.ID(o.Λ, o.created_by.Λ, cb);
			}
			, console: {
				log: (...args) => console.log(...args)
			}
			, io: {
				addProtocol(p, cb) { return o.addProtocol(p, cb); },
				addDriver(name, iName, iface) {
					addDriver( o, name, iName, iface );
					/*
					var driver = drivers.find(d => d.name === name);

					var caller = (driver && driver.iface) || {};
					var keys = Object.keys(iface);
					keys.forEach(key => {
						var constPart = `${iName}[${key}](`;
						caller[key] = function (...argsIn) {
							var args = "";
							argsIn.forEach(arg => {
								if (args.length) args += ",";
								args += JSON.stringify(arg)
							})
							args += ")";
							sandbox.scripts.push( { type:"driverMethod", code:constPart + args } );
							vm.runInContext(constPart + args, sandbox)
						}
					})
					drivers.push({ name: name, iName: iName, orig: iface, iface: caller });
					*/
				},
				openDriver(object,name) {
					var o = objects.get( object );
					console.log( "OPEN DRIVER CALLED!")
					var driver = drivers.find(d => (o === d.object) && (d.name === name) );
					if (driver)
						return driver.iface;

					var iface;
					// pre-allocate driver and interface; it's not usable yet, but will be?
					drivers.push({ name: name, iName: null, orig: null, iface: iface={} });
					return iface;
				}
				, send(target, msg) {
					console.log( "Send does not really function yet.....")
					//o.Λ
					//console.log( "entity in this context:", target, msg );
					var o = objects.get(target.Λ || target);
					if (o)
						o.emit("message", msg)
					//entity.gun.get(target.Λ || target).put({ from: o.Λ, msg: msg });
				}
			}
			, events: {}
			, on: (event, callback) => {
				sandbox.emit("newListener", event, callback)
				if (!(event in sandbox.events))
					sandbox.events[event] = [callback];
				else
					sandbox.events[event].push(callback);
			}
			, off(event, callback) {
				if (event in sandbox.events) {
					var i = sandbox.events[event].findIndex((cb) => cb === callback);
					if (i >= 0)
						sandbox.events[event].splice(i, 1);
					else
						throw new Error("Event already removed? or not added?", event, callback);
				}
				else
					throw new Error("Event does not exist", event, callback);
				sandbox.emit("removeListener", event, callback)
			}
			, addListener: null
			, emit(event, ...args) {
				if (event in sandbox.events) {
					sandbox.events[event].find((cb) => cb(...args));
				}
			}
			, setTimeout(cb,delay) {
				let timerObj = { id: timerId++, cb: cb, next:this._timers, pred:null, dispatched : false, to:null };
				if( this._timers )
					this._timers.pred = timerObj;
				this._timers = timerObj;
				const cmd = `let tmp=_timers;
					while( tmp && tmp.id !== ${timerObj.id})
						tmp = tmp.next;
					if( tmp ) {
						tmp.cb();
						tmp.dispatched = true;
						if( tmp.next ) tmp.next.pred = tmp.pred;
						if( tmp.pred ) tmp.pred.next = tmp.next; else _timers = tmp.next;
					}
				`;
				timerObj.to = setTimeout( ()=>{
					vm.runInContext( cmd, sandbox);
				}, delay );
				//timerObj.to.unref();
				return timerObj;
			}
			, setInterval(cb,delay) {
				let timerObj = { id: timerId++, cb: cb, next:this._timers, pred:null, dispatched : false, to:null };
				if( this._timers )
					this._timers.pred = timerObj;
				this._timers = timerObj;
				const cmd = `let tmp=_timers;
					while( tmp && tmp.id !== ${timerObj.id})
						tmp = tmp.next;
					if( tmp ) {
						tmp.cb();
					}
				`;
				timerObj.to = setInterval( ()=>{
					vm.runInContext( cmd, sandbox);

				}, delay );
				return timerObj;
			}
			, setImmediate(cb) {
				let timerObj = { id: timerId++, cb: cb, next:this._timers, pred:null, dispatched : false, to:null };
				if( this._timers )
					this._timers.pred = timerObj;
				this._timers = timerObj;
				const cmd = `let tmp=_timers;
					while( tmp && tmp.id !== ${timerObj.id})
						tmp = tmp.next;
					if( tmp ) {
						tmp.cb();
						tmp.dispatched = true;
						if( tmp.next ) tmp.next.pred = tmp.pred;
						if( tmp.pred ) tmp.pred.next = tmp.next; else _timers = tmp.next;
					}
				`;
				timerObj.to = setImmediate( ()=>{
					vm.runInContext( cmd, sandbox);

				} );
				return timerObj;
			}
			, clearTimeout( timerObj ) {
				if( !timerObj.dispatched ) return; // don't remove a timer that's already been dispatched
				if( timerObj.next ) timerObj.next.pred = timerObj.pred;
				if( timerObj.pred ) timerObj.pred.next = timerObj.next; else _timers = timerObj.next;
			}
			, clearImmediate : null
			, clearInterval : null
			, resume( ) {

			}
		};
		sandbox.clearImmediate = sandbox.clearTimeout;
		sandbox.clearInterval = sandbox.clearInterval;

		sandbox.idGen.u8xor = idMan.u8xor;
		sandbox.idGen.xor = idMan.xor;
		sandbox.config.run = { Λ : null };
		idMan.ID( idMan.localAuthKey, o.created_by.Λ, (id)=>{ sandbox.config.run.Λ = id.Λ } );
		sandbox.require= local ? sandboxRequire.bind(sandbox) : netRequire.require.bind(sandbox)			;
		sandbox.global = sandbox;
		sandbox.addListener = sandbox.on;
		sandbox.removeListener = sandbox.off;
		sandbox.removeAllListeners = (name) => {
			Object.keys(sandbox.events).forEach(event => delete sandbox.events[event]);
		};
		return sandbox;
	}


function runDriverMethod( o, driver, msg ) {
			var constPart = `${driver.iName}[${msg.data.method}](`;
			var cmd = constPart + args + `,(...args)=>{
				process.send({ id: ${msg.id}, op:"driver return", retval:${JSON.stringify( args )} });
			} )`;

			//scripts.push( { type:"driverMethod", code:cmd } );
			vm.runInContext( cmd, o.sandbox);

}

function addDriver( o, name, iName, iface) {
	var driver = drivers.find(d => d.name === name);
	if( driver ) {
		console.log( "have to emit completed...")
	}
	var caller = (driver && driver.iface) || {};
	var keys = Object.keys(iface);
	if( remotes.get(o) ) {
		keys.forEach(key => {
			caller[key] = function (...argsIn) {
				var args = "";
				var last = argsIn[argsIn.length-1];
				argsIn.forEach(arg => {
					if( arg === last ) return; // don't pass the last arg, that's for me.
					if (args.length) args += ",";
					args += JSON.stringify(arg)
				})
				idMan.ID( o.Λ, me, (id)=>{
					var pending = { id: id, op:"driver", driver:name, data: { type:"driverMethod", method:key, args:args } }
					o.child.send( pending );
					childPendingMessages.set( id, pending )
				} )
			}
		})
	}
	else
		keys.forEach(key => {
			var constPart = `{
				${iName}[${key}](`;
			caller[key] = function (...argsIn) {
				var args = "";
				var last = argsIn[argsIn.length-1];
				argsIn.forEach(arg => {
					if( arg == last ) return; // don't pass the last arg, that's for me.
					if (args.length) args += ",";
					args += JSON.stringify(arg)
				})
				if( "function" == typeof last ) {
					o.sandbox._driverDb = last;
					args += ",_driverCb)";
				}
				else
					args += JSON.stringify( last ) + ")";
				// this should not be replayed ever; it's a very dynamic process...
				//scripts.push( { type:"driverMethod", code:constPart + args } );
				vm.runInContext(constPart + args, sandbox)
			}
		})
	console.log( "adding object driver", name)
	drivers.push({ name: name, iName: iName, orig: iface, iface: caller, object:o });
	return driver; // return old driver, not the new one...
}

	function firstEvents(sandbox) {
		sandbox.on("newListener", (event, cb) => {
			if (event === "message") {
				console.log("listen for self", o.Λ)
				sandbox.io.gun.map(cb);
				return true;
			}
		});
		return false;
	}

	function makeEntityInterface(o) {
		//console.log( "making intefce for ", o.toString() )
		var i = {
			get Λ() { return o.Λ; },
			get name() { return o.name; },
			get description() { return o.description; },
			get value() { return o.value; },
			get inventory() {
				var i = { in: [], on: [] };
				//o.getObjects( o, filter, true, (near,where)=>{if( where === "contains" ) result.push( {name:near.name,Λ:near.Λ} ) } );
				o.contains.forEach((near) => { i.in.push({ name: near.name, Λ: near.Λ }) });
				o.attached_to.forEach((near) => { if (near !== o) i.on.push({ name: near.name, Λ: near.Λ }) });
				return i;
			},
			look() { return o.look(); },
			create(name, desc, callback, val) { o.create(name, desc, callback,val) },
			bud() { o.birth() },
			store(a) {
				a = objects.get(a.Λ);
				o.store(a);
			},
			run(statement) {
				o.run(statement);
			},
			get(o) { return objects.get(o).sandbox.entity; },
			get parent() { return o.parent.sandbox.entity; },
			//get value() { return o.value; }
		}
		return i;
	}

	function sandboxRequire(src) {
		//console.trace( "this is", this, src );
		var o = Entity( this.me );
		//console.trace("sandboxRequire ",  src );
		//console.log( "module", o.sandbox.module );
		if (src === "entity.js") return exports;
		if (src === "shell.js") return exports.Sentience;
		if (src === "text.js") return text;

		if (src == 'ws') {
			return sandboxWS;
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
		//if (src == 'path') return path;

		if (src == 'events') return events;

		if (src == 'sack.vfs') {
			if( !("_vfs" in o.sandbox ) ) {
				//console.log( "Overriding internal VFS", o.name )
				o.sandbox._vfs = Object.assign( {}, vfsNaked );
				o.sandbox._vfs.Volume = o.sandbox._vfs.Volume.bind( {} );
				o.sandbox._vfs.Sqlite = o.sandbox._vfs.Sqlite.bind( {} );
				try {
					vm.runInContext( "(" + volOverride + ')(this._vfs,"' +  "." +'")' , o.sandbox
						, { filename: "moduleSetup" , lineOffset: 0, columnOffset: 0, displayErrors: true, timeout: 1000 })
				} catch( err) {
					console.log( "VM Error:", err );
				}
			}
			return o.sandbox._vfs;
		}

		//console.log( "blah", o.sandbox.scripts)
		if( o.sandbox.scripts.index < o.sandbox.scripts.code.length ) {
			var cache = o.sandbox.scripts.code[o.sandbox.scripts.index];
			//console.log( "cache is?", typeof cache, cache);
			if( cache.source === src ) {
				o.sandbox.scripts.index++;

				var oldModule = o.sandbox._module;
				var root = cache.closure.root;
				var thisModule = {
					filename: cache.closure.filename
					, src : cache.closure.src
					, source : cache.closure.source
					, file: ""
					, parent: o.sandbox._module
					, paths: cache.closure.paths
					, exports: {}
					, includes : []
					, loaded: false
				}
				oldModule.includes.push( thisModule );
				//        { name : src.substr( pathSplit+1 ), parent : o.sandbox.module, paths:[], root : rootPath, exports:{} };
				//oldModule.children.push( thisModule );
				o.sandbox._module = thisModule;

				var root = cache.closure.filename;
				try {
					//console.log( "closure recover:", root, cache.closure )
					var file = fs.readFileSync(root, { encoding: 'utf8' });
				} catch (err) {
					console.log("File failed... is it a HTTP request?", src, root, err);
					return undefined;
				}
				if( file !== cache.closure.source ) {
					console.log( "updating cached file....", src )
					cache.closure.source = file;
					exports.saveAll();
				}
				var code = ['(function(exports,config,module,resume){'
					, cache.closure.source
					, '})(_module.exports,this.config, _module, true );\n//# sourceURL='
					, root
				].join("");

				//console.log( "Executing with resume TRUE")
				try {
					vm.runInContext( code, o.sandbox
						, { filename: cache.source , lineOffset: 0, columnOffset: 0, displayErrors: true, timeout: 1000 })
				} catch( err ) {
					console.log( "VM Error:", err );
				}
				o.sandbox._module = oldModule;
				//console.log( "active base module is ... ")
				return thisModule.exports;
			}
		}

		var rootPath = "";
		// resolves path according to relative path of parent modules and resolves ".." and "." parts
		var root = netRequire.resolvePath(src, o.sandbox._module);
		_debugPaths && console.log("src could be", src);
		_debugPaths && console.log("root could be", root);
		_debugPaths && console.log("working root is ", rootPath);
		try {
			var file = fs.readFileSync(root, { encoding: 'utf8' });
		} catch (err) {
			console.log("File failed... is it a HTTP request?", err);
			return undefined;
		}
		//console.log( o.sandbox.module.name, "at", rootPath,"is loading", src );
		//var names = fs.readdirSync( "." );
		//console.log( names );
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

		//console.log( "set root", rootPath );

		var code =
			['(function(exports,config,module,resume){'
				, file
				, '})(_module.exports,this.config, _module, false );\n//# sourceURL='
				, root
			].join("");

		var oldModule = o.sandbox._module;
		var thisModule = {
			filename: root
			, src : src
			, source : file
			, file: netRequire.stripPath(root)
			, parent: o.sandbox._module
			, paths: [netRequire.stripFile(root)]
			, exports: {}
			, includes : []
			, loaded: false
			, toJSON() {
				//console.log( "Saving this...", this );
				return JSON.stringify( { filename:this.filename, file:this.file, paths:this.paths, src:this.src, source:this.source })
			}
			, toString() {
				return JSON.stringify( {filename:this.filename
					, src:this.src })
			}
		}
		oldModule.includes.push( thisModule );
		//        { name : src.substr( pathSplit+1 ), parent : o.sandbox.module, paths:[], root : rootPath, exports:{} };
		//oldModule.children.push( thisModule );
		o.sandbox._module = thisModule;

		o.sandbox.scripts.push( { type:"require", source:src, closure: thisModule } );
		try {
			vm.runInContext(code, o.sandbox
				, { filename: src, lineOffset: 0, columnOffset: 0, displayErrors: true, timeout: 1000 })
		} catch( err) {
			console.log( "VM Error:", err );
		}
		//console.log( "result exports for ", src
		//               , thisModule.name
		// 		 , thisModule.exports
		//           );
		o.sandbox._module = oldModule;
		//console.log( "active base module is ... ")
		return thisModule.exports;
	}

function createEntity(obj,name,desc ) {
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
		, get container() { return this.within; }
		, create(name, desc, cb, value) {
			//console.trace("Who calls create?  We need to return sandbox.entity?");
			if (typeof desc === 'function') {
				cb = desc; desc = null;
			}
			Entity(this, name, desc, (newo) => {
				newo.value = value;
				if (typeof cb === 'string') {
					//console.trace( "cb is a script, call value as callback......")
					newo.sandbox.require(cb); // load and run script in entity sandbox
					if (value) value(newo);
				} else
					if (cb) cb(newo) // this is a callback that is in a vm already; but executes on this vm instead of the entities?
			});
		}
		, birth( ) {
			remotes.set( o, o );
			this.child = cp.fork( __dirname + "/childEntity.js", [o.Λ, config.run.defaults.defaultPort.toString()])
			this.child.on( 'message', (msg)=>{
				if( msg.op === "driver" ) {
					var driver = drivers.find( d=>d.name === msg.driver );
					runDriverMethod( o, driver, msg );
				}
			} )
			this.child.on( 'close', (code)=>{
				remote.delete( o );
			});
		}
		, look() {
			var done = [];
			getObjects(this, null, true, (o) => {
				done.push({ name: o.name, ref: o.Λ, o:o.sandbox.entity });
			})
			return done;
		}
		, getObjects: (...args) => getObjects(o, ...args)
		, get contents() { return o.contains; }
		, get nearObjects() {
			//console.log( "getting near objects")
			var near = new Map();
			near.set("holding", o.attached_to);
			near.set("contains", o.contains);
			near.set("near", (() => {
				var result = new Map();
				if (o.within) {
					o.within.contains.forEach((nearby) => {
						if (nearby !== o) {
							result.set(nearby, nearby);
						}
					});
					o.within.attached_to.forEach((nearby) => {
						result.set(nearby, nearby);
					});
					return result;
				}
			})());
			//console.log( "near" );
			return near;
		}
		, assign: (object) => {
			o.value = object;
			if (config.run.debug)
				sanityCheck(object);
		}
		, attach(a, b, isFromAtoB) {
			var checked;
			if (isContainer(a, checked, this).Λ && isContainer(b, checked, this).Λ) {
				a.within = null;
				if (isFromAtoB === undefined)
					if (o.Λ !== a.Λ) {
						if (a.within) {
							a.attached_to.set(o.Λ, o);
							o.attached_to.set(a.Λ, a);
							o.emit('attached', a);
							a.emit('attached', o);
						}
					}
					else {
						throw "cannot attach to self";
					}
				else {
					cosnole.log("Directional attach - incomplete ")
					if (isFromAtoB) {

					}
				}
			}
			else {
				throw "attachment between two differenly owned objects or one's not owned by you";
			}
		}
		, detach(a, b) {
			if (o.Λ === a.within.Λ === b.within.Λ) {
				a.within = null;
				if (o.Λ !== a.Λ) {
					a.attached_to.delete(a.Λ);
					o.attached_to.delete(b.Λ);
					o.emit('detached', a);
					a.emit('detached', o);
				}
				else {
					throw ""

				}
			}
		}
		, rebase(a) {
			if (a.within) return;
			outer = findContained(a);
			if (outer) {
				outer.within.contains.delete(outer.name);
				outer.within = null;
			}
		}
		, debase(a) {
			if (a.within)
				if (a.attached_to.size) {
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
		, drop(a) {
			var object
			var outer = o.within;
			if (!outer)
				outer = findContained(o);
			if (outer)
				if (a.within) {

					a.within.contains.delete(a.Λ);
					a.within = o.within;
					o.within.emit('contained', a);
				}
				else {
					if (o.within) {
						a.attached_to.forEach((p) => { delete p.attached_to[a.Λ] });
						a.within = o
					}
					object = findContained(a)
					if (object) {
						drop(object)
						delete object.within.contains[object.Λ];
						object.within = o;
						obj.within.emit('contained', a);
					}
					else {
						a.within = o;
					}
				}
			if (o.within) {
				o.within.contains.set(a.Λ, a);
				a.within = o.within;
			}
			o.contains.delete(a.Λ);
			var attachments = []
			var ac = getAttachments(a);
		}
		, store(a) {
			if (a.within) {
				if (a.within !== o) {
					a.within.contains.delete(a.Λ);
					a.within = o;
					this.contains.set(a.Λ, a);
					a.emit("stored", o.sandbox.entity);
					o.emit("gained", a.sandbox.entity);
				} // already inside the specified thing.
			}
			else {
				var object
				object = findContained(a)
				if (object !== o) {
					object.within.contains.delete(a.Λ);
					//detach( a );
					object.within = o;
					this.contains.set(object.Λ, a);
					a.sandbox.emit("stored", object.sandbox.entity);
					object.sandbox.emit("gained", a.sandbox.entity);
				}
			}
		}
		, run(command) {
			this.sandbox.scripts.push( { type:"run", code:command } );
			vm.runInContext(command, this.sandbox, { filename: "Entity.run()", lineOffset: "0", columnOffset: "0", displayErrors: true, timeout: 10 })
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
			idMan.delete( this.Λ, config.run.Λ );
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
				+ ',"code":' + JSON.stringify( this.sandbox.scripts.code )
				+ ',"config":'+ JSON.stringify( this.sandbox.config )
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
				, config : this.sandbox.config
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
				o.within = tmp.within || objects.get(tmp.within) || all_objects.get(tmp.within);
				o.created_by = tmp.created_by || objects[tmp.created_by];
				tmp.attached_to.forEach((key) => { o.attached_to.push(objects[key]) })
				Object.assign(o, tmp);
			}
		}
		*/
	}
	o.created_by = obj || o;
	o.created_by.created.push( o );
	//console.log( "Attempt to get ID for ", (obj||createdVoid).Λ, config.run  )
	//all_entities.set(o, o);

	Object.assign(o, ee.prototype); ee.call(o);
	return o;
}



Entity.fromString = function(s) {
	s = JSON.parse(s);
	if( s.parent === s.Λ )
		s.parent = null;
	var entity = createEntity( s.parent, s.name, s.description )

	o.Λ = s.Λ;
		//console.log( "create sandbox here, after getting ID")
		o.sandbox = vm.createContext(makeSystemSandbox(o, true));
		o.sandbox.entity = makeEntityInterface(o);
		sealSandbox(o.sandbox);

		if (o.within)
			o.within.contains.set(o.Λ, o);
		else
			o.within = o;

		objects.set(o.Λ, o);

		sealEntity(o);

		if (!o.within) {
			//o.attached_to.set(o.Λ, o);
		}

		o.within.sandbox.emit("created", o);
		o.within.sandbox.emit("inserted", o);
		//o.within.contains.forEach(near => (near !== o) ? near.emit("joined", o) : 0);

		if (!callback)
			throw ("How are you going to get your object?");
		else {
			console.log(" ---------- Result with completed, related object ------------------ ");
		}
}

exports.reloadAll = function( onLoadCb, initCb ) {
	// if reload failed, run initCb; else run code already in the thing...
	//return initCb();

	var file = fc.reload( "core/entities.json", (err, file)=>{
		if( !file ) return initCb();
		try {
			file = fc.Utf8ArrayToStr(file);
			//console.log( "got:", err, file );
			var input = JSON.parse( file );
		}catch(err) {
			console.log( "input json is corrupt; defaulting to first run.\n", err)
			return initCb();
		}
		nextID = input[0].Λ;
		Entity( null, input[0].name, input[0].description, (o)=>{
			var defer = [];
			console.log( "recovered core entityt..." );
			o.value = input[0][o.Λ];
			if( o.sandbox ) {
				console.log( "restore scripts to ....", o.sandbox.scripts );
				o.sandbox.config = input[0].config;
				o.sandbox.scripts.code = input[0].scripts;
				for( var c in o.sandbox.scripts.code ) { c.closure = JSON.parse( c.closure ) }
			}
			var executable = [];

			doList( input, 1 );

			function doList( list, start ) {
				//console.log( "do list of things...", list, n, list.length );
				for( var n = start; n < list.length; n++ ) {
					var ths = list[n];
					var creator = Entity(ths.created_by);
					if( !creator ) {
						//console.log( "Defered this creaation..." );
						defer.push( ths );
						continue;
					}

					var parent = ths.within && Entity(ths.within);

					//console.log( "Creator:", creator );
					nextID = ths.Λ;
					creator.create( ths.name, ths.description, (o)=>{
						//console.log( "creator created..." );
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
							//console.log( "restoring scripts")
							o.sandbox.config = ths.config;
							if( ths.scripts.length )
								executable.push( o );
							o.sandbox.scripts.code = ths.scripts;
							//console.log( "Storing scripts?", ths.scripts )
							for( var c of o.sandbox.scripts.code ) {
								//console.log( "Recover?", c );
								if( c.type === "require" && (typeof( c.closure ) === "string" ) )
									c.closure = JSON.parse(c.closure)
							}
						}
						//console.log( "Created :", ths );
					})
				}
				for( var n = start; n < list.length; n++ ) {
					ths.attached_to.find( (a)=>{
						var ae = Entity(a);
						if( !ae ) return true;
						// attach method will fail, because one and or the other has no parent.
						ae.attached_to.set( ths.entity.Λ, ths.entity );
						ths.entity.attached_to.set( ae.Λ, ae );
					} );
				}
			}

			//console.log( "Is this really serial at this time?", defer );
			while( defer.length ) {
				var doit = defer;
				defer = [];
				doList( doit, 0 );
			}

			onLoadCb();
			//console.log( "first run ran --------- start other things loaded...", executable )
			for( var e of executable ) {
				// it may have already started...
				if( !e.sandbox.scripts.index ) {
					console.log( "")
					e.sandbox.require( e.sandbox.scripts.code[0].source )
					// after require, things might be run on it...
				}
				/*
				if( e.sandbox.scripts.index < e.sandbox.scripts.code.length ) {
					var cache = e.sandbox.scripts.code[e.sandbox.scripts.index];
					console.log( "is this cache a run?", e.sandbox.scripts, cache );
					if( cache )
						if( cache.type==="run")
							e.run( cache.code );
					else console.log( "index less than end?", cache)
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
		var o = Entity( createdVoid.Λ );
		recurseSave( o );
		//for( var n = 0; n < output.length; n++ )
		//		output[n] = output[n].toString();
		//console.log( "output", output );
		fc.store( "core/entities.json", JSON.stringify( output, null, 2 ) )
		function recurseSave( o ) {
			if( saved.get(o.Λ) ) return; // already saved.
			output.push( o.toRep() );
			o.attached_to.forEach( a=>recurseSave( a  ) );
			//console.log( "Saving:", o.toString() )
			o.contains.forEach( a=>recurseSave( a ) );
			saved.set( o.Λ, o );
		}
	}

}

	function getObjects(me, src, all, callback) {
		var object = src && src[0];
		var count = 0;
		//var all = false;
		var run = true;
		var tmp;
		//console.trace( "args", me, "src",src, "all",all, "callback:",callback )
		if (typeof all === 'function') {
			callback = all;
			all = false;
		}
		if (object && object.text == 'all' && object.next && object.next.text == '.') {
			all = true;
			object = object.next.next;
		}
		if (object && (tmp = Number(object.text)) && object.next && object.next.text == '.') {
			object = object.next.next;
			count = tmp;
		}
		//var command = src.break();
		//console.log( "get objects for ", me.name, object&&object.text)
		me.nearObjects.forEach(function (value, key) {
			//console.log("checking key:", key)
			if (run) value.forEach(function (value, member) {
				if (value === me) return;
				if (!object || value.name === object.text) {
					//console.log( "found object", value.name )
					if (count) {
						count--;
						return;
					}
					if (run) {
						//console.log("and so key is ", key)
						callback(value, key);
					}
					run = all;
				}
			});
		})
	}


function findContained(obj, checked) {
	if (obj.within) return obj;
	if (!checked)
		checked = [];
	for (content in obj.within) {
		if (checked[content.Λ])
			break;
		checked[content.Λ] = true;
		if (content.within) return content;
		var result = findContainer(content, checked);
		if (result) return result;
	}
	throw "Detached Entity";
}

function findContainer(obj, checked) {
	if (obj.within) return obj.within;
	if (!checked)
		checked = [];
	for (content in obj.attached_to) {
		if (checked[content.Λ]) continue;
		checked[content.Λ] = true;
		if (content.within) return content.within;
		var result = findContainer(content, checked);
		if (result) return result;
	}
	throw "Detached Entity";
}

function isContainer(obj, checked, c) {
	if (obj.within) return (obj.within.Λ === c.Λ);
	if (!checked) {
		checked = [];
		return recurse(obj, checked, c);
	} else {
		for (att in checked) {
			if (att.within.Λ === c.Λ)
				return true;
		}
		return false;
	}

	function recurse(obj, checked, c) {
		for (content in obj.attached_to) {
			if (checked[content.Λ]) continue;
			checked[content.Λ] = true;
			if (content.within.Λ == c.Λ) return true;
			return recurse(content, checked, c);
		} return false;
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
	console.log( "getting objects from:", o.name );
	if (typeof all === 'function') {
		callback = all;
		all = null;
	}
	if( "string" === typeof o )
		o = objects.get(o);
	console.log( "uhmm did we erase o?", o )
	if (o)
		o.getObjects(filter, all, e => { callback(e.sandbox) })
}

function getEntity(ref) {
	var o = objects.get(ref);
	if (o) return o;
	return null;

}

function sanityCheck(object) {
	var s = JSON.stringify(object);
	var t = object.toString();
	console.log(`json is ${s}`);
	console.log(`toString is ${t}`)
	var os = JSON.parse(s);
	if (os !== object) {
		console.log(`did not compare for json conversion.  ${os}  ${object}`);
		console.log(os);
		console.log(object);
	}
}


function saveConfig(o, callback) {
	//if( !fs.exists( 'core') )
	if (!("vol" in o))
		o.vol = vfs.Volume(null, config.run.defaults.dataRoot + "/" + o.Λ);
	o.vol.write(JSON.stringify(o.sandbox.config));
}

//res.sendfile(localPath);
//res.redirect(externalURL);
//
function loadConfig(o) {
	if (!("vol" in o))
		o.vol = vfs.Volume(null, config.run.defaults.dataRoot + "/" + o.Λ);
	{
		var data = o.vol.read("config.json");
		if (data) {
			//console.log( "attempt to re-set exports...", result);
			var object = JSON.parse(data.toString());
			Object.assign(o.sandbox.config, object);
			//console.log( "config reload is", config.run.Λ )
			//config.run = object;
			resume();
		}
		else {
			console.log("initializing config.")
			o.sandbox.config.defaults = require("./config.json");
			saveConfig(o, resume);
		}
	}
}
