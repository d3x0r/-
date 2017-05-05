"use strict";

var RNG = require( "../util/org.d3x0r.common/salty_random_generator.js").SaltyRNG( getSalt );

function getSalt (saltbuf) {
    saltbuf.length = 0;
    saltbuf.push(  new Date().getTime() );
}

exports.generator = function() {
    // this is an ipv6 + UUID
    return base64ArrayBuffer( RNG.getBuffer(8*(16+16)) );
}

// Converts an ArrayBuffer directly to base64, without any intermediate 'convert to string then
// use window.btoa' step. According to my tests, this appears to be a faster approach:
// http://jsperf.com/encoding-xhr-image-data/5
// doesn't have to be reversable....
const encodings = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789$_'
var u8 = '';

for( var x = 0; x < 256; x++ ) {
	if( x < 64 ) {
		u8 += String.fromCharCode(x);
	}
	else if( x < 128 ) {
		u8 += String.fromCharCode(x);
	}
	else {
		u8 += String.fromCharCode(x);
	}
}
//console.log( "u8 is...", u8 );

function base64ArrayBuffer(arrayBuffer) {
  var base64    = ''

  var bytes         = new Uint8Array(arrayBuffer)
  var byteLength    = bytes.byteLength
  var byteRemainder = byteLength % 3
  var mainLength    = byteLength - byteRemainder

  var a, b, c, d
  var chunk
  //throw "who's using this?"
  //console.log( "buffer..", arrayBuffer )
  // Main loop deals with bytes in chunks of 3
  for (var i = 0; i < mainLength; i = i + 3) {
    // Combine the three bytes into a single integer
    chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2]

    // Use bitmasks to extract 6-bit segments from the triplet
    a = (chunk & 16515072) >> 18 // 16515072 = (2^6 - 1) << 18
    b = (chunk & 258048)   >> 12 // 258048   = (2^6 - 1) << 12
    c = (chunk & 4032)     >>  6 // 4032     = (2^6 - 1) << 6
    d = chunk & 63               // 63       = 2^6 - 1

    // Convert the raw binary segments to the appropriate ASCII encoding
    base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d]
  }

  // Deal with the remaining bytes and padding
  if (byteRemainder == 1) {
    chunk = bytes[mainLength]
    a = (chunk & 252) >> 2 // 252 = (2^6 - 1) << 2
    // Set the 4 least significant bits to zero
    b = (chunk & 3)   << 4 // 3   = 2^2 - 1
    base64 += encodings[a] + encodings[b] + '=='
  } else if (byteRemainder == 2) {
    chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1]
    a = (chunk & 64512) >> 10 // 64512 = (2^6 - 1) << 10
    b = (chunk & 1008)  >>  4 // 1008  = (2^6 - 1) << 4
    // Set the 2 least significant bits to zero
    c = (chunk & 15)    <<  2 // 15    = 2^4 - 1
    base64 += encodings[a] + encodings[b] + encodings[c] + '='
  }
  //console.log( "dup?", base64)
  return base64
}

// Converts an ArrayBuffer directly to base64, without any intermediate 'convert to string then
// use window.btoa' step. According to my tests, this appears to be a faster approach:
// http://jsperf.com/encoding-xhr-image-data/5
// doesn't have to be reversable....



var xor_code_encodings = {};//'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
for( var a = 0; a < encodings.length; a++  ) {
   var r = (xor_code_encodings[encodings[a]]={} );
   for( var b = 0; b < encodings.length; b++  ) {
	r[encodings[b]] = encodings[a^b];
   }
}
xor_code_encodings['='] = {'=': '='};


function xor(a,b) {
  var c = "";                                                                                             	
  for( var n = 0; n < a.length; n++ ) {
	c += xor_code_encodings[a[n]][b[n]];
  }
  return c
}
exports.xor = xor;


function dexor(a,b,d,e) {
  var r = "";                                                                                             	
  var n1 = (d-1)*((a.length/e)|0);
  var n2 = (d)*(a.length/e)|0;

  for( var n = 0; n < n1; n++ ) 
	r += a[n];
  for( ; n < n2; n++ ) 
	r += xor_code_encodings[a[n]][b[n]];
  for( ; n < n2; n++ ) 
	r += a[n];

  return r
}
exports.dexor=dexor;


var u8xor_code_encodings = {};
for( var a = 0; a < 64; a++  ) {
   var r = (u8xor_code_encodings[a]={} );
   for( var b = 0; b < encodings.length; b++  ) {
	 r[encodings[b]] = a^b;
   }
}
xor_code_encodings['='] = {'=': '='};
//console.log( "u8xor_code_encodings:", JSON.stringify( u8xor_code_encodings) )

var TD = new TextDecoder();
var TE = new TextEncoder();
function u8xor(a,b) {
	//var buf = Buffer.from(a, 'utf8');
	var buf = TE.encode(a);
	//var outBuf = new Buffer( buf.length );
	var outBuf = new Uint8Array( buf.length );
	var n;
	var o = b.step;
	 b.step += buf.length;
	var keylen = b.key.length-5;
	b.step %= keylen;
	var b = b.key;
	
	for( n = 0; n < buf.length; n++ ) {
		var v = buf[n];
		var mask = 0x3f;
		if( (v & 0xE0) == 0xC0 ) {
			{mask=0x3;}
		}
		else if( (v & 0xF0) == 0xE0 ) {
			{mask=0xF;}

		}
		else if( (v & 0xF0) == 0xF0 ) {
			{mask=0x7;}
		}
		outBuf[n] = (v & ~mask ) | ( u8xor_code_encodings[v & mask ][b[(n+o)%(keylen)]] & mask ) 
	}
	//console.log( "buf" , buf.toString('hex') );
	//console.log( "buf" , outBuf.toString('hex') );
	//return outBuf.toString( "utf8" );
	return TD.decode(outBuf);
}
exports.u8xor=u8xor;
