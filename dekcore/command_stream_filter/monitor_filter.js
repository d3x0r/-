

var stream = require('stream')
var util = require('util')

function parse(pattern,options) {
  options = options || {};
  options.decodeStrings = false;
  stream.Transform.call(this,options)

  this.pattern = pattern
}

util.inherits(parse, stream.Transform)

parse.prototype._transform = function(chunk, encoding, callback) {
	// chunk is given as 'buffer' and is a buffer
	console.log( `monitor : [${encoding}]${chunk}` );
	console.log( chunk );
	//console.log( `transform called with ${chunk}   ${string}` );
	this.push( chunk );
	callback()
}

exports.Filter = Filter;

function Filter() {
	var tmp = {
        	filter : new parse()
        	, connectInput : function(stream) { 
                	stream.pipe( this.filter );
                }
                ,connectOutput : function(stream) { 
                	this.filter.pipe( stream );
                } 
        };
        return tmp;

}


