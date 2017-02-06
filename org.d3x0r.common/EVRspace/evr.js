// 250 = default timeout 


module.exports=exports=makeEVR

makeEVR.on = (a,b)=>{ handleEvents(_events,a,b) } ;
makeEVR.once = handleEvent;
makeEVR.emit = emitEvents;
makeEVR.addLocalStorage = addLocalStorage;
makeEVR.addRemoteStorage = addRemoteStorage;
//makeEVR.

var rng = require( '../salty_random_generator.js' ).SaltyRNG( (salt)=>{ salt.length = 0; salt.push( Date.now() ) } );

//const charset = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_";
const charset = ["0","1","2","3","4","5","6","7","8","9","a","b","c","d","e","f","g"
		,"h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x"
				,"y","z","A","B","C","D","E","F","G","H","I","J","K","L","M","N","O"
				,"P","Q","R","S","T","U","V","W","X","Y","Z","-","_"];

function  makeKey() {
	var res = "";
		for( var n = 0; n < 20; n++ )	{
			res += charset[rng.getBits( 6, false )];
		}
		return res;
}

var localDrivers = [];
var remoteDrivers = [];
var evrMaps = [];


function makeEVR( opts ) {
		
	//var evr = new newEVR();
	if( this.constructor !== makeEVR ) return new makeEVR();
	var evr = this;

	this.objectMap = new WeakMap();
	this.graph = new Map();
	this.opts = opts || {},
	this._events = {};
		

	evrMaps.push( evr );
	emitDriverEvent( "init", evr )

	function makeObjectLink( text, parent, child ) {
		if( this.constructor !== makeObjectLink ) return new makeObjectLink( text, parent,child);

		Object.assign(this, {
			text : text,
			get key() { return this.child.key },
			get isEmpty() { return this.child.isEmpty },
			path(path) { return this.child.path(path) },
			get(path,key) { return this.child.get(path,key); },
			not(cb) { this.child.not(cb); return this; },
			//getProp(name,value) { this.child.getProp(name,value); return this; },
			put(obj) { 
				if( obj.constructor === makeObjectLink ) {
					console.log( "it's a link....", obj )
					var oldChild = this.child;
					this.child = obj.child;
					emitDriverEvent( "replace", evr, this.parent, oldChild, obj );
					this.parent.maps.forEach( (cb)=>cb( o._, this.text, obj.child ) );
				}
				else if( obj.constructor === makeObject ) {
					console.log( "it's a node....")
					var oldChild = this.child;
					this.child = obj;
					emitDriverEvent( "replace", evr, this.parent, oldChild, obj );
					this.parent.maps.forEach( (cb)=>cb( o._, this.text, obj ) );
					
				} else {
					//console.log( "GOT PASSED AN OBJECT TO PARSE????", obj )
					this.child.put( obj );
				}
				return this;
			},
			map(cb) { this.child.map(cb); return this; },
			on(cb) { this.child.on(cb); return this; },
			get tick() { return this.child.tick },
			set tick( val ) { this.child.tick = val },
			get value() { return this.child.value },

			parent : parent,
			child: child,
			tick: 0,
			opts : {},
		} );

	}

	function makeGuide(  ) {
		return {
			get key() { throw new Error( "'key' on a delay resolving map is not supported") },
			get isEmpty() { 
				this.script.push( { f : "isEmpty" } );
				return this;
			},
			path(path) { 
				this.script.push( { f : "path", args:[path,path.split("." )] } );
				return this;
			},
			get(path,key) { 
				this.script.push( { f : "get", args:[path,key, parts] } );
				return this;
			},
			not(cb) { 
				this.script.push( { f : "not", args:[cb] } );
				return this;
			},
			put(obj) { 
				this.script.push( { f : "put", args:[obj] } );
				return this;
			},
			map(cb) { 
				this.script.push( { f : "map", args:[cb] } );
				return this;
			},
			on(cb) {
				this.script.push( { f : "on", args:[cb] } );
				return this;
			},
			get tick() { throw new Error( "'tick' on a delay resolving map is not supported") },
			set tick( val ) { throw new Error( "'tick' on a delay resolving map is not supported") },
			get value() { throw new Error( "'value' on a delay resolving map is not supported") },
			run( newLink ) {
				runVm( { guide:this, ip:0 }, newLink )
			},
			script : [],
		};
	}


function runVm( sandbox, o ) {
	var guide = sandbox.guide;
	console.log( "sandbox:", sandbox, o )
	if( sandbox.ip < guide.script.length ) {
		var stmt = guide.script[sandbox.ip];
		var outSandbox = { 
			guide : guide,
			ip : sandbox.ip+1,
			run(newLink) { return runVm( outSandbox, newLInk ); }
		};
		if( stmt.f === "path") {
			var part = sandbox.part || 0;
			if( o.text === stmt.args[1][part] ) {
				if( (part+1) < stmt.args[1].length ) {
					outSandbox.part = part+1;
					outSandbox.ip = sandbox.ip; // stay on this same node; check next part
					//return runVm( outSandbox, o );
				}
			}
			else
				outSandbox = undefined;
		}
		else if( stmt.f === "get") {
			if( o.text === stmt.args[0] ) {
				// just allow stepping closer
			}
			else
				outSandbox = undefined;
		}
		else if( stmt.f === "map") {
			var valProto = Object.getPrototypeOf( o );
			if( valProto.constructor === makeObjectLink ){

			} else if( valProto.constructor === makeObject ) {
				if( stmt.args[0] )
					o.map( stmt.args[0] );
				else
					o.guideContexts.push( outSandbox );
			} else if( valProto.constructor === makeObjectProperty ) {

			}
		}
		else if( stmt.f === "put") {
			var val;
			if( typeof ( val=args[0] ) === "object" ) {
				var valProto = Object.getPrototypeOf( val );
				if( valProto.constructor === makeObjectLink ){
					parseObject( val, o.child );
				} else if( valProto.constructor ===  makeObject ) {
					parseObject( val, o );
				} else if( valProto.constructor === makeObjectProperty ) {
					throw new Error( "Still cannot change a property into a object..." + dumpContext( sandbox ) );
				}
			}else {

			}
		}
		else if( stmt.f === "on") {
		}

		return outSandbox;
	}
}


	function makeObject( p, key ) {
		if( this.constructor !== makeObject ) {
			var o = evr.graph.get(key);
			if( o ) return o;
			return new makeObject(p,key);
		}
		if( !key ) { key = p; p = null; }
		//console.trace( "Makeing object:", key )
		//if( !p ) console.log( "Making root:", key );
		//else console.log( "Making sub in:", p.key, key );
		//var o = evr.graph.get(key);
		var o = this;
		/*
		if( !o && p ) { 
			// this relies on having a text for the parent, so we have to just 
			// assume that the link this results in isn't already populated....
			o = p.members[text];
			if( o ) {
				var oldKey = o.key;
				console.trace( "Rekeying object...", o, "to", key, p.members, text );
				evr.graph.delete( oldKey );
				evr.graph.set( key, o );
				o.key = key;
				emitDriverEvent( "updateKey", evr, o, oldKey );
			}
		}
		*/
		//if( !o ) { 
			this._ = {}; // this is this object that this node represents
			this.key = key; 
			this.fields = {};  // these are property members of this object (tick,value...)
			this.members = {};  // these are object members of this object.
			this.opts = {// a state space drivers use for their state data on this node.
				emitNot : true // node local option indicating it is new and empty
			}, 
			this.maps = [];
			this.guides = []; // maps that will apply later...
			this.guideContexts = []; // maps that will apply later... partially resolved states
								
			this._tick = 0;

		//}

		//console.log( "protos:", Object.keys( nodeProto ) )

		evr.graph.set( key, this );
		evr.objectMap.set( this._, this );
		
		// ask drivers to read this; 
		// at this point one of several things can happen
		//  1) an immediate data driver will populate this node with its properties and it's member objects
		//	(and all their properties?)
		//  2) a delayed driver will setup to ask if someone knows about this path
		//	after some time, the other side will write into this node....
		//
		//  .not can be used to allow the delay of 2 to come back.
		//  3) there's no drivers, and this is done.
		emitDriverEvent( "initNode", evr, o, p );

		if( !p ) {
			emitDriverEvent( "initLink", evr, o );
			emitDriverEvent( "read", evr, o );
		}else {
			p.guideContexts.forEach( (context)=>{
				var newContext = context.run( o );
				if( newContext )
					o.guideContexts.push( newContext );
			})
			p.guides.forEach( guide=>{
				var context = guide.run( o );
				if( context )
					o.guideContexts.push( context );
			})
		}
		return o;

		function getProperty(o, name,initialValue) {
			var p = o.fields[name];
			if( !p ) {
				if( o.members[name] )
					throw new Error( "Property already exists as an object; replacing an object with a value is not allowed."+"existing object:" + this.members[name] );
				return makeObjectProperty( o, name, initialValue ); 
			}
			return p;
		}
	}

	function makeObjectProperty( node, field, initial ) {
		if( this.constructor !== makeObjectProperty ) {
			var o = node.fields[field];
			if( o ) return o;
			return new makeObjectProperty(node,field,initial);
		}

		var o = node.fields;
		var f = this;
		if( initial )  {
			this.node = node;
			this.text = field;
			this.value = initial;
			this.tick = Date.now() ;
			this.opts = {};

			node.fields[field] = f;

			Object.defineProperty( node._, field, {
				get: function(){ return o[field].value; },
				set: function(val) { f.update( val, Date.now() ) },
				enumerable : true,
				configurable : false,												
			} );

			// drivers may commit initial value here... initField allows different operations
			// than a normal 'write' from above, which can count on already being initliazed.

			emitDriverEvent( "initField", evr, node, f );
			// dispatch changed value to map.
			f.node.maps.forEach( (cb)=>cb( f.value, f.text ) );
		}

		return f;
	}
	makeObjectProperty.prototype.update = function( val, tick ) {						
		if( tick > f.tick ) {
			f.value = val;
			f.tick = tick;
			emitDriverEvent( "write", evr, o, f );
			f.node.guideContexts.forEach( context=> {
				var newContext = context.run( o );
			} );
			f.node.maps.forEach( (cb)=>cb( f.value, f.text ) );
		}
	}
	Object.defineProperty( makeObjectProperty.prototype, "key", { get() { throw new Error( "properties are not root elements; 'key' is not supported.") } } );
	makeObjectProperty.prototype.path = function() { throw new Error( "values do not have paths." ); }
	makeObjectProperty.prototype.get = function() { throw new Error( "values are terminal"); }
	makeObjectProperty.prototype.map = function() { throw new Error( "fields cannot be mapped; try .value instead" ); }
	makeObjectProperty.prototype.not = function(cb) { if( f.value === undefined ) cb( ); }
	makeObjectProperty.prototype.on = function(cb) { cb( this.value, this.text ) }
	makeObjectProperty.prototype.put = function(val) { 
		if( typeof value === "object" ) {
			throw new Error( "For now properties cannot turn into objects...");
		} 
		else {
			update( val, Date.now() );
		}
	}

	function parseObject( obj, into ) {
		//console.log( "parse:", obj );
		var keys = Object.keys( obj );
		keys.forEach( (key)=>{
			var val = obj[key];
			var valProto = Object.getPrototypeOf( val );
			if( typeof  val === "object" ) {
				if( valProto.constructor === makeObjectLink ) {
					console.log( "it's a link....", obj )
					var oldChild = this.child;
					this.child = val.child;
					emitDriverEvent( "replace", evr, this.parent, oldChild, obj );
					into.maps.forEach( (cb)=>cb( into._[key], key, obj.child ) );
				}
				else if( valProto.constructor === makeObject ) {
					//console.log( "This proto:",Object.getPrototypeOf( this ).constructor )
					if( Object.getPrototypeOf( this ).constructor === makeObject ) {
						throw new Error( "cannot immediatel substitute one object for another...")
					} else if ( Object.getPrototypeOf( this ).constructor === makeObjectLink ) {
						console.log( "it's a node....", valProto )
						var oldChild = this.child;
						this.child = val;
						emitDriverEvent( "replace", evr, this.parent, oldChild, obj );
						into.maps.forEach( (cb)=>cb( into._[key], key, obj ) );
					}
					else
						throw new Error( "THis never happens.")
				} else {
					//console.log( "GOT PASSED AN OBJECT TO PARSE????", obj )

					// makeObject may return an existing object....
					// but a new link is created...
					var newObj;
					if( !( newObj = into.members[key] ) ) {
						newObj = makeObject( into, makeKey() );
						oLink = makeObjectLink( key, into, newObj );
						into.members[key] = oLink;
						into._[key] = newObj._;
						into.maps.forEach( (cb)=>cb( into._[key], key, obj ) );
						// commit this member into the object for everyone else...
						emitDriverEvent( "initLink", evr, oLink );
						emitDriverEvent( "read", evr, oLink );
					} else {
						newObj = into.members[key].child;
					}
					// otherwise this link already existed...

					//console.log( "so there's a core object out there, now write this?")


					//console.log( "parse : ", obj[key], "INTO", newObj )
					parseObject( obj[key], newObj );
				}
			}
			else {
				var field = into.fields[key];
				if( !field ) {
					if( into.members[key] )
						throw new Error( "Property already exists as an object; replacing an object with a value is not allowed."+"existing object:" + this.members[name] );
					return makeObjectProperty( into, key, obj[key] ); 
				}		
				//var field = getProperty( into, key, obj[key] );
			}
				
		} );
	}	


	Object.defineProperty( makeObject.prototype, "isEmpty", { get() {
				return ( Object.keys(this._).length === 0 );
	}} );
	Object.defineProperty( makeObject.prototype, "tick", { set(val)  {
				if( val > this._tick ) this._tick = val;
							emitDriverEvent( "write", evr, this );
			},
			get() {
				return this._tick;
	}});
	Object.defineProperty( makeObject.prototype, "value", { get() {
				return this._;
	} } );

	makeObject.prototype.path = function(name) {
		var parts = name.split( "." );
		var n = this;
		console.log( " GET path(", name, ")")
		parts.forEach( function(part, nPart ){
			n = n.get( part );
			if( !n && ( nPart === parts.length-1 ) ) {
				var p = getProperty( this, part, undefined ) 
				console.log( "I dunno; I hope you know it's a field not a node?  Both have 'value'")
				return p;
			}
		} );
		return n;
	},
	makeObject.prototype.get = function(name,key) {
		if( typeof name === "object" ) {
			return evr.objectMap(name);
		}
		var o = null;
		//var fLink = this.fields[name];
		//	if( fLink ) return fLink;
		var oLink = this.members[name];
		//console.log( "Get " , name  );
		if( !oLink ) {
			if( this.fields[name] )
				throw new Error( "Path already exists as a property; replacing a value with an object is not allowed.\n"+"existing field:" + this.fields[name] );
			// this key is subject to change
			// the initial state of "added" allows this key to be overwritten by a driver
			//console.log( "Creating a new member with", name )
			oLink = new makeObjectLink( name, this, makeObject( this, key||makeKey() ) );
			this.members[name] = oLink;
			this._[name] = oLink.child._;

			this.maps.forEach( (cb)=>cb( this._[name], name, oLink ) );

			emitDriverEvent( "initLink", evr, oLink );
			emitDriverEvent( "read", evr, oLink );
		}
		else {
			//console.log( "need to return a new link to this object with this as a parent.", name );
			//oLink = makeObjectLink( name, this, oLink.child );
		}
		return oLink;
	},
	makeObject.prototype.not = function(cbNot) {
		if( localDrivers.length || remoteDrivers.length ) {
			emitAbortableDriverEvent( "timeout", "cancelTimeout", evr, o, cbNot );
			if( this.opts.emitNot )
				cbNot( o );
		} else {
			if( this.isEmpty )
				cbNot( o );
		}	
		return this;
	},
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
	makeObject.prototype.put = function(obj) {
		if( typeof obj === "object" ) {
			parseObject( obj, this );
		} else {
			var fLink = this.fields[name];
			if( fLink ) {
				fLink.update( obj, Date.now() );
			}
		}
		return this;
	},
	makeObject.prototype.map = function(cb) {
		if( !cb ) {
			var guide = makeGuide();
			this.guides.push( guide );
			return guide;
		}else {
			console.log( "saved callback for map in", this )
			this.maps.push( cb );					
			emitDriverEvent( "onMap", evr, this );
		}
		return this;
	},
	makeObject.prototype.on = function(cb) {
		this.maps.push( cb );
	},
		
	makeEVR.prototype.get = function (n){ 
					if( typeof n === "object" ) {
						return this.objectMap.get(n);
					}
					return makeObject( null, n ); 
			};
	return evr;
}



