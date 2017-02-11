
var EVR = require( "./evr.js" );
var evr = EVR();
//------------------------- Test Code --------------------------

var object = evr.get( "root Mesh" );
//console.log( "root is", object );
var users = object.path( "users" );
users.map( getData );
users.not( ()=>{
	console.log( "NOT fired..." );
	users.put( { 1 : { name: 'bob' }, 2 : { name : 'alice' } } );
	
	users.map().map().map( getDataB );

} );


function getData( val, field, alsoThis ) {
	if( typeof( val ) === "object" ) {
		var _this = evr.get( val )
		_this.map( getData );
		console.log( "path event:", field, val );
	} else
		console.log( "field event:", field, val );
}
function getDataB( val, field, alsoThis ) {
	if( typeof( val ) === "object" ) {
		var _this = evr.get( val )
		_this.map( getDataB );
		console.log( "b path event:", field, val );
	} else
		console.log( "b field event:", field, val );
}

var data = object.value;

console.log( "FINAL MESH:", object );
console.log( "FINAL DATA:", data );

console.log( "test one:", data.users[1].name );
console.log( "test two:", data.users[2].name );
