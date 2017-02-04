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
        for( var n = 0; n < 20; n++ )	 {
        	res += charset[rng.getBits( 6, false )];
        }
        return res;
}

var localDrivers = [];
var remoteDrivers = [];
var evrMaps = [];

var nodeProto = null;
var linkProto = null;

function makeEVR( opts ) {
        
	var evr = {
		objectMap : new WeakMap(),
		graph : new Map(),
		get : (n)=>{ 
     			if( typeof n === "object" ) {
       				return evr.objectMap.get(n);
       			}
                	return makeObject( null, n ); },
                opts : opts || {},
		_events : {},
		on(a,b) { handleEvents( evr._events, a, b ) },
		emit(a,b) { emitEvents( evr._events, evr, a, b ) },
		once(a,b) { handleEvent( evr._events, a, b ) },
	}
        evrMaps.push( evr );
	emitDriverEvent( "init", evr )

	function makeObjectLink( text, parent, child ) {
		
		return {
                        text : text,
			get key() { return this.child.key },
			get isEmpty() { return this.child.isEmpty },
			path(path) { return this.child.path(path) },
			get(path,key) { return this.child.get(path,key); },
			not(cb) { this.child.not(cb); return this; },
			getProp(name,value) { this.child.getProp(name,value); return this; },
			put(obj) { 
				if( Object.getPrototypeOf(obj) === linkProto ) {
					console.log( "it's a link....", obj, linkProto, Object.getPrototypeOf(obj) )
					var oldChild = this.child;
					this.child = obj.child;
					emitDriverEvent( "replace", evr, this.parent, oldChild, obj );
					this.parent.maps.forEach( (cb)=>cb( o._, this.text, obj.child ) );
				}
				else if( Object.getPrototypeOf(obj) === nodeProto ) {
					console.log( "it's a node....")
					var oldChild = this.child;
					this.child = obj;
					emitDriverEvent( "replace", evr, this.parent, oldChild, obj );
					this.parent.maps.forEach( (cb)=>cb( o._, this.text, obj ) );
					
				} else this.child.put( obj );
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
		};
		return link;
	}

        function makeObject( p, key ) {
		if( !key ) { key = p; p = null; }
		//console.trace( "Makeing object:", key )
	        //if( !p ) console.log( "Making root:", key );
                //else console.log( "Making sub in:", p.key, key );
        	var o = evr.graph.get(key);
	        if( !o && p ) { 
			/*
			o = p.members[text];
			if( o ) {
				var oldKey = o.key;
				console.trace( "Rekeying object...", o, "to", key, p.members, text );
				evr.graph.delete( oldKey );
				evr.graph.set( key, o );
				o.key = key;
	                        emitDriverEvent( "updateKey", evr, o, oldKey );
			}
			*/
		}
	        if( !o ) { 
                	o = {
        	        	_ : {}, // this is this object that this node represents
                                key : key, 
	        	        fields : {},  // these are property members of this object (tick,value...)
                        	//parent : p,
        	                members : {},  // these are object members of this object.
 				opts : {// a state space drivers use for their state data on this node.
					emitNot : true // node local option indicating it is new and empty
				}, 
                                 
				_onTimeout : null,
				maps : [],
				_tick : 0,
				get isEmpty() {
					return ( Object.keys(this._).length === 0 );
				},
        			set tick(val) {
					if( val > this._tick ) this._tick = val;
		                        emitDriverEvent( "write", evr, o );
				},
        			get tick() {
					return this._tick;
				},
	        	        get value() {
                        		return this._;
        	                },

				path(name) {
					var parts = name.split( "." );
					var n = o;
					console.log( "path(", name, ")")
					parts.forEach( part=>( n = n.get( part ) ) );
					return n;
				},
                		get(name,key) {
					if( typeof name === "object" ) {
						return evr.objectMap(name);
					}
                        		var o = null;
					var oLink = this.members[name];
					//console.log( "Get " , name  );
	                        	if( !oLink ) {
						if( this.fields[name] )
							throw new Error( "Path already exists as a property; replacing a value with an object is not allowed.\n"+"existing field:" + this.fields[name] );
						// this key is subject to change
						// the initial state of "added" allows this key to be overwritten by a driver
						//console.log( "Creating a new member with", name )
						oLink = makeObjectLink( name, this, makeObject( this, key||makeKey() ) );

						this.members[name] = oLink;
						this._[name] = oLink.child._;
                                	}
					else {
						//console.log( "need to return a new link to this object with this as a parent.", name );
						oLink = makeObjectLink( name, this, oLink.child );
						this.members[name] = oLink;
						this._[name] = oLink.child._;
					}

					if( !linkProto )
						linkProto = Object.prototype.toString.call(oLink);//bject.getPrototypeOf( link );

					if( p )
						p.maps.forEach( (cb)=>cb( o._, name, oLink ) );

					emitDriverEvent( "initLink", evr, oLink );
					emitDriverEvent( "read", evr, oLink );
					return oLink;
                	        },
				not(cbNot) {
					if( localDrivers.length || remoteDrivers.length ) {
						emitAbortableDriverEvent( "timeout", "cancelTimeout", evr, o, cbNot );
						if( o.opts.emitNot )
							cbNot( o );
					} else {
						if( o.isEmpty )
							cbNot( o );
					}	
					return this;
				},
	        		getProp(name,initialValue) {
					var p = this.fields[name];
					if( !p ) {
						if( this.members[name] )
							throw new Error( "Property already exists as an object; replacing an object with a value is not allowed."+"existing object:" + this.members[name] );
	               	                	return makeObjectProperty( this, name, initialValue ); 
					}
					return p;
	        	        },
                        	put(obj) {
        	                	if( typeof obj !== "object" ) {
                	                	throw new Error( "Invalid parameter type to put" );
	                	        }
                                	parseObject( obj, this );
					return this;
        	                },
				map(cb) {
					o.maps.push( cb );					
		                        emitDriverEvent( "onMap", evr, o );
					return o;
				},
				on(cb) {
					o.maps.push( cb );
				},
                	}
			if( !nodeProto )
				nodeProto = Object.prototype.toString.call(o);// Object.getPrototypeOf( o );

			if( !p ) {
				emitDriverEvent( "initLink", evr, o );
				emitDriverEvent( "read", evr, o );
			}
			//console.log( "protos:", Object.keys( nodeProto ), linkProto&&Object.keys(linkProto) )

	                evr.graph.set( key, o );
			evr.objectMap.set( o._, o );
			
			// ask drivers to read this; 
			// at this point one of several things can happen
			//  1) an immediate data driver will populate this node with its properties and it's member objects
			//     (and all their properties?)
			//  2) a delayed driver will setup to ask if someone knows about this path
			//     after some time, the other side will write into this node....
			//
			//  .not can be used to allow the delay of 2 to come back.
			//  3) there's no drivers, and this is done.
                        emitDriverEvent( "initNode", evr, o, p );
	        } else {  // if( !o )  so this is already existed...
			if( key != o.key ) {
				o.key = key;
			}
		}
        	return o;
	
                function parseObject( obj, into ) {
			//console.log( "parse:", obj );
                	var keys = Object.keys( obj );
                        keys.forEach( (key)=>{
				//console.log( "Writing key:", key );
		        	if( typeof  obj[key] === "object" ) {
                                	var newObj = makeObject( into, makeKey() );
					oLink = makeObjectLink( key, into, newObj );
					into.members[key] = oLink;
					into._[key] = newObj._;
					//console.log( "so there's a core object out there, now write this?")

					// commit this member into the object for everyone else...
			                emitDriverEvent( "initLink", evr, oLink );
					emitDriverEvent( "read", evr, oLink );

                                        parseObject( obj[key], newObj );
                                }
                                else {
			        	var field = into.getProp( key, obj[key] );
                                }
                                
                        } );
		}	
                
                function makeObjectProperty( node, field, initial ) {
                	var o = node.fields;
		        var f = o[field] = { node : node
                                	, field : field
                                        , value : initial
                                        , tick : Date.now() 
					, opts : {}
					, update( val, tick ) {						
						f.value = val;
						f.tick = tick;
					}
					};
	        	Object.defineProperty( node._, field, {
                               		get: function(){
                                               	return o[field].value;
					},
	                                set : function(val) {
                                               	f.value = val;
						f.tick = Date.now();

						// dispatch changed value to map.
			                        emitDriverEvent( "write", evr, o, f );
						f.node.maps.forEach( (cb)=>cb( f.value, f.field ) );
					},
	                                enumerable : true,
					configurable : false,                                                
	                	} );

			// drivers may commit initial value here... initField allows different operations
			// than a normal 'write' from above, which can count on already being initliazed.

			emitDriverEvent( "initField", evr, node, f );

			// dispatch changed value to map.
			f.node.maps.forEach( (cb)=>cb( f.value, f.field ) );
                        
			return o[field];
                }

        }
        
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


