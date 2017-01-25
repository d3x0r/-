
var stream = require('stream')
var util = require('util')

function Grep(pattern) {
  stream.Transform.call(this)

  this.pattern = pattern
}

util.inherits(Grep, stream.Transform)

Grep.prototype._transform = function(chunk, encoding, callback) {
	// chunk is given as 'buffer' and is a buffer
	//console.log( chunk );
	//console.log( encoding );
	//var string = chunk.toString()
	console.log( `transform called with ${chunk}   ${string}` );
  	if (string.match(this.pattern)) {
		this.push(chunk)
        }

	callback()
}

var grep = new Grep(/foo/)
process.stdin.pipe(grep)
grep.pipe(process.stdout)


