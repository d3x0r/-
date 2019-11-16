"use strict"

exports.Filter = Filter;

function Filter( transform ) {
	var tmp = transform;
	Object.assign( tmp, {
        	filter : transform
        	, connectInput(stream) {
            	stream.pipe( this.filter );
            }
            ,connectOutput(stream) {
            	this.filter.pipe( stream );
            }
            , disconnectInput(stream) {
                stream.unpipe( this.filter );
            }
            , disconnectOutput(stream) {
                this.filter.unpipe( stream );
            }
        } );
        return tmp;
}
