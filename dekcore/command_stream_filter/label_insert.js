

if( "undefined" !== typeof Λ ) {
    async function setup() {
        var stream = await require('stream')
        var util = await require('util')
    }
    return setup();

}else {
    var stream =  require('stream')
    var util =  require('util')
    
    
}
function parse(pattern,options) {
  options = options || {};
  options.decodeStrings = false;
  stream.Transform.call(this,options)
      this.leader = "?";
  this.pattern = pattern
}

util.inherits(parse, stream.Transform)

parse.prototype._transform = function(chunk, encoding, callback) {
    // chunk is given as 'buffer' and is a buffer
    if( encoding == "buffer" ) {
        this.push( Buffer.concat([this.leaderBuf,chunk]) );
    }
    console.log( "Input labeler has gotten stuff..." );
	console.log( `monitor : [${encoding}]` );
	//console.log( chunk );
	//console.log( `transform called with ${chunk}   ${string}` );
	callback()
}

exports.Filter = Filter;

function Filter() {
	var tmp = {
            set label(val) {
                this.filter.leader = val;
                this.filter.leaderBuf =      Buffer.from(val + ":" , 'utf8');

            },
        	filter : new parse()
        	, connectInput(stream) { 
                	stream.pipe( this.filter );
                }
                ,connectOutput(stream) { 
                	this.filter.pipe( stream );
                } 
        };
        tmp.filter.on("finish", ()=>{
            console.trace( "labeler Finish Event");
        });
        tmp.filter.on("end", ()=>{
            console.trace( "labeler End Event");
        });
        tmp.filter.on("close", ()=>{
            console.trace( "labeler Close Event");
        });

        return tmp;

}