function addLocalStorage( cb ) {
			localDrivers.push( cb );
		// for all existing evr, allow the driver to initialize for it.
				evrMaps.forEach( (evr)=>{ 
					cb( "init", evr );
				} );
}
function addRemoteStorage( cb ) {
			remoteDrivers.push( cb );
		// for all existing evr, allow the driver to initialize for it.
				evrMaps.forEach( (evr)=>{ 
					cb( "init", evr );
				} );
}


makeEVR.prototype.on = function(a,b) { handleEvents( evr._events, a, b ) };
makeEVR.prototype.emit= function(a,b) { emitEvents( evr._events, evr, a, b ) };
makeEVR.prototype.once = function(a,b) { handleEvent( evr._events, a, b ) };


		
function handleEvent( _events, event, cb ) {
	var z = _events[event] = _events[event] || [];
	var ev;
	z.push( ev={ once:true, cb:cb, off(){ this.cb=null } } );
	return ev;
}		

function handleEvents( _events, event, cb ) {
	var z = _events[event] = _events[event] || [];
	var event;
	z.push( ev = { once:false, cb:cb, off(){ this.cb=null } } );
	return ev;
			
}		

function emitDriverEvent( ...args ) {
		localDrivers.forEach( ( cb )=>cb( ...args ) );
		remoteDrivers.forEach( ( cb )=>cb( ...args ) );
}

function emitAbortableDriverEvent( initial,abort, ...args ) {
	var n;
		if( ( n = localDrivers.findIndex( ( cb )=>cb( initial, ...args ) ) ) >= 0 ) {
		//console.log( "a abortable driver stopped at ", n );
		for( var d = 0; d < n; d++ ) 
			localDrivers[d].cb( abort, ...args )
	} else if( ( n = remoteDrivers.findIndex( ( cb )=>cb( initial, ...args ) ) ) >= 0 ) {		
		//console.log( "b abortable driver stopped at ", n );
		localDrivers.forEach(cb=>cb.cb( abort, ...args ))
		for( var d = 0; d < n; d++ ) 
			remoteDrivers[d].cb( abort, ...args )
	}
	//console.log( "c abortable driver stopped at ", n );

}

function emitEvents( _events, event, evr, data ) {
	var event = _events[event];
	//console.trace( "emit with", data );
	if( event ) {
		event.forEach( (cb)=>{ if(cb.cb)cb.cb( evr, data ); if( cb.once ) cb.cb = null; } );
	}	
}		


