
var SaltyRNG = require( "./salty_random_generator.js" );
var cryptObj = require( "./crypted_object" );

console.log( SaltyRNG, Object.keys( SaltyRNG ) );
//console.log( module );
//console.log( Object.keys( process ) );
//console.log( Object.keys( Buffer ) );

//var global = /*Components.*/ utils.getGlobalForObject(cryptObj);

console.log( "..." );

var RNG = SaltyRNG.SaltyRNG( null, { mode:1 } );
var moreSalt;
var RNG2 = SaltyRNG.SaltyRNG( (salt)=>{ salt.push( moreSalt ) }, { mode:1 } );
var n;
for( n = 0; n < 8; n++ )
  console.log( RNG.getBits( 8 ).toString( 16 ) );

function dumpObj( o ) {
    var keys = Object.keys( o );
    console.log( "keys : " + keys);
    for( var i = 0; i < keys.length; i++ )
        console.log( keys[i], o[keys[i]] )
}

var random = new Date().valueOf();
function keyGen( key ) {
	key.push( "asdf" );
        key.push( random) ;
}

var tmp = { from: "тест Строка.user@domain.com", date: new Date(), msg : "message goes here"
		, group_id:1234
		, buf:new ArrayBuffer(15)
		, array:[10,34,23]
                , typdArray : new Uint32Array( 10 ) };

dumpObj( tmp );
var s = cryptObj.encryptObject( tmp, keyGen );
console.log( "encrypted s : %s", s );
var o = cryptObj.decryptObject( s, keyGen );
dumpObj( o );


var start = (new Date()).valueOf();
for( var n = 0; n < 10000; n++ ) {
	s = cryptObj.encryptObject( tmp );
}
console.log( "encrypted s : %s", s );
var end = (new Date()).valueOf();
console.log( "del : %d %d", ( end-start ), ( ( end-start ) / 1000 ) / 10000  );

var start = (new Date()).valueOf();
var tmp2;
for( var n = 0; n < 10000; n++ )
 	tmp2 = cryptObj.decryptObject( s );

console.log( "And done with", tmp2 );
var end = (new Date()).valueOf();
console.log( "del : " + ( end-start ) );

console.log( "Get Set 1" );
moreSalt = "a";
RNG2.reset();
for( var i = 0; i < 10; i++ ) {
	console.log( RNG2.getBits(30) );
}

console.log( "Get Set 2" );
moreSalt = "b";
RNG2.reset();
for( var i = 0; i < 10; i++ ) {
	console.log( RNG2.getBits(30) );
}

/*
var tmpRNG = RNG.getBuffer( 4096 );
var val = "";
for( n = 0; n < 4096 / 32; n++ )
    val = val + tmpRNG[n].toString(16);
    console.log( "%s", val );
//console.log( RNG.getBuffer( 4096 ).toString( 16 ) );
console.log( RNG.getBits( 32 ).toString( 16 ) );
console.log( RNG.getBits( 32 ).toString( 16 ) );
console.log( RNG.getBits( 32 ).toString( 16 ) );
console.log( RNG.getBits( 32 ).toString( 16 ) );

//RNG.getBits( 3 );
*/
