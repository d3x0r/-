// 250 = default timeout 


module.exports = exports = makeEVR

var _events; // global events on all EVR 

makeEVR.on = (a, b) => { handleEvents(_events, a, b) };
makeEVR.once = (a, b) => { handleEvent(_events, a, b) };
makeEVR.emit = (a, b) => {
	emitEvents(_events, a, b);
}
makeEVR.addLocalStorage = addLocalStorage;
makeEVR.addRemoteStorage = addRemoteStorage;
//makeEVR.

var rng = require('../salty_random_generator.js').SaltyRNG((salt) => { salt.length = 0; salt.push(Date.now()) });

//const charset = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_";
const charset = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f", "g"
	, "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x"
	, "y", "z", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O"
	, "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "$", "_"];

function makeKey() {
	var res = "";
	for (var n = 0; n < 20; n++) {
		res += charset[rng.getBits(6, false)];
	}
	return res;
}

var localDrivers = [];
var remoteDrivers = [];
var localDriversDirect = [];
var remoteDriversDirect = [];
var evrMaps = [];


function makeEVR(opts) {

	//var evr = new newEVR();
	if (this.constructor !== makeEVR) return new makeEVR();
	var evr = this;

	this.objectMap = new WeakMap();
	this.graph = new Map();
	this.opts = opts || {};
	this._events = {};
		


	evrMaps.push(evr);
	emitDriverEvent("init", evr)

	function makeObjectLink(text, parent, child) {
		if (this.constructor !== makeObjectLink) return new makeObjectLink(text, parent, child);

		this.text = text;
		this.parent = parent;
		this.child = child;
		this.tick = 0;
		this.opts = {};
	}

	evr.makeObjectProperty = makeObjectProperty;
	evr.driverEmit = emitDriverEvent;
	Object.defineProperty(makeObjectLink.prototype, "key", { get() { return this.child.key } });
	Object.defineProperty(makeObjectLink.prototype, "isEmpty", { get() { return this.child.isEmpty } });
	Object.defineProperty(makeObjectLink.prototype, "tick", {
		get() { return this.child.tick },
		set(val) { this.child.tick = val }
	});
	Object.defineProperty(makeObjectLink.prototype, "value", { get() { return this.child.value } });

	makeObjectLink.prototype.toString = function () { return "LINK from:" + this.parent + " called " + this.text + " to " + this.child; };
	makeObjectLink.prototype.path = function (path) { return this.child.path(path) };
	makeObjectLink.prototype.get = function (path, key) { return this.child.get(path, key); };
	makeObjectLink.prototype.not = function (cb) { this.child.not(cb); return this; };
	//getProp(name,value) { this.child.getProp(name,value); return this; },
	makeObjectLink.prototype.put = function (obj) {
		if (obj.constructor === makeObjectLink) {
			console.log("a it's a link....", obj.toString())
			var oldChild = this.child;
			this.child = obj.child;
			emitDriverEvent("replace", evr, this.parent, oldChild, obj);
			this.parent.maps.forEach((cb) => cb(this.child._, this.text, obj.child));
		}
		else if (obj.constructor === makeObject) {
			console.log("a it's a node....")
			var oldChild = this.child;
			this.child = obj;
			emitDriverEvent("replace", evr, this.parent, oldChild, obj);
			this.parent.maps.forEach((cb) => cb(this.child._, this.text, obj));

		} else {
			//console.log( "GOT PASSED AN OBJECT TO PARSE????", obj )
			this.child.put(obj);
		}
		return this;
	};
	makeObjectLink.prototype.map = function (cb) { this.child.map(cb); return this; };
	makeObjectLink.prototype.on = function (cb) { this.child.on(cb); return this; };


	function makeGuide() {
		var g = {
			get key() { throw new Error("'key' on a delay resolving map is not supported") },
			get isEmpty() {
				this.script.push({ f: "isEmpty" });
				return this;
			},
			path(path) {
				this.script.push({ f: "path", args: [path, path.split(".")] });
				return this;
			},
			get(path, key) {
				this.script.push({ f: "get", args: [path, key, parts] });
				return this;
			},
			not(cb) {
				this.script.push({ f: "not", args: [cb] });
				return this;
			},
			put(obj, cb) {
				this.script.push({ f: "put", args: [obj, cb] });
				return this;
			},
			map(cb, opt) {
				this.script.push({ f: "map", args: [cb, opt] });
				return this;
			},
			on(cb) {
				this.script.push({ f: "on", args: [cb] });
				return this;
			},
			get tick() { throw new Error( "'tick' on a delay resolving map is not supported") },
			set tick( val ) { throw new Error( "'tick' on a delay resolving map is not supported") },
			get value() { throw new Error( "'value' on a delay resolving map is not supported") },
			run( newLink ) {
				// trim useless tail statements...
				
				// returns sandbox that were put on the newLink
				if( this.script.length > 0 )
					return runVm( new Sandbox( guide, null ), newLink )
			},
			firstRun: true,
			script: [],
		};
		//g.map(); // push the first map into the script too.
		return g;
	}


	function runVmOnObjectMembers(sandbox, o) {

		Object.keys(o.members).forEach(member => {
			var link = o.members[member];
			var newSandbox = runVm( sandbox, link );
			if( newSandbox ) {
				// link should already have this sandbox.
				sandbox.branches.push( newSandbox );
			}
		})
		Object.keys(o.fields).forEach(member => {
			var f = o.fields[member];
			var newSandbox = runVm( sandbox, f );
			if( newSandbox ) {
				// link should already have this sandbox.
				sandbox.branches.push( newSandbox );
			}
		})
	}

	function Sandbox( guide, oldSandbox ) {
		if( this.constructor !== Sandbox ) return new Sandbox( guide, oldSandbox );

		this.guide = guide;

		this.statementSandbox = {};
		this.nodeSandbox = {}; // scratch space for this state
		this.priorSandbox = oldSandbox;
		this.priorOn = oldSandbox.thisOn; // the previous On returned a value, and this will be it... 

		this.thisOn = oldSandbox.thisOn; // this has to be copied, if this is an On, this will get updated....

		if( oldSandbox ) {
			this.chainSandbox = oldSandbox.chainSandbox;
			this.stmt = guide.script[this.ip = oldSandbox.ip+1];
			this.ip = oldSandbox.ip+1;
			this.part = 0;
		} else {
			this.chainSandbox = {};
			this.stmt = guide.script[this.ip = 0];
			this.part = 0;
		}
		this.emitted = false;
		this.branches = [];

	}
	Sandbox.prototype.run = function(newLink) { 
		return runVm( this, newLink ); 
	};
	Sandbox.prototype.isOnRun = function(newLink) { 
		if( stmt.f === "on" ) {
			return runVm( this, newLink ); 
		}
	};

	function runVm( sandbox, o ) {
		var guide = sandbox.guide;
		if (guide.firstRun) {
			// first run, the o passed is the root object
			// for which we need to do an initial scan of that object
			// with an implied root; later, the object will be 
			// the new link or property in this root object...
			guide.firstRun = false;
			runVmOnObjectMembers(sandbox, o);
			return;
		}
		var ip = sandbox.ip;

		//console.trace( "sandbox:", sandbox, o )
		while( ip < guide.script.length ) {
			var stmt = guide.script[ip];
			//console.log( "Doing statement:", stmt, o )
			if (stmt.f === "path") {
				var part = sandbox.part || 0;
				
				if( stmt.args[1][part] in o.child.members ) {
				        outSandbox = new Sandbox( guide, sandbox );
					//console.log( "Path part found in members" );
					if ((part + 1) < stmt.args[1].length) {
						//console.log( "next child now has a new sandbox..." );
						outSandbox.part = part + 1;
						outSandbox.ip = sandbox.ip; // stay on this same node; check next part
						outSandbox.stmt = stmt;
						//return runVm( outSandbox, o );
					}
					o.child.guideContexts.push(outSandbox);
					runVmOnObjectMembers(outSandbox, o.child);
				}
				else {
					console.log("path part was not found...(yet)");
					outSandbox = undefined;
				}
			}
			else if (stmt.f === "get") {
				if (stmt.args[0] in o.child.members) {
					o.child.guideContexts.push(outSandbox);
					runVmOnObjectMembers(outSandbox, o.child);
				}
				else if (stmt.args[0] in o.fields) {

				}
				else
					outSandbox = undefined;
			}
			else if (stmt.f === "map") {
				var valProto = Object.getPrototypeOf(o);
				if (valProto.constructor === makeObjectLink) {
					if (stmt.args[0])
						o.map(stmt.args[0]);
					o.child.guideContexts.push(outSandbox);
					runVmOnObjectMembers(outSandbox, o.child)
				} else if (valProto.constructor === makeObject) {
					if (stmt.args[0])
						o.map(stmt.args[0]);
					o.guideContexts.push(outSandbox);
					runVmOnObjectMembers(outSandbox, o)
				} else if (valProto.constructor === makeObjectProperty) {

				}
			}
			else if (stmt.f === "put") {
				var val;
				if (typeof (val = args[0]) === "object") {
					var valProto = Object.getPrototypeOf(val);
					if (valProto.constructor === makeObjectLink) {
						parseObject(val, o.child);
					} else if (valProto.constructor === makeObject) {
						parseObject(val, o);
					} else if (valProto.constructor === makeObjectProperty) {
						throw new Error("Still cannot change a property into a object..." + dumpContext(sandbox));
					}
				} else {

				}
			}
			else if (stmt.f === "on") {
				//console.log( "on called with a ")				
				console.log( "Calling 'on' with", o );
				//if( !sandbox.priorOnSandbox ) {
				//	var prior = sandbox; while( prior ) { if( prior.stmt.f === "on" ) break; prior = prior.priorSandbox };
				//	sandbox.priorOnSandbox = prior;
				//}
				sandbox.thisOn = stmt.args[0]( o.value, o.text, sandbox.priorOn )
			}
			else if (stmt.f === "not") {
				// not can change the context; mostly it just updates the IP.
				if (localDrivers.length || remoteDrivers.length) {
					emitAbortableDriverEvent("timeout", "cancelTimeout", evr, o, cbNot);
					if (this.opts.emitNot)
						cbNot(this.key, (newSandbox) => {
							// emit( "updateParent")
							if (newSandbox.guide === sandbox.guide) {
								Object.assign(sandbox, newSandbox);
								return runVm(newSandbox, o);
							} else
								throw new Error("invalid sandbox for this chain.");
						});
				} else {
					if (this.isEmpty)
						cbNot(this.key, (newSandbox) => {
							if (newSandbox.guide === sandbox.guide)
								Object.assign(sandbox, newSandbox);
							else
								throw new Error("invalid sandbox for this chain.");
						});
				}

			}

			return outSandbox;
		} // else this sandbox cannot run, it has no instructruction, and was added to no node...
	}


	function makeObject(p, key) {
		if (this.constructor !== makeObject) {
			var o = evr.graph.get(key);
			if (o) return o;
			return new makeObject(p, key);
		}
		if (!key) { key = p; p = null; }

		//console.trace( "Makeing object:", key )
		//if( !p ) console.log( "Making root:", key );
		//else console.log( "Making sub in:", p.key, key );

		var o = evr.graph.get(key);
		if (o) // this would have been called as a constructor, and 'this' should be something else....
			throw new Error("Object already exists; cannot create a new one.", key);

		o = this;
		this._ = {}; // this is this object that this node represents
		this.key = key;
		this.fields = {};  // these are property members of this object (tick,value...)
		this.members = {};  // these are object members of this object.
		this.opts = {// a state space drivers use for their state data on this node.
			emitNot: true // node local option indicating it is new and empty
		},
			this.maps = [];
		this.guides = []; // maps that will apply later...
		this.guideContexts = []; // maps that will apply later... partially resolved states

		this._tick = 0;

		//console.log( "protos:", Object.keys( nodeProto ) )

		evr.graph.set(key, this);
		evr.objectMap.set(this._, this);

		// ask drivers to read this; 
		// at this point one of several things can happen
		//  1) an immediate data driver will populate this node with its properties and it's member objects
		//	(and all their properties?)
		//  2) a delayed driver will setup to ask if someone knows about this path
		//	after some time, the other side will write into this node....
		//
		//  .not can be used to allow the delay of 2 to come back.
		//  3) there's no drivers, and this is done.
		emitDriverEvent("initNode", evr, o, p);

		if (!p) {
			emitDriverEvent("read", evr, o);
		} else {
			p.guides.forEach(guide => {
				var context = guide.run(o);
				if (context)
					o.guideContexts.push(context);
			})
		}
		return o;

		function getProperty(o, name, initialValue) {
			var p = o.fields[name];
			if (!p) {
				if (o.members[name])
					throw new Error("Property already exists as an object; replacing an object with a value is not allowed." + "existing object:" + this.members[name]);
				return makeObjectProperty(o, name, initialValue);
			}
			return p;
		}
	}

	function makeObjectProperty(node, field, initial) {
		if (this.constructor !== makeObjectProperty) {
			var o = node.fields[field];
			if (o) return o;
			if (initial !== undefined)
				return new makeObjectProperty(node, field, initial);
			return undefined;
		}

		var o = node.fields;
		var f = this;
		if (initial) {
			this.node = node;
			this.text = field;
			this.value = initial;
			this.tick = Date.now();
			this.opts = {};

			node.fields[field] = f;

			Object.defineProperty(node._, field, {
				get: function () { return o[field].value; },
				set: function (val) { f.update(val, Date.now()) },
				enumerable: true,
				configurable: false,
			});

			// drivers may commit initial value here... initField allows different operations
			// than a normal 'write' from above, which can count on already being initliazed.

			emitDriverEvent("initField", evr, node, f);
			// dispatch changed value to map.

			f.node.guideContexts.forEach(context => {
				var newContext = context.run(f)
			});
			//f.node.maps.forEach( (cb)=>cb( f.value, f.text ) );
		}

		return f;
	}
	makeObjectProperty.prototype.update = function (val, tick) {
		if (tick > this.tick) {
			this.value = val;
			this.tick = tick;
			emitDriverEvent("write", evr, o, this);
			this.node.guideContexts.forEach(context => {
				var newsandbox = context.isOnRun(this);
				// replace this sandbox?
			});
			//f.node.maps.forEach( (cb)=>cb( f.value, f.text ) );
		}
	}
	Object.defineProperty(makeObjectProperty.prototype, "key", { get() { throw new Error("properties are not root elements; 'key' is not supported.") } });
	makeObjectProperty.prototype.path = function () { throw new Error("values do not have paths."); }
	makeObjectProperty.prototype.get = function () { throw new Error("values are terminal"); }
	makeObjectProperty.prototype.map = function () { throw new Error("fields cannot be mapped; try .value instead"); }
	makeObjectProperty.prototype.not = function (cb) { if (this.value === undefined) cb(); }
	makeObjectProperty.prototype.on = function (cb) { cb(this.value, this.text) }
	makeObjectProperty.prototype.toString = function () {
		return "FIELD " + this.text + "=" + this.value + "  @" + this.tick;
	}
	makeObjectProperty.prototype.put = function (val) {
		if (typeof value === "object") {
			throw new Error("For now properties cannot turn into objects...");
		}
		else {
			update(val, Date.now());
		}
	}

	function parseObject(obj, into) {
		//console.log( "parse:", obj );
		var keys = Object.keys(obj);
		keys.forEach((key) => {
			var val = obj[key];
			var valProto = Object.getPrototypeOf(val);
			if (typeof val === "object") {
				if (valProto.constructor === makeObjectLink) {
					var target = into.members[key];
					if (!target) {
						target = into.fields[key];
						if (!target) {
							oLink = makeObjectLink(key, into, val.child);
							into.members[key] = oLink;
							into._[key] = val.child._;
							into.maps.forEach((cb) => cb(into._[key], key, obj));
							// commit this member into the object for everyone else...
							emitDriverEvent("initLink", evr, oLink);
							emitDriverEvent("read", evr, oLink);
							return; // return is only forEach() continue

						}
					}
					console.log("b it's a link....", val.toString())
					var oldChild = target.child;
					target.child = val.child;
					emitDriverEvent("replace", evr, target.parent, oldChild, obj);
					into.maps.forEach((cb) => cb(into._[key], key, obj.child));
				}
				else if (valProto.constructor === makeObject) {
					var target = into.members[key];
					if (!target) {
						target = into.fields[key];
						if (!target) {
							oLink = makeObjectLink(key, into, val);
							into.members[key] = oLink;
							into._[key] = val._;
							into.maps.forEach((cb) => cb(into._[key], key, obj));
							// commit this member into the object for everyone else...
							emitDriverEvent("initLink", evr, oLink);
							emitDriverEvent("read", evr, oLink);
							return; // return is only forEach() continue
						}
					}
					//console.log( "This proto:",Object.getPrototypeOf( target ).constructor )
					if (Object.getPrototypeOf(target).constructor === makeObject) {
						throw new Error("cannot immediatel substitute one object for another...")
					} else if (Object.getPrototypeOf(target).constructor === makeObjectLink) {
						console.log(" b it's a node.... into a node link", valProto)
						var oldChild = this.child;
						this.child = val;
						emitDriverEvent("replace", evr, this.parent, oldChild, obj);
						into.maps.forEach((cb) => cb(into._[key], key, obj));
					}
					else
						throw new Error("THis never happens.")
				} else {
					//console.log( "GOT PASSED AN OBJECT TO PARSE????", obj )
					// makeObject may return an existing object....
					// but a new link is created...
					var newObj;
					if (!(newObj = into.members[key])) {
						newObj = makeObject(into, makeKey());
						oLink = makeObjectLink(key, into, newObj);
						into.members[key] = oLink;
						into._[key] = newObj._;
						into.maps.forEach((cb) => cb(into._[key], key, obj));
						// commit this member into the object for everyone else...
						emitDriverEvent("initLink", evr, oLink);
						emitDriverEvent("read", evr, oLink);
					} else {
						newObj = into.members[key].child;
					}
					// otherwise this link already existed...

					//console.log( "so there's a core object out there, now write this?")


					//console.log( "parse : ", obj[key], "INTO", newObj )
					parseObject(obj[key], newObj);
				}
			}
			else {
				var field = into.fields[key];
				if (!field) {
					if (into.members[key])
						throw new Error("Property already exists as an object; replacing an object with a value is not allowed." + "existing object:" + this.members[name]);
					return makeObjectProperty(into, key, obj[key]);
				}
				//var field = getProperty( into, key, obj[key] );
			}

		});
	}


	makeObject.prototype.toString = function () {
		return "OBJECT " + this.key + "{" + Object.keys(this.members).join(",") + "}  {" + Object.keys(this.fields).join(",") + "}";
	}
	Object.defineProperty(makeObject.prototype, "isEmpty", {
		get() {
			return (Object.keys(this._).length === 0);
		}
	});
	Object.defineProperty(makeObject.prototype, "tick", {
		set(val) {
			if (val > this._tick) this._tick = val;
			emitDriverEvent("write", evr, this);
		},
		get() {
			return this._tick;
		}
	});
	Object.defineProperty(makeObject.prototype, "value", {
		get() {
			return this._;
		}
	});

	makeObject.prototype.path = function (name) {
		var parts = name.split(".");
		var n = this;
		console.log(" GET path(", name, ")")
		parts.forEach(function (part, nPart) {
			n = n.get(part);
			if (!n && (nPart === parts.length - 1)) {
				var p = getProperty(this, part, undefined)
				console.log("I dunno; I hope you know it's a field not a node?  Both have 'value'")
				return p;
			}
		});
		return n;
	};
	makeObject.prototype.get = function (name, key) {
		if (typeof name === "object") {
			return evr.objectMap(name);
		}
		var o = null;
		//var fLink = this.fields[name];
		//	if( fLink ) return fLink;
		var oLink = this.members[name];
		//console.log( "Get " , name  );
		if (!oLink) {
			if (this.fields[name])
				throw new Error("Path already exists as a property; replacing a value with an object is not allowed.\n" + "existing field:" + this.fields[name]);
			// this key is subject to change
			// the initial state of "added" allows this key to be overwritten by a driver
			//console.log( "Creating a new member with", name )
			oLink = new makeObjectLink(name, this, makeObject(this, key || makeKey()));
			this.members[name] = oLink;
			this._[name] = oLink.child._;

			this.maps.forEach((cb) => cb(this._[name], name, oLink));

			emitDriverEvent("initLink", evr, oLink);
			emitDriverEvent("read", evr, oLink);
		}
		else {
			//console.log( "need to return a new link to this object with this as a parent.", name );
			//oLink = makeObjectLink( name, this, oLink.child );
		}
		return oLink;
	};
	makeObject.prototype.not = function (cbNot) {
		if (localDrivers.length || remoteDrivers.length) {
			emitAbortableDriverEvent("timeout", "cancelTimeout", evr, this, cbNot);
			if (this.opts.emitNot)
				cbNot(this.key, (sandbox) => {
					// emit( "updateParent")
				});
		} else {
			if (this.isEmpty)
				cbNot(this.key, (sandbox) => {
					// emit( "updateParent")
				});
		}
		return this;
	};
	/*
	getProp(name,initialValue) {
		var p = this.fields[name];
		if( !p ) {
			if( this.members[name] )
				throw new Error( "Property already exists as an object; replacing an object with a value is not allowed."+"existing object:" + this.members[name] );
			return makeObjectProperty( this, name, initialValue ); 
		}
		return p;
	},
	*/
	makeObject.prototype.put = function (obj) {
		if (typeof obj === "object") {
			parseObject(obj, this);
		} else {
			var fLink = this.fields[name];
			if (fLink) {
				fLink.update(obj, Date.now());
			}
		}
		return this;
	};
	makeObject.prototype.map = function (cb) {
		if (!cb) {
			var guide = makeGuide();
			this.guides.push(guide);
			var obj = this;
			//console.trace( "made object?:", obj );
			setImmediate(function () {
				var sandbox = guide.run(obj);
				// runs once, creates a sandbox for this node
				if (sandbox)
					obj.guideContexts.push(sandbox);
			});
			return guide;
		} else {
			this.map().on(cb);
			emitDriverEvent("onMap", evr, this);
		}
		return this;
	};
	makeObject.prototype.on = function (cb) {
		this.map().on(cb);
	};

	makeEVR.prototype.get = function (n) {
		if (typeof n === "object") {
			return this.objectMap.get(n);
		}
		return makeObject(null, n);
	};
	return evr;
}


