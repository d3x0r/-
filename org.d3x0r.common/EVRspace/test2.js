
var Gun = require( "gun" );

var gun = Gun();

var gunRoot = gun.get( "root" );

gunRoot.map( showMeTheData );

function showMeTheData( val, field, at, on, nothing )  {
	// do join by self to get consistent output for node & jsbin(?)
	console.log( [ "Showing Data:", field, "=", val, "@", at, "on", on, "and nothing", typeof nothing ].join( " " ) );
	//console.log( at );
	//console.log( on );
}

gunRoot.path( 3 ).put( "grape" );
gunRoot.path( "1" ).put( "apple" );
gunRoot.put( { 2: "banana" } );

