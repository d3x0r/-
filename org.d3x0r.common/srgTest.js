
var SaltyRNG = require( "./salty_random_generator" );
var SRG = SaltyRNG.SaltyRNG();
console.log( "BEFORE FIRST PICK" );
for( var n = 0; n < 10; n++ ) {
	console.log( "n:", SRG.getBits() );
}

var start = Date.now();
	var keybuf = new Uint8Array(1);
	var output;
for( var n = 0; n < 100000; n++ ) {

	output = SaltyRNG.SRG_XSWS_encryptString( "test", 123, keybuf );
}
var end = Date.now();

console.log( n, " in ", end-start, n/(end-start));

var start = Date.now();
	var keybuf = new Uint8Array(1);
	
for( var n = 0; n < 100000; n++ ) {

	var input = SaltyRNG.SRG_XSWS_decryptString( output, 123, keybuf );
}
var end = Date.now();

console.log( n, " in ", end-start, n/(end-start));


var start = Date.now();
for( var n = 0; n < 1000000; n++ ) {
	SRG.getBits(1);
}
var end = Date.now();

console.log( n, " in ", end-start, n/(end-start));

SRG = SaltyRNG.SaltyRNG( null, {mode:1});

var start = Date.now();
for( var n = 0; n < 1000000; n++ ) {
	SRG.getBits(1);
}
var end = Date.now();

console.log( n, " in ", end-start, n/(end-start));

process.exit()
SRG=SaltyRNG.SaltyRNG( (salt)=>{salt.push(1);} );

var start = Date.now();
for( var n = 0; n < 100000; n++ ) {
	SRG.getBits();
}
var end = Date.now();
console.log( n, " in ", end-start, n/(end-start));

var start = Date.now();
for( var n = 0; n < 100000; n++ ) {
	SRG.getBuffer(1024);
}
var end = Date.now();
console.log( n, " in ", end-start, n/(end-start));


return 0;


for( var n = 0; n < 10; n++ ) {
	console.log( "n:", SRG.getBits(8) );
}

for( var n = 0; n < 10; n++ ) {
	console.log( "n:", SRG.getBits(8,true) );
}
