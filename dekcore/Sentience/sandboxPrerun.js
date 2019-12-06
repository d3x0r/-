
const _debugPaths = false;
const _debug_commands = false;
const _debug_requires = false;
const _debug_command_input = false;
const _debug_command_post = _debug_commands || false;

const _debug_events = false;
const _debug_event_input = _debug_events || false;

Error.stackTraceLimit = 100;
const util = require('util');
const stream = require('stream');
const vm = require('vm');
const sack = require('sack.vfs');
const path = require('path');
const wt = require('worker_threads');
const njs_module = require('module');
const idGen = require("./util/id_generator.js")

const builtinModules = njs_module.builtinModules.slice(0);
builtinModules.require = require;
const disk = sack.Volume();
const JSOX = sack.JSOX;

const coreThreadEventer = wt.parentPort;

function doLog(...args) {
	var s = util.format(...args);
	sack.log(s);
	//console.log(s);
}

var id = 0;
var eid = 0;
const objects = new Map();
const self = this;
const entity = makeEntity(Λ);
//console.log( "This is logged in the raw startup of the sandbox:", Shell );

const resolvers = {};
const rejectors = {};
const pendingOps = [];

const drivers = [];
var remotes = new WeakMap();
var requireRunReply = [];
var pendingRequire = false;
var codeStack = [];

function emitEvent(event, data) {
	const runcode = `this.emit_( ${JSON.stringify(event)}, ${JSOX.stringify(data)})`
	//var res = vmric(runcode, sandbox, { filename:"Event Dispatch:"+event, lineOffset:0, columnOffset:0, displayErrors:true} );
	var res = this.emit_(event, data);
	return res;
}

