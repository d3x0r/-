"use strict";

const RNG = require( "../../org.d3x0r.common/salty_random_generator.js").SaltyRNG( (saltbuf)=>saltbuf.push( Date.now() ) );
const RNG2 = require( "../../org.d3x0r.common/salty_random_generator.js").SaltyRNG( getSalt2 );

var salt = null;
function getSalt2 (saltbuf) {
    if( salt ) {
        saltbuf.push( salt );
        salt = null;
    }
}

exports.generator = function() {
    // this is an ipv6 + UUID
    return base64ArrayBuffer( RNG.getBuffer(8*(16+16)) );
}

exports.regenerator = function(s) {
    salt = s;
    RNG2.reset();
    // this is an ipv6 + UUID
    return base64ArrayBuffer( RNG2.getBuffer(8*(16+16)) );
}

exports.u16generator = function() {
    // this is an ipv6 + UUID
    var out = [];
    for( var c = 0; c < 25; c++ ) {
    	var ch = RNG.getBits( 10 ); if( ch < 32 ) ch |= 64;
    	out[c] = String.fromCodePoint( ch );
    }

    return out.join('');
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

var u8xor_code_encodings2 = new Uint8Array( 64* 256 );

var u8xor_code_encodings = {};
for( var a = 0; a < 64; a++  ) {
   var r = (u8xor_code_encodings[a]={} );
   for( var b = 0; b < encodings.length; b++  ) {
      u8xor_code_encodings2[(a<<8)+encodings.codePointAt(b)] = a^b;
      r[encodings[b]] = a^b;
   }
}
xor_code_encodings['='] = {'=': '='};

//var TD = new TextDecoder();
//var TE = new TextEncoder();
function u8xor(a,b) {
	let buf = Buffer.from(a, 'utf8');
    if( !b.keybuf ) { console.trace( "Key needs buf...." ); b.keybuf = Buffer.from( b.key, 'utf8' ); }
    let c = b.keybuf;//Buffer.from(b.key, 'utf8');
	//var buf = TE.encode(a);
	let outBuf = new Buffer( buf.length );
	let o = b.step;
	b.step += buf.length;
	let keylen = b.key.length-5;
	b.step %= keylen;
	let _v = 0;
	let _mask = 0;
	for( var n = 0; n < buf.length; n++ ) {
		let v = buf[n];
		let mask = 0x3f;
		let __mask = _mask;
		let highmask = 0;
		if( (v & 0xE0) == 0xC0 )      { mask=0x1F; }
		else if( (v & 0xF0) == 0xE0 ) { mask=0xF; }
		else if( (v & 0xF8) == 0xF0 ) { mask=0x7; }
		_mask = mask;
		if( __mask === 0xF )
			mask = 0x1F;
		else if( __mask === 0x7 )
			mask = 0xF;
		//outBuf[n] = (v & ~mask ) | ( u8xor_code_encodings[v & mask ][b[(n+o)%(keylen)]] & mask )
		if( mask === 0x3f ) {
			outBuf[n] = (v & ~mask ) | ( u8xor_code_encodings2[ ((v & mask) <<8) + (c[(n+o)%(keylen)]) ] & mask )
		} else
			outBuf[n] = v;
		//console.log( "input:", v.toString(16), (v&mask).toString(16), outBuf[n].toString(16), mask.toString(16), n+o, c[(n+o)%(keylen)] );
		_v = v;
	}
	//console.log( "buf" , buf.toString('hex') );
	//console.log( "buf" , outBuf.toString('hex') );
	//console.log( "buf" , outBuf.toString('utf8') );
	return outBuf.toString( "utf8" );
	//return TD.decode(outBuf);
}
exports.u8xor=u8xor;

function txor(a,b) {
	const d = [...b].map( (c)=>c.codePointAt(0) );
	const keylen = d.length;
	return [...a].map( (c,n)=>String.fromCodePoint( c.codePointAt(0)^d[n%keylen] )).join("");
}
exports.u16xor=txor;


function makeXKey( key, step ) {
    return { key : key, keybuf: key?Buffer.from(key,'utf8'):null, step: step?step:0, setKey(key,step) { this.key = key; this.keybuf = Buffer.from(key,'utf8'); this.step = step; } };
}

function makeU16Key( ) {
    return exports.u16generator();
}

exports.xkey = makeXKey;
exports.ukey = makeU16Key;

Object.freeze( exports );
