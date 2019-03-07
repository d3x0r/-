
const sack = require( "../../sack-gui" );

function openConsole( input ) {
	var f = sack.PSI.Frame( "test", -1, -1, 600, 600, sack.PSI.control.border.resizable );

	f.on( "size", (w,h,start)=>{
		if( !start ) {
			con.size = f.size;//{width: w- ( dialogInitialSize.width - consoleSize.width ),height:h-( 60 + (dialogInitialSize.height - consoleSize.height) )};
		}
	} );

	var con = f.Control( "PSI Console", 0, 00, 500, 500 );
	con.echo = true;
	con.oninput( input );
	f.show();
	return con;
}


const util = require('util')
const stream = require('stream')

function filter( opts ) {
	return 
}

function newConsole(options) {
  options = options || {};
  var _this = this;
  this.console = openConsole( _this.push.bind(_this) );

  //options.decodeStrings = false;
  stream.Duplex.call(this,options)

}
util.inherits(newConsole, stream.Duplex)

newConsole.prototype._read = function( size ) {
	//console.log( "Read called...", size );  // 16384 by default... 
}

newConsole.prototype._write = function( chunk, decoding, callback ) {
	if( decoding === 'buffer' ) {
		//console.log( "console send:", chunk.toString( 'utf8' ) );
		this.console.send( chunk.toString( 'utf8' ) );
 	} else {
		console.log( "_write was called with unhandled decoding:", decoding );
		this.console.send( chunk );
	}
	//this.send( chunk );
	callback();
}


function Filter( sandbox ) {
	var tmp = {
        	filter : new newConsole( sandbox )
        	, connectInput : function(stream) { 
                	stream.pipe( this.filter );
                }
                ,connectOutput : function(stream) { 
                	this.filter.pipe( stream );
                } 
        };
        return tmp;

}

exports.filter = Filter
