const util = require('util')
const stream = require('stream')

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
	if( input ) 
		con.oninput( input );
	f.show();
	return con;
}



function filter( opts ) {
	return 
}

function newConsole() {
  this.consoleShell = openConsole( this.push.bind(this) );
  stream.Duplex.call(this,{})
}
util.inherits(newConsole, stream.Duplex)


newConsole.prototype._read = function( size ) {
	//console.log( "Read called...", size );  // 16384 by default... 
}

newConsole.prototype._write = function( chunk, decoding, callback ) {
	if( decoding === 'buffer' ) {
		//console.log( "console send:", chunk.toString( 'utf8' ) );
		this.consoleShell.send( chunk.toString( 'utf8' ) );
		this.consoleShell.send( "\n" );
 	} else {
		console.log( "PSI CONSOLE : _write was called with unhandled decoding:", decoding );
		this.consoleShell.send( chunk );
	}
	//this.send( chunk );
	callback();
}


function Filter(  ) {
	var tmp = {
        	filter : new newConsole()
        	, connectInput : function(stream) { 
                	stream.pipe( this.filter );
                }
                ,connectOutput : function(stream) { 
                	this.filter.pipe( stream );
                } 
        };
        return tmp;

}

exports.Filter = Filter.bind( this );

if( !module.parent ) {
	openConsole( null );//newConsole( {} );
}
