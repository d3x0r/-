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
		on(a,b) { handleEvents( evr._events, a, b ) },
		emit(a,b) { emitEvents( evr._events, a, b ) },
		once(a,b) { handleEvent( evr._events, a, b ) },
	}
        evrMaps.push( evr );
       	localDrivers.forEach( ( cb )=>cb( "init", evr ) );
       	remoteDrivers.forEach( ( cb )=>cb( "init", evr ) );

/*
on one side, the mesh can be a simple linear object
root : { 
    users : {
    	1 : {
        	name : "bob" 
        }
    },
    orgs : {
    	1 : { 
        	name : "First Org";
        }
    },
}

map['root'] = {
	node = root;
}
*/

	
        function makeObject( p, key, text ) {
		if( !key ) { key = p; p = null; }
        	if( !text ) text = key;
		//console.trace( "Makeing object:", text )
	        //if( !p ) console.log( "Making root:", text );
                //else console.log( "Making sub in:", p.text, text );
        	var o = evr.graph.get(key);
        
	        if( !o ) { 
                	o = {
        	        	_ : {}, // this is this object that this node represents
                                key : key, 
                                text : text,
	        	        fields : {},  // these are property members of this object (tick,value...)
                        	parent : p,
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
		                        drivers.forEach( ( cb )=>cb( "write", evr, o ) );
				},
        			get tick() {
					return this._tick;
				},
	        	        get value() {
                        		return this._;
        	                },

                		get(name,key) {
					if( typeof name === "object" ) {
						return evr.objectMap(name);
					}
                        		var o = this.members[name];
	                        	if( !o ) {
						if( this.fields[name] )
							throw new Error( "Path already exists as a property; replacing a value with an object is not allowed.\n"+"existing field:" + this.fields[name] );
						// this key is subject to change
						// the initial state of "added" allows this key to be overwritten by a driver
                                		return makeObject( this, key||makeKey(), name );
                                	}
        	                        return o;
                	        },
				not(cbNot) {
					if( drivers.length ) {
						var n;
					       	if( ( n = drivers.findIndex( ( cb )=>cb( "timeout", evr, o, cbNot ) ) ) >= 0 )
							for( var d = 0; d < n; d++ ) 
								cb( "cancelTimeout", evr, o, cbNot )
						if( o.opts.emitNot )
							cbNot( o );
					} else {
						if( o.isEmpty )
							cbNot( o );
					}	
					return o;
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
					return o;
        	                },
				map(cb) {
					o.maps.push( cb );					
		                        drivers.forEach( ( cb )=>cb( "onMap", evr, o ) );
					return o;
				},
				on(cb) {
					o.maps.push( cb );
				},
                	}
			o.path = o.get;

                        if( p ) {
                        	p.members[text] = o;
                                p._[text] = o._;
                        }
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
                        drivers.forEach( ( cb )=>cb( "read", evr, o ) );
			if( p )
				p.maps.forEach( (cb)=>cb( o._, text, o ) );
	        }
        	return o;
	
                function parseObject( obj, into ) {
			//console.log( "parse:", obj );
                	var keys = Object.keys( obj );
                        keys.forEach( (key)=>{
				//console.log( "Writing key:", key );
		        	if( typeof  obj[key] === "object" ) {
                                	var newObj = makeObject( into, makeKey(), key );
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
					, state : "added"
                                        , tick : Date.now() 
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
						f.state =  "modified";
						// dispatch changed value to map.
			                        drivers.forEach( ( cb )=>cb( "write", evr, o, f ) );
						f.node.maps.forEach( (cb)=>cb( f.value, f.field ) );
					},
	                                enumerable : true,
					configurable : false,                                                
	                	} );

                        drivers.forEach( ( cb )=>cb( "write", evr, node, f ) );

			// dispatch changed value to map.
			f.node.maps.forEach( (cb)=>cb( f.value, f.field ) );
                        
			return o[field];
                }

        }
        
       	return evr;
}



function addLocalStorage( cb ) {
        	localDrivers.push( cb );
                evrMaps.forEach( (evr)=>{ 
                	cb( "init", evr );
                } );
}
function addRemoteStorage( cb ) {
        	remoteDrivers.push( cb );
                evrMaps.forEach( (evr)=>{ 
                	cb( "init", evr );
                } );
}

        
var _events = {};

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

function emitEvents( _events, event, data ) {
	var event = _events[event];
	if( event ) {
		event.forEach( (cb)=>{ if(cb.cb)cb.cb( data ); if( cb.once ) cb.cb = null; } );
	}	
}        



/*
	
Object.defineRevisionedProperty = ( object, name )=>{
	var __name = "__"+name;
	var _name = "_"+name;
	var _name_state = "_"+name+"_state";
	var _name_live = "_"+name+"_live";
	var Zname = " "+name;
	object[__name] = [];
	object[_name] = undefined;
        var state = "unset";
        
        if( !("getVersion" in object ) ) {
        	object.getVersion = (field,vers)=>{
                	return object[" "+field](vers);
                }
        }
        
	Object.defineProperty( object, name, {
        	enumerable : true,
        	get : function(){ return object[_name]; },
                set : function(value)  { 
                		object[__name].push( object[_name] ); 
	                        object[_name] = value; 
                                if( object[_name_live] < 0 )
                                	object[_name_live] = object[__name].length-1;
                                object[_name_state] = "modified";
                        }
                } );
	Object.defineProperty( object, name+"_Commit", {
        	value : function() {
                	object[_name_live] = -1;
                }
	        });
	Object.defineProperty( object, _name_state, {
        	value : state
	        });
	Object.defineProperty( object, Zname, {
        	value : function( a,b,c ) {
                	if( Number.isInteger(a) ) {
                        	if( a )
	                        	return object[__name][object[__name].length-(a)];
                                else
	                        	return object[_name];
                        }
                        return object[__name].length;
                }
                } );
	Object.defineProperty( object, _name, {
        	enumerable : false,
                } );
	Object.defineProperty( object, __name, {
        	enumerable : false,
                } );
        	
}

*/
