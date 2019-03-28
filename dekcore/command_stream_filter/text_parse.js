
var text = require('../../org.d3x0r.common/text.js' );
var filter_base = require( "./filter_base.js")
var stream = require('stream')
var util = require('util')
var sack = require( "../../sack-gui" );
var JSOX = sack.JSOX;

exports.Filter = Filter;
exports.doParse = doParse;

function parse(options) {
  options = options || {};
  options.decodeStrings = false;
  stream.Transform.call(this,options)
}

util.inherits(parse, stream.Transform)

function doParse( string, callback ) {
    var words = text.Parse( string );
    while( words ) {
        var out = { spaces : words.spaces, tabs : words.tabs, text : words.text };
        callback( JSOX.stringify( out ) );//words.text );
            words = words.next;
    }
    callback( '{"text":null}' );
    //console.log( `transform called with ${chunk}   ${string}` );
}

parse.prototype._transform = function(chunk, encoding, callback) {
	// chunk is given as 'buffer' and is a buffer
	//console.log( `text parse : ${chunk}` );
	//console.log( encoding );
	var string = chunk.toString()
	console.log( "Text parse input: ", chunk, encoding, string );
    doParse( string, (data)=>{ this.push( data )} );
	callback()
}

parse.prototype._flush = (callback) => { console.log( "stream flush?" ); callback(); }


function Filter() {
	return filter_base.Filter(  new parse() );
}