function validateDriver( d ) {
	var methods = ["init","updateKey","initNode","initLink","read","initField","write","onMap","timeout","cancalTimeout"];
	methods.forEach( m=>{ if( !(m in d) ) d[m] = ()=>0 } );
}

function addLocalStorage(cb) {
	if( typeof cb === "function" ) {
		localDrivers.push(cb);
		// for all existing evr, allow the driver to initialize for it.
		evrMaps.forEach((evr) => {
			cb("init", evr);
		});
	} else {
		validateDriver(cb);
		localDriversDirect.push(cb);
		evrMaps.forEach((evr) => {
			cb.init(evr);
		});
	}
}


function addRemoteStorage(cb) {
	if( typeof cb === "function" ) {
		remoteDrivers.push(cb);
		// for all existing evr, allow the driver to initialize for it.
		evrMaps.forEach((evr) => {
			cb("init", evr);
		});
	} else {
		validateDriver(cb);
		remoteDriversDirect.push(cb);
		evrMaps.forEach((evr) => {
			cb.init(evr);
		});
	}
}


makeEVR.prototype.on = function (a, b) { handleEvents(this._events, a, b) };
makeEVR.prototype.emit = function (a, b) { emitEvents(this._events, this, a, b) };
makeEVR.prototype.once = function (a, b) { handleEvent(this._events, a, b) };



