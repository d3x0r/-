
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
	//console.log( `TrimNewline ${chunk}` );
	//console.log( encoding );
	var string = chunk.toString()
    if( ( string.lastIndexOf( "\r\n" ) === string.length-2 ) )
        var newstr = string.replace( /\n|\r\n/, "" )
        //console.log( `output  ${newstr}`);
        this.push( new Buffer(newstr) );
	//console.log( `transform called with ${newstr}...` );
	callback()
}

exports.Filter = Filter;

function Filter() {
	return filter_base.Filter(  new trim_newline() );
}
