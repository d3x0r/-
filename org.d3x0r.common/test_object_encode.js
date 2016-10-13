
var cryptObj = require( "./crypted_object" );


var random = new Date().valueOf();
function keyGen( key ) {
	key.push( "asdf" );
        key.push( random) ;
}

var tmp = { from: "user@domain.com", date: new Date(), msg : "message goes here"
		, group_id:1234
		, buf:new ArrayBuffer(15)
		, array:[10,34,23]
                , typdArray : new Uint32Array( 10 )
                , keys : { alpha : [1,2,3,,null,4,] } };

console.log( "Original Object: ", tmp );
var s = cryptObj.encryptObject( tmp );
console.log( "encrypted s : %s", s );
var o = cryptObj.decryptObject( s );
console.log( "Decrypted Object: ", o );

var s = cryptObj.encryptObject( tmp, keyGen );
console.log( "encrypted s : %s", s );
var o = cryptObj.decryptObject( s, keyGen );
console.log( "Decrypted Object: ", o );

var start = (new Date()).valueOf();
for( var n = 0; n < 10000; n++ ) s = cryptObj.encryptObject( tmp, keyGen );
var end = (new Date()).valueOf();
console.log( "del : %d %d", ( end-start ), ( ( end-start ) / 1000 ) / 10000  );


var start = (new Date()).valueOf();
for( var n = 0; n < 10000; n++ ) s = cryptObj.encryptObject( tmp );
var end = (new Date()).valueOf();
console.log( "del : %d %d", ( end-start ), ( ( end-start ) / 1000 ) / 10000  );


s = cryptObj.encryptObject( tmp, keyGen );
var start = (new Date()).valueOf();
var tmp2;
for( var n = 0; n < 10000; n++ ) 
	tmp2 = cryptObj.decryptObject( s, keyGen );
var end = (new Date()).valueOf();
console.log( "del : " + ( end-start ) );


s = cryptObj.encryptObject( tmp );
var start = (new Date()).valueOf();
var tmp2;
for( var n = 0; n < 10000; n++ ) tmp2 = cryptObj.decryptObject( s );
var end = (new Date()).valueOf();
console.log( "del : " + ( end-start ) );

