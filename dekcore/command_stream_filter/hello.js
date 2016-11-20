"use strict";
console.log( "hello.js" );

module.exports = (self) =>{
	self.lineNumber = 10;

	console.log( "hello." );
	//console.log( self );
	setInterval( ()=>{console.log( `goto ${self.lineNumber} ` );}, 1000 );
        console.trace( "trace?" );
}

module.exports({});
