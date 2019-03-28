
var SaltyRNG = require( "./salty_random_generator" );
var SRG = SaltyRNG.SaltyRNG();
console.log( "BEFORE FIRST PICK" );
for( var n = 0; n < 10; n++ ) {
	console.log( "n:", SRG.getBits() );
}

	var keybuf = new Uint8Array(1);

	output = SaltyRNG.SRG_XSWS_encryptString( "This should be some sort of long message with a little bit of \
   data and stuff to make it worth actually encrypting this.  Storing a value that is lie '1' or Hello as an ecrypted\
   packet in an object storage system seems a little bit like overkill.  Even this will barly touch the surface of\
   thsize of data stored in a block.", 123, keybuf );
console.log( "Test", output );

	var xoutput = SaltyRNG.SRG_XSWS_decryptString( output, 123, keybuf );
console.log( "Test", xoutput );


var start = Date.now();
	var keybuf = new Uint8Array(1);
	var output;


for( var n = 0; n < 100000; n++ ) {

	output = SaltyRNG.SRG_XSWS_encryptString( "This should be some sort of long message with a little bit of \
   data and stuff to make it worth actually encrypting this.  Storing a value that is lie '1' or Hello as an ecrypted\
   packet in an object storage system seems a little bit like overkill.  Even this will barly touch the surface of\
   thsize of data stored in a block.", 123, keybuf );
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