function processMessage(msg, stream) {
	if ("string" === typeof msg) {
		console.trace("String input");
	}

	function reply(msg) {
		if (stream)
			process.stdout.write(JSOX.stringify(msg));
		else
			coreThreadEventer.postMessage(msg);
	}
	if (msg.op === "run") {
		var prior_execution = codeStack.find(c => c.path === msg.file.path);
		if (prior_execution)
			doLog("Duplicate run of the same code; shouldn't we just return the prior?  I mean sure, maybe the filter of this should be higher?", msg.file, codeStack);
		_debug_commands && doLog("Run some code...", codeStack, msg.file);
		var res;
		try {
			const code = { file: msg.file, result: null }
			codeStack.push(code);
			//console.log( "Sandbox:", sandbox );
			//var res = vmric(msg.code, sandbox.sandbox , { filename:msg.file.src, lineOffset:0, columnOffset:0, displayErrors:true } );
			var res = vmric(msg.code, sandbox.sandbox, { filename: msg.file.src, lineOffset: 0, columnOffset: 0, displayErrors: true });
			if (res && (res instanceof Promise || Promise.resolve(res) === res || ("undefined" !== typeof res.then)))
				res.then(
					(realResult) => {
						//_debug_commands && 
						//doLog( "And post result.", pendingRequire, realResult );
						if (pendingRequire) {
							code.result = realResult;
							requireRunReply.push(realResult);
							reply({ op: "run", ret: 0, id: msg.id });
						} else
							reply({ op: "run", ret: realResult, id: msg.id });
					}
				).catch(err => {
					if (err)
						reply(({
							op: "error"
							, file: msg.file.src, error: err.toString() + (err.stack ? err.stack.toString() : "NoStack"), id: msg.id
						}));
					else
						reply(({ op: "error", file: msg.file.src, error: "No Error!", id: msg.id }));
				});
			else {
				if (pendingRequire)
					requireRunReply.push(res);
				doLog("And post sync result.", res);
				reply(({ op: "run", ret: res, id: msg.id }));
			}
			//doLog( "Did it?", sandbox );
			return;
		} catch (err) {
			doLog("Failed:", err, msg.code)
			reply(({ op: "error", error: err.toString(), stack: err.stack, id: msg.id }));
			return;
		}
	} else if (msg.op === "ing") {
		return sandbox.ing(msg.ing, msg.args);
	} else if (msg.op === "On") {
		var e = objects.get(msg.on);
		switch (true) {
			case "name" === msg.On:
				e.cache.name = msg.args;
				break;
			case "description" === msg.On:
				e.cache.desc = msg.args;
				break;
		}
	} else if (msg.op === "out") {
		if (msg.out) {
			if (self.io.output)
				self.io.output(msg.out);
			else
				coreThreadEventer.postMessage(msg);
		}
		//reply(msg.out);
		return;
	} else if (msg.op === "on") {
		_debug_event_input && doLog("emit event:", msg);
		var onEnt = (msg.Λ && makeEntity(msg.Λ)) || entity;
		switch (true) {
			case "name" === msg.on:
				onEnt.cache.name = msg.args;
				//msg.args = makeEntity( msg.args)
				break;
			case "rebase" === msg.on:
				msg.args = makeEntity(msg.args);
				break;
			case "debase" === msg.on:
				msg.args = makeEntity(msg.args);
				break;
			case "joined" === msg.on:
				msg.args = makeEntity(msg.args);
				onEnt.cache.near.joined( msg.args );
				break;
			case "parted" === msg.on:
				msg.args = makeEntity(msg.args);
				onEnt.cache.near.part(msg.args);
				break;
			case "placed" === msg.on:
				msg.args = makeEntity(msg.args);
				onEnt.cache.near.placed(msg.args);
				break;
			case "displaced" === msg.on:
				//msg.args = makeEntity( msg.args );
				break;
			case "stored" === msg.on:
				msg.args = makeEntity(msg.args);
				onEnt.cache.near.store(msg.args);
				break;
			case "lost" === msg.on:
				msg.args = makeEntity(msg.args);
				onEnt.cache.near.lose(msg.args);
				break;
			case "attached" === msg.on:
				msg.args = makeEntity(msg.args);
				onEnt.cache.near.attached(msg.args);
				break;
			case "detached" === msg.on:
				msg.args = makeEntity(msg.args);
				onEnt.cache.near.detached(msg.args);
				break;
			case "newListener" === msg.on:
				//msg.args = makeEntity( msg.args );
				break;
		}
		return emitEvent(msg.on, msg.args.Λ);

	}
	else
		_debug_commands && doLog("will it find", msg, "in", pendingOps);

	var responseId = ("id" in msg) && pendingOps.findIndex(op => op.id === msg.id);
	if (responseId >= 0) {
		var response = pendingOps[responseId];
		//doLog( "Will splice...", responseId, msg, pendingOps)
		pendingOps.splice(responseId, 1);
		if (msg.op === 'f' || msg.op === 'g' || msg.op === 'e' || msg.op === 'h') {
			_debug_commands && reply(util.format("Resolve.", msg, response));
			response.resolve(msg.ret);
		} else if (msg.op === 'error') {
			_debug_commands && doLog(util.format("Reject.", msg, response));
			response.reject(msg.error);
		}
	} else {
		if (msg.op !== "run")
			doLog("didn't find matched response?", msg.op, msg)
	}

}

/*
process.stdin.on('data', (chunk) => {
	const string = chunk.toString()
	// this is unused in the general case now
	// preivously used stdin for commands
	// but some configured objects use it for command input.
	//console.warn("Sandbox stdin input: ", chunk, string);
})
*/

