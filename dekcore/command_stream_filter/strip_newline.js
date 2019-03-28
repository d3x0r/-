
var stream = require('stream')
var util = require('util')
var filter_base = require( "./filter_base.js")

function trim_newline(options) {
    options = options || {};
    options.decodeStrings = false;
    stream.Transform.call(this, options);
}

util.inherits(trim_newline, stream.Transform)

trim_newline.prototype._transform = function(chunk, encoding, callback) {
	// chunk is given as 'buffer' and is a buffer
	var string = chunk.toString()
	if( ( string.lastIndexOf( "\r\n" ) === string.length-2 )||( string.lastIndexOf( "\n" ) === string.length-1 ) ) {
        	var newstr = string.replace( /\n|\r\n/, "" )
		console.log( "stripped return" );
	        this.push( new Buffer.from(newstr) );
		//console.log( `transform called with ${newstr}...` );
		callback()
	}
	else
		this.push( chunk );
}

exports.Filter = Filter;

function Filter() {
	return filter_base.Filter(  new trim_newline() );
}
