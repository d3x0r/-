// 250 = default timeout 


module.exports=exports=makeEVR

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

var drivers = [];
var evrMaps = [];

function makeEVR( cb ) {
	if( typeof cb === "function" ) {
        	drivers.push( cb );
                evrMaps.forEach( (evr)=>{ 
                	cb( "init", evr );
                } );
                return;
        }
        
	var evr = {
		objectMap : new WeakMap(),
		graph : new Map(),
		get : (n)=>{ return makeObject( null, n ); },
                opts : cb || {}
	}
        evrMaps.push( evr );
       	drivers.forEach( ( cb )=>cb( "init", evr ) );

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
        	if( !text ) text = key;
	        //if( !p ) console.log( "Making root:", text );
                //else console.log( "Making sub in:", p.text, text );
        	var o = evr.graph.get(key);
        
	        if( !o ) { 
                	o = {
        	        	_ : {},
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
					return ( Object.keys(_).length === 0 );
				},
        			set tick(val) {
					if( val > _tick ) _tick = val;
		                        drivers.forEach( ( cb )=>cb( "write", evr, o ) );
				},
        			get tick() {
					return _tick;
				},
	        	        get value() {
                        		return this._;
        	                },

                		get(name) {
                        		var o = this.members[name];
	                        	if( !o ) {
						if( this.fields[name] )
							throw new Error( "Path already exists as a property; replacing a value with an object is not allowed.\n"+"existing field:" + this.fields[name] );
						// this key is subject to change
						// the initial state of "added" allows this key to be overwritten by a driver
                                		return makeObject( this, makeKey(), name );
                                	}
        	                        return o;
                	        },
				not(cbNot) {
					if( drivers.length ) {
						var n;
					       	if( ( n = drivers.findIndex( ( cb )=>cb( "timeout", evr, o, cbNot ) ) ) >= 0 )
							for( var d = 0; d < n; d++ ) 
								cb( "cancelTimeout", evr, o, cbNot )
					} else {
						cbNot( o );
					}	
					return o;
				},
	        		getProp(name,initialValue) {
					var p = this.fields[name];
					if( !p ) {
						if( this.members[name] )
							throw new Error( "Property already exists as an object; replacing an object with a value is not allowed."+"existing object:" + this.fields[name] );
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
					//cb( o.value );
					return o;
				},
				on(cb) {
					o.maps.push( cb );
					//fields.
					//cb( o.value );
				},
                	}
			o.path = o.get;

                        if( p ) {
                        	p.members[text] = o;
                                p._[text] = o._;
                        }
	                evr.graph.set( key, o );

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
				p.maps.forEach( (cb)=>cb( o._, text ) );
	        }
        	return o;
	
                function parseObject( obj, into ) {
                	var keys = Object.keys( obj );
                        keys.forEach( (key)=>{
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
                                        , tick : Date.now() };
	        	Object.defineProperty( node._, field, {
                               		get: function(){
                                               	return o[field].value;
					},
	                                set : function(val) {
                                               	f.value = val;
						f.tick = Date.now();
						f.state =  "modified";
						// dispatch changed value to map.
						f.node.maps.forEach( (cb)=>cb( f.value, f.field ) );
			                        drivers.forEach( ( cb )=>cb( "write", evr, o, field ) );
					},
	                                enumerable : true,
					configurable : false,                                                
	                	} );

			// dispatch changed value to map.
			f.node.maps.forEach( (cb)=>cb( f.value, f.field ) );
                        
			return o[field];
                }

        }
        
       	return evr;
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