function makeEntity(Λ) {
	if (Λ instanceof Promise) return Λ.then(Λ => makeEntity(Λ));
	//console.log( "make entity for:", Λ);
	{
		let tmp = objects.get(Λ);
		if (tmp) return tmp;
	}
	var nameCache;
	var descCache;
	var nearCache;
	const e = {
		Λ: Λ
		//, send( msg ){ coreThreadEventer.postMessage( msg ); }
		, post(name, ...args) {
			_debug_command_post && doLog("entity posting:", id, name);
			return new Promise((resolve, reject) => {
				const thisId = id++;
				coreThreadEventer.postMessage({ op: 'e', o: Λ, id: thisId, e: name, args: args });
				pendingOps.push({ id: thisId, cmd: name, resolve: resolve, reject: reject })
			});
		}
		, postGetter(name) {
			_debug_command_post && console.trace("entity get posting:", id, name, Λ);
			return new Promise((resolve, reject) => {
				const thisId = id++;
				coreThreadEventer.postMessage({ op: 'h', o: Λ, id: thisId, h: name });
				pendingOps.push({ id: thisId, cmd: name, resolve: resolve, reject: reject })
			})
		},
		drop(thing) { return e.post("drop", thing.Λ); },
		enter(into) { return self.post("enter",  into.Λ); },
		leave(to) { return self.post("leave",  to.Λ); },
		escape() { return self.post("escape"); },
		store(thing) { return e.post("store", thing.Λ); },
		grab(target) {
			return e.post("grab", target.Λ);
		},
		hold(target) {
			return e.post("hold", target.Λ);
		},
		cache: {
			get name() { return !!nameCache },
			get name() { return !!nameCache },
			near: {},
		},
		attach(toThing) {
			if ("string" !== typeof toThing) toThing = toThing.Λ;
			return e.post("attach", toThing);
		},
		detach(fromThing) {
			if ("string" !== typeof fromThing) fromThing = fromThing.Λ;
			return e.post("detach", fromThing);
		},
		get name() {
			if (nameCache) return Promise.resolve(nameCache);
			return e.postGetter("name").then(name => {return Promise.resolve(nameCache = name)});
		},
		get description() {
			if (descCache) return Promise.resolve(descCache);
			return e.postGetter("description").then(desc => {return Promise.resolve(descCache = desc)});
		},
		get contents() {
			if (nearCache) {
				try {
					sack.log(util.format("Returning resolved nearCached"));
					console.log(util.format("Returning resolved nearCached"));
				} catch (err) {
					console.log("BLAH:", err)
				}
				return Promise.resolve(nearCache.get("contains"));
			}
			return new Promise(res => {
				this.nearObjects.then(nearCache => {
					res(nearCache.get("contains"));
				})
			})
		},
		get container() {
			return e.postGetter("container").then((c) => {
				c.at = makeEntity(c.at);
				c.parent = makeEntity(c.parent);
				for (let path = c.from; path; path = path.from) {
					path.at = makeEntity(path.at);
					path.parent = makeEntity(path.parent);
				}
				return c;
			})
		},
		get within() { return e.postGetter("room") },
		get holding() {
			return e.nearObjects.then(near =>  Promise.resolve(near.get("holding"))  );
		},
	
		get nearObjects() {
			//console.log( "Get near objects" );
			if (nearCache) return Promise.resolve(nearCache);
			return this.postGetter("nearObjects").then(result => {
				if (e.Λ === self.Λ)
					nearCache = result;
				result.forEach((list, key) => {
					if( list )
					list.forEach((name, i) => {
						list.set(i, makeEntity(name))
					});
				});
				return Promise.resolve(result);
			})
		},
		idGen() {
			return idGen.generator();
		},
		async run(file, code) {
			if (!code) {
				console.trace("Please pass file and code");
				code = file;
				file = { path: "?", file: "Eval" }
			}
			return e.post("run", file, code)
		},
		async wake() {
			return e.post("wake");
		},
		async require(src) {
			_debug_requires && doLog(" ---- thread side require:", nameCache, src, codeStack);
			return e.post("require", src).catch(err => sandbox.io.output(util.format(err)));
		},
		idMan: {
			//sandbox.require( "id_manager_sandbox.js" )
			async ID(a) {
				return e.post("idMan.ID", a);
			}
		}
	};
	e.cache.near.invalidate = (e) => (nearCache = null);

	// my room changes...  this shodl clear cache
	e.cache.near.displaced = ((e) => ((roomCache = null),(nearCache = null)));
	e.cache.near.placed = ((e) => ((roomCache = e),(nearCache = null)));

	e.cache.near.store = ((e) => (!!nearCache) && nearCache.get("contains").set(e.Λ, e));
	e.cache.near.lose = ((e) => (!!nearCache) && nearCache.get("contains").delete(e.Λ) );

	e.cache.near.joined = ((e) => (!!nearCache) && nearCache.get("near").set(e.Λ, e));
	e.cache.near.part = ((e) => (!!nearCache) && nearCache.get("near").delete(e.Λ));
	e.cache.near.attached = ((e) => (!!nearCache) && nearCache.get("holding").set(e.Λ, e));
	e.cache.near.detached = ((e) => (!!nearCache) && nearCache.get("holding").delete(e.Λ));
	if (objects.size)
		e.post("watch", Λ);
	objects.set(Λ, e);
	return e;
}

