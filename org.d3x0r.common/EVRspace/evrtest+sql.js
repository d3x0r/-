
var EVR = require( "./evr.js" );
var evrsqlite = require( "./evr-sqlite.js" );
var evr = EVR();
//------------------------- Test Code --------------------------

// gun.get( "root Mesh" );
var object = evr.get( "root Mesh" );
//console.log( "root is", object );
var users = object.path( "users" );
users.map( getData );
users.not( ()=>{
	console.log( "not ran..." );
	users.put( { 1 : { name: 'bob' }, 2 : { name : 'alice' } } );
} );


function getData( val, field ) {
	if( typeof( val ) === "object" ) {
		console.log( "")
		var _this = evr.get( val )
		_this.map( getData );
		console.log( "path event:", field, val );
	} else
		console.log( "field event:", field, val );
}

var data = object.value;

console.log( "have to delay getting results like this......." );
setTimeout( ()=>{
console.log( "FINAL MESH:", object );
console.log( "FINAL DATA:", data );

console.log( "test one:", data.users[1].name );
console.log( "test two:", data.users[2].name );

}, 1000 );