"use strict"

exports.Filter = Filter;

function Filter( transform ) {
	var tmp = transform;
	Object.assign( tmp, {
        	filter : transform
        	, connectInput : function(stream) {
            	stream.pipe( this.filter );
            }
            ,connectOutput : function(stream) {
            	this.filter.pipe( stream );
            }
            , disconnectInput : function(stream) {
                stream.unpipe( this.filter );
            }
            , disconnectOutput : function(stream) {
                this.filter.unpipe( stream );
            }
        } );
        return tmp;
}