function killEntity(e) {
	objects.delete(e.Λ);
	return e.post("unwatch", e.Λ);


}

var required = [];

var fillSandbox = {
	Λ: Λ
	, entity: entity
	//, util:util
	, wsThread: sack.WebSocket.Thread
	, waiting: []
	, module: { paths: [codeStack.length ? codeStack[codeStack.length - 1].file.path : module.path], parent: true }
	//, Function : Function
	//, eval: eval
	, post(name, ...args) {
		var stack;
		const thisId = id++;
		//process.stdout.write( `{op:'f',id:${id++},f:'${name}',args:${JSOX.stringify(args)}}` );
		return new Promise((resolve, reject) => {
			pendingOps.push({ id: thisId, cmd: name, resolve: resolve, reject: reject });
			_debug_command_post && doLog("thread posting:", thisId, name);
			coreThreadEventer.postMessage({ op: 'f', id: thisId, f: name, args: args });
		});
		return p;
		/*block*/
	}
	, run(line) {
		return vmric(line, sandbox);
	}
	, async postGetter(name, ...args) {
		//process.stdout.write( `{op:'g',id:${id++},g:'${name}'}` );
		var p = new Promise((resolv, reject) => {
			_debug_command_post && process.stdout.write(util.format("Self PostGetter", name));
			const thisId = id++;
			coreThreadEventer.postMessage({ op: 'g', id: thisId, g: name });
			pendingOps.push({ id: thisId, cmd: name, resolve: resolv, reject: reject });
		})
		return p;
		/*block*/
	}
	, async require(args) {
		_debug_requires && doLog("This is a thread that is doing a require in itself main loop", args, new Error().stack);
		if (args === "sack") return sack;
		if (args === "sack.vfs") return sack;
		if (args === "vm") return vm;
		if (args === "util") return util;
		if (args === "path") return path;
		if (args === "stream") return stream;
		var builtin = builtinModules.find(m => args === m);
		if (builtin) {
			if (['vm', 'child_process', 'worker_threads', 'fs'].find(m => m === args)) {
				throw new Error("Module not found:", + a)
			}
			doLog("Including native node builtin module:", args);
			return builtinModules.require(args);
		}
		args = self.require.resolve(args);
		_debug_requires && doLog("This is STILL a thread in itself main loop", args);
		if (args.includes("undefined"))
			doLog("Failed!", args);
		var prior_execution = codeStack.find(c => c.file.src === args);
		if (prior_execution) {
			_debug_requires && doLog("Require resoving prior object:", args)
			return prior_execution.result;
		}
		{
			var prior = (required.find(r => r.src === args));
			if (prior) {
				_debug_requires && doLog("Global Old Require:", args);
				return prior.object;
			}
		}
		_debug_requires && doLog("Global New Require:", args, codeStack //, new Error().stack 
		);
		pendingRequire = true;
		return self.post("require", args).then(ex => {
			_debug_requires && doLog("Read and run finally resulted, awated on post require");
			var ex2 = requireRunReply.pop()
			//doLog( "Require finally resulted?",args, ex, ex2 ); 
			required.push({ src: args, object: ex2 });
			return ex2;
		}).catch(err => self.io.output("Require failed:", err));
	}
	, process: process
	, _process: {
		stdout: process.stdout,
		stdin: process.stdin,
		x: "not process"
	}
	, Buffer: Buffer
	, async create(a, b, c) {
		return self.post("create", a, b).then(
			(val) => {
				val = makeEntity(val);
				if ("string" === typeof c) {
					return val.post("wake").then(() => {
						return val.post("postRequire", c).then((result) => {
							return Promise.resolve(val);
						})
					});
				}
				else {
					return Promise.resolve(val);
				}
			}
		);
	}
	, leave(...args) { return self.post("leave",  ...args); }
	, enter(...args) { return self.post("enter",  ...args); }
	, grab(thing) { return entity.grab(thing) }
	, hold(thing) { return entity.hold(thing) }
	, drop(a) { return entity.drop(a) }
	, store(thing) { return entity.store(thing) }
	//, crypto: crypto
	//, config(...args) { returnpost("config",...args); })(); }  // sram type config; reloaded at startup; saved on demand
	, global: null
	, scripts: { code: [], index: 0, push(c) { this.index++; this.code.push(c) } }
	, _timers: null
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
	, get now() { return new Date().toString() }
	, get name() { return entity.name }
	, get desc() { return entity.description }
	, get description() { return entity.description }
	, get holding() { return entity.nearObjects.then(near => Promise.resolve(near.get("holding"))); }
	, get container() { return self.postGetter("container") }
	, get near() {
		return entity.nearObjects.then(near => Promise.resolve(near.get("near")));
	}
	, get exits() {
		{
			return (async () => {
				var nearList = await self.postGetter("exits")
				nearList.forEach((near, i) => {
					nearList[i] = makeEntity(near);
				})
				return nearList;
			})()
		}
	}
	, get contains() { { return (async () => { return await self.postGetter("contains") })() } }
	//, get room() { return o.within; }
	, idGen(cb) {
		doLog("This ISGEN THEN?")
		return idMan.ID(Λ, Λ.maker, cb);
	}
	, console: {
		log(...args) {
			if (self.io.output)
				self.io.output(util.format(...args) + "\n");
			else
				process.stdout.write(util.format("AAAA", ...args) + "\n")
		},
		warn(...args) { return doLog(...args) },
		trace: (...args) => { console.log(...args); console.log("Call Stack:", new Error().stack); }
	}
	, io: {
		output: null,
		addInterface(name, iName, iface) {
			addDriver(self, name, iName, iface);
		},
		getInterface(object, name) {
			var o = object;
			doLog("OPEN DRIVER CALLED!")
			var driver = drivers.find(d => (o === d.object) && (d.name === name));
			if (driver)
				return driver.iface;

			var iface;
			// pre-allocate driver and interface; it's not usable yet, but will be?
			drivers.push({ name: name, iName: null, orig: null, iface: iface = {} });
			return iface;
		}
		, send(target, msg) {
			doLog("Send does not really function yet.....")
			//o.Λ
			//doLog( "entity in this context:", target, msg );
			var o = target;
			if (o)
				self.emit("message", msg)
			//entity.gun.get(target.Λ || target).put({ from: o.Λ, msg: msg });
		}
	}
	, events: {}
	,  // events_ is the internal mapping of expected parameters from the core into the thread.
	events_: {

	}
	, on(event, callback) {
		self.emit("newListener", event, callback)
		if (!(event in self.events))
			self.events[event] = [callback];
		else
			self.events[event].push(callback);
	}
	, off(event, callback) {
		if (event in self.events) {
			var i = self.events[event].findIndex((cb) => cb === callback);
			if (i >= 0)
				self.events[event].splice(i, 1);
			else
				throw new Error("Event already removed? or not added?", event, callback);
		}
		else
			throw new Error("Event does not exist", event, callback);
		self.emit("removeListener", event, callback)
	}
	, addListener: null
	, emit_(event, args) {
		if (args instanceof Array)
			args.forEach((arg, i) => args[i] = makeEntity(arg));
		else
			args = makeEntity(args);
		return this.emit(event, args);
	}
	, emit(event, ...args) {
		_debug_events && doLog("Emitting event(or would):", event, ...args)
		if (event in sandbox.events) {
			sandbox.events[event].forEach((cb) => cb(...args));
		}
	}
	, ing(event, ...args) {
		if (event in sandbox.events) {

		}
	}
	, setTimeout(cb, delay) {
		let timerObj = { id: timerId++, cb: cb, next: this._timers, pred: null, dispatched: false, to: null };
		if (this._timers)
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
		timerObj.to = setTimeout(() => {
			vmric(cmd, sandbox);
		}, delay);
		//timerObj.to.unref();
		return timerObj;
	}
	, setInterval(cb, delay) {
		let timerObj = { id: timerId++, cb: cb, next: this._timers, pred: null, dispatched: false, to: null };
		if (this._timers)
			this._timers.pred = timerObj;
		this._timers = timerObj;
		const cmd = `let tmp=_timers;
            while( tmp && tmp.id !== ${timerObj.id})
                tmp = tmp.next;
            if( tmp ) {
                tmp.cb();
            }
        `;
		timerObj.to = setInterval(() => {
			vmric(cmd, sandbox);

		}, delay);
		return timerObj;
	}
	, setImmediate(cb) {
		let timerObj = { id: timerId++, cb: cb, next: this._timers, pred: null, dispatched: false, to: null };
		if (this._timers)
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
		timerObj.to = setImmediate(() => {
			vmric(cmd, sandbox);

		});
		return timerObj;
	}
	, async getObjects(me, src, all, callback) {
		// src is a text object
		// this searches for objects around 'me' 
		// given the search criteria.  'all' 
		// includes everything regardless of text.
		// callback is invoked with value,key for each
		// near object.
		//console.trace ("Getting objects... around me...");
		if( "function" === typeof all ){
			callback = all;
			all = true;
			console.log( new Error("Please update caller of getObjects:").stack );
		}
		var object = src && src[0];
		if (!src) all = true;
		var disablePariticiples = false;
		if( all ) {
			disableParticipiles = all.disablePariticples;
			all = all.all;
		}
		var awaitList = [];
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

		if( !disablePariticiples) {
			if (src && src.length > 1 && src[1].text === "in") {
				console.warn("checking 'in'");
				in_state = true;
				src = src.slice(2);
				return getObjects(me, src, all, (o, oName, location, moreargs) => {
					o = objects.get(o.me);
					doLog("in Found:", o.name, name);
					o.contents.forEach(async content => {
						//if (value === me) return;
						content.name.then( contentName => {
							if (!object || (contentName) === name) {
								doLog("found object", contentName);
								if (count) {
									if( --count ) // do run on count to 0
										return;
									run = true;
								}
								if (run) {
									doLog("and so key is ", location+"contained", contentName);
									if( callback(content, content.name, location + ",contains", src.splice(1)) === false )
										count++;
									run = all;
								}
							}
						} );
					})
				})
			}
			if (src && src.length > 1 && (src[1].text == "on" || src[1].text == "from" || src[1].text == "of")) {
				on_state = true;
				src = src.slice(2);
				return getObjects(me, src, all, (o, oName, location, moreargs) => {
					if( !location ) return; // done.
					//doLog( "Found last part?", oName );
					return o.nearObjects.then(nearList => {
						nearList.get('holding').forEach(content => {
							content.name.then( contentName => {
								if (!object || contentName === name) {
									doLog("found object", name)
									if (count) {
										if( --count ) // do run on count to 0
											return;
										run = true;
									}
									if (run) {
										//doLog("on and so key is ", location+",holding", name)
										var r = callback(content, contentName, location + ",holding", src.splice(1));
										if( r === false ) count++;
										if (r) awaitList.push(r);
										run = all;
									}
								}
							})
						})
					})
				})
			}
		}
		//doLog( "Simple object lookup; return promise in getObjects()");
		return new Promise((res) => {
			//var command = src.break();
			entity.nearObjects.then(checkList => {
				var names = [];
				checkList.forEach(function (value, location) {
					// holding, contains, near
					//doLog("checking key:", run, location, value)
					if (!value) return;
					value.forEach(function (value, member) {
						//doLog( "has value" );
						names.push(value.name.then(name => ({ e: value, l: location, name: name })));
						//doLog( "Pushed a name as a promise");
					})
				});
				Promise.all(names).then(names => {
					//console.log( "Check list:", names );
					names.forEach((check, i) => {
						if (!run) return;
						if (check.e === me) return;
						//console.log( "...", count, run, check.name, name, !object )
						if (!object || check.name === name) {
							//doLog( "found object", value.name, count )
							if (count) {
								if( --count ){ // 1. and 0. are the same object...{
									//console.log( "Failing on count" );
									return;
								}
								run = true;
							}
							if (run) {
								//doLog("N and so key is ", check.l, check.name )
								var r = callback(check.e, check.name, check.l, src && src.splice(1));
								//console.log( "Back from callback..." );
								if( r === false )
									count++;
								if (r instanceof Promise ) awaitList.push(r);
								run = all; // if not all, then no more.
							}
						}
					})
					callback(null, null, []);
					Promise.all(awaitList).then(res)
				})
			})
		})
	}

	, clearTimeout(timerObj) {
		if (!timerObj.dispatched) return; // don't remove a timer that's already been dispatched
		if (timerObj.next) timerObj.next.pred = timerObj.pred;
		if (timerObj.pred) timerObj.pred.next = timerObj.next; else _timers = timerObj.next;
	}
	, clearImmediate: null
	, clearInterval: null
	, JSOX: JSOX
};