function handleEvent(_events, event, cb) {
	var z = _events[event] = _events[event] || [];
	var ev;
	z.push(ev = { once: true, cb: cb, off() { this.cb = null } });
	return ev;
}

function handleEvents(_events, event, cb) {
	var z = _events[event] = _events[event] || [];
	var event;
	z.push(ev = { once: false, cb: cb, off() { this.cb = null } });
	return ev;

}

function emitEvents(_events, event, evr, data) {
	var doEvent = _events[event];
	//console.trace( "emit with", data );
	if (doEvent) {
		doEvent.forEach((cb) => { if (cb.cb) { cb.cb(evr, data); if (cb.once) cb.cb = null; }});
	}
}

function emitDriverEvent(op,...args) {
	localDrivers.forEach((cb) => cb(op,...args));
	localDriversDirect.forEach((cb) => cb[op](...args));
	remoteDrivers.forEach((cb) => cb(op,...args));
	remoteDriversDirect.forEach((cb) => cb[op](...args));
}

function emitAbortableDriverEvent(initial, abort, ...args) {
	var n;
	if ((n = localDrivers.findIndex((cb) => cb(initial, ...args))) >= 0) {
		//console.log( "a abortable driver stopped at ", n );
		for (var d = 0; d < n; d++)
			localDrivers[d].cb(abort, ...args)
	} else if ((n = localDriversDirect.findIndex((cb) => cb[initial](...args))) >= 0) {
		//console.log( "a abortable driver stopped at ", n );
		localDrivers.forEach(cb => cb.cb(abort, ...args))
		for (var d = 0; d < n; d++)
			localDriversDirect[d].cb[abort](...args)
	} else if ((n = remoteDrivers.findIndex((cb) => cb(initial, ...args))) >= 0) {
		//console.log( "b abortable driver stopped at ", n );
		localDrivers.forEach(cb => cb.cb(abort, ...args))
		localDriversDirect.forEach(cb => cb.cb[abort]( ...args))
		for (var d = 0; d < n; d++)
			remoteDrivers[d].cb(abort, ...args)
	} else if ((n = remoteDriversDirect.findIndex((cb) => cb[initial](...args))) >= 0) {
		//console.log( "b abortable driver stopped at ", n );
		localDrivers.forEach(cb => cb.cb(abort, ...args))
		localDriversDirect.forEach(cb => cb.cb[abort](...args))
		remoteDrivers.forEach(cb => cb.cb(abort, ...args))
		for (var d = 0; d < n; d++)
			remoteDriversDirect[d].cb[abort]( ...args)
	}
	//console.log( "c abortable driver stopped at ", n );

}


