

var EVR = require( "./evr.js" );
var evrsqlite = require( "./evr-bio.js" );
var evra = EVR();
var evrb = EVR();

// connect output events to the other mesh's input 
evra.on( "out", (msg)=> {
	evrb.emit( "in", msg );
} )
evrb.on( "out", (msg)=> {
	evra.emit( "in", msg );
} )


//------------------------- Test Code --------------------------

var test = require( process.argv[2] );
test( evra, evrb );
// gun.get( "root Mesh" );