function finishFill(sandbox) {

	sandbox.clearImmediate = sandbox.clearTimeout;
	sandbox.clearInterval = sandbox.clearInterval;

	var u8xor = require("./util/u8xor.js")

	sandbox.permissions = {};
	sandbox.idGen.u8xor = u8xor;
	sandbox.idGen.xor = null;//entity.idMan.xor;
	sandbox.config = {};
	sandbox.config.run = { Λ: null };


	//entity.idMan.ID( entity.idMan.localAuthKey, o.created_by.Λ, (id)=>{ sandbox.config.run.Λ = id.Λ } );
	//sandbox.require=  sandboxRequire.bind(sandbox);
	sandbox.require.resolve = function (path) {
		//_debug_requires && 
		_debug_requires && doLog("SANDBOX:", sandbox.module.paths, codeStack, path)
		var tmp;
		if (sandbox.module.paths[sandbox.module.paths.length - 1])
			tmp = sandbox.module.paths[sandbox.module.paths.length - 1] + "/" + path;
		else
			tmp = path;
		tmp = tmp.replace(/^\.[/\\]/, '');
		//doLog( "tmp:", tmp );
		tmp = tmp.replace(/[/\\]\.[/\\]/, '/');
		var newTmp;
		//doLog( "tmp:", tmp );
		while ((newTmp = tmp.replace(/[/\\][^/\\\.]*[/\\]\.\.[/\\]/, '/')) !== tmp) {
			tmp = newTmp;
		}
		//doLog( "tmp:", tmp );
		tmp = tmp.replace(/[^/\\]*[/\\]\.\.$/, '');
		_debug_requires && doLog("Resolved path:", tmp);
		return tmp;
		//return (async () => { return await e.post("resolve",...args); })(); 
	};// sandboxRequireResolve.bind( sandbox );
	sandbox.global = sandbox;
	sandbox.addListener = sandbox.on;
	sandbox.removeListener = sandbox.off;
	sandbox.removeAllListeners = (name) => {
		Object.keys(sandbox.events).forEach(event => delete sandbox.events[event]);
	}
	sandbox.io.addInterface = (a, b, c) => addDriver(self, a, b, c);

	function addDriver(o, name, iName, iface) {
		var driver = drivers.find(d => d.name === name);
		if (driver) {
			doLog("have to emit completed...")
		}
		var caller = (driver && driver.iface) || {};
		var keys = Object.keys(iface);
		if (remotes.get(o)) {
			keys.forEach(key => {
				caller[key] = function (...argsIn) {
					var args = "";
					var last = argsIn[argsIn.length - 1];
					argsIn.forEach(arg => {
						if (arg === last) return; // don't pass the last arg, that's for me.
						if (args.length) args += ",";
						args += JSOX.stringify(arg)
					})
					entity.idMan.ID(o.Λ, me, (id) => {
						var pending = { id: id, op: "driver", driver: name, data: { type: "driverMethod", method: key, args: args } }
						o.child.send(pending);
						childPendingMessages.set(id, pending)
					})
				}
			})
		}
		else
			keys.forEach(key => {
				var constPart = `{
                    ${iName}[${key}](`;
				caller[key] = function (...argsIn) {
					var args = "";
					var last = argsIn[argsIn.length - 1];
					argsIn.forEach(arg => {
						if (arg == last) return; // don't pass the last arg, that's for me.
						if (args.length) args += ",";
						args += JSOX.stringify(arg)
					})
					if ("function" == typeof last) {
						o.sandbox._driverDb = last;
						args += ",_driverCb)";
					}
					else
						args += JSOX.stringify(last) + ")";
					// this should not be replayed ever; it's a very dynamic process...
					//scripts.push( { type:"driverMethod", code:constPart + args } );
					vmric(constPart + args, sandbox)
				}
			})
		doLog("adding object driver", name)
		drivers.push({ name: name, iName: iName, orig: iface, iface: caller, object: o });
		return driver; // return old driver, not the new one...
	}



	/* Seal Sandbox */
	["JSOX", "events", "crypto", "_module", "console", "Buffer", "require", "process", "fs", "vm"].forEach(key => {
		if (key in sandbox)
			Object.defineProperty(sandbox, key, { enumerable: false, writable: true, configurable: false });
	});



	const volOverride = `(function(vfs, dataRoot) {
	vfs.mkdir = vfs.Volume.mkdir;
	vfs.Volume = (function (orig) {
		// entities that want to use the VFS will have to be relocated to their local path
		return function (name, path, v, a, b) {
			//console.log("what's config?", config);
			if( name === undefined ) 
				return orig();
			var privatePath = dataRoot + "/" + config.run.Λ + "/" + path;
			//console.log("Volume overrride called with : ", name, dataRoot + "/" + config.run.Λ + "/" + path, orig);
			//console.log("Volume overrride called with : ", a, b );
			try {
				return orig(name, privatePath, v, a, b);
			} catch(err) {
				console.log( "limp along?" );
			}
		}
	})(vfs.Volume);
	var tmp = vfs.Sqlite.op;

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
					console.log( "Make directory for sqlite?", pathPart, privatePath )
					vfs.mkdir( pathPart );
				}
				console.log("Sqlite overrride called with : ", dataRoot + "/" + config.run.Λ + "/" + path);
				try {
					return orig( privatePath );
				} catch(err) {
					console.log( "limp along?", err );
				}
			}
			else return orig( path );
		}
	})(vfs.Sqlite);
	vfs.Sqlite.op = tmp;
})`
}

finishFill(fillSandbox);


Object.getOwnPropertyNames(fillSandbox).forEach(function (prop) {
	var descriptor = Object.getOwnPropertyDescriptor(fillSandbox, prop);
	Object.defineProperty(this, prop, descriptor);
});

//Object.getOwnPropertyNames( { get n() { console.log( "North.");}} ).forEach(function (prop) {
	//Object.defineProperty(this, prop,  Object.getOwnPropertyDescriptor(global, prop));
//});

//process.on("uncaughtException",(e)=>{
//    process.stdout.write( e.toString() );
//})
coreThreadEventer.postMessage({ op: 'initDone' });
coreThreadEventer.on("message", processMessage);
