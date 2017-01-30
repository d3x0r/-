
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
