

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

// gun.get( "root Mesh" );

var object = evra.get( "root Mesh" );
//console.log( "root is", object );
var users = object.path( "users" );

users.map( (v,f)=>{getData(evra,v,f)} );
users.not( ()=>{
	console.trace( "not ran..." );
	users.put( { 1 : { name: 'bob' }, 2 : { name : 'alice' } } );
} );


function getData( evr, val, field ) {
	if( typeof( val ) === "object" ) {
		var _this = evr.get( val )
		_this.map( (v,f)=>{getData(evr,v,f)} );
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

} , 1000 );
