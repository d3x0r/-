"use strict";

var RNG, RNG2, u8xor, SRG;
if( "undefined" === typeof Λ) {
  SRG = require( "../../org.d3x0r.common/salty_random_generator.js");
 RNG = (SRG).SaltyRNG( 
	(saltbuf)=>saltbuf.push( new Date().toISOString() ), { mode:1 } );
 RNG2 = (SRG).SaltyRNG( getSalt2, { mode:1 } );
 u8xor = require( "./u8xor.js" );
 exports.u8xor=u8xor;

} else {
	async function f() {
		const SRG = await require( "../../org.d3x0r.common/salty_random_generator.js");
		RNG = SRG.SaltyRNG( 
			(saltbuf)=>saltbuf.push( new Date().toISOString() ), { mode:1 } );
		RNG2 = SRG.SaltyRNG( getSalt2, { mode:1 } );
		u8xor = await require( "./u8xor.js" );
		exports.u8xor=u8xor;
	}
	 f();
}


var salt = null;
function getSalt2 (saltbuf) {
    if( salt ) {
        saltbuf.push( salt );
        salt = null;
    }
}

exports.generator = function() {
    return base64ArrayBuffer( RNG.getBuffer(8*(16+16)) );
}

exports.short_generator = function() {
    // this is an ipv6 + UUID
    var ID = RNG.getBuffer(8*(12));
    var now = Date.now() / 1000 | 0;
    ID[0] = ( now & 0xFF0000 ) >> 16;
    ID[1] = ( now & 0x00FF00 ) >> 8;
    ID[2] = ( now & 0x0000FF );
    return base64ArrayBuffer( ID );
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

function signCheck( buf ) {
		buf = new Uint8Array(buf);
		var n, b;
		var is0 = 0;
		var is1 = 0;
		var long0 = 0;
		var long1 = 0;
		var longest0 = 0;
		var longest1 = 0;
		var ones = 0;
		for( n = 0; n < 32; n++ ) {
			for( b = 0; b < 8; b++ ) {
				if( buf[n] & (1 << b) ) {
					ones++;
					if( is1 ) {
						long1++;
					}
					else {
						if( long0 > longest0 ) longest0 = long0;
						is1 = 1;
						is0 = 0;
						long1 = 1;
					}
				}
				else {
					if( is0 ) {
						long0++;
					}
					else {
						if( long1 > longest1 ) longest1 = long1;
						is0 = 1;
						is1 = 0;
						long0 = 1;
					}
				}
			}
		}
// 167-128 = 39 = 40+ dif == 30 bits in a row approx
//const overbal = (167-128)
const overbal = (167-128)
		if( longest0 > 29 || longest1 > 29 || ones > (128+overbal) || ones < (128-overbal) ) {
			if( ones > ( 128+overbal )|| ones < (128 - overbal) )
				console.log( "STRMb: %d %d  0s:%d 1s:%d ", longest0, longest1, 256-ones, ones );
			else
				console.log( "STRMl: %d %d  0s:%d 1s:%d ", longest0, longest1, 256 - ones, ones );
			return 1;
		}
		return 0;
	}

var signEntropy;
var nextSalt = new Uint8Array(32);
exports.sign = function( msg ) {

		//SRGObject *obj = ObjectWrap::Unwrap<SRGObject>( args.This() );
		var id;
		var tries = 0;
		var state = null;
		var tmp = new Uint8Array(32);
		//memcpy( nextSalt, *buf, buf.length() );
		if( !signEntropy ) {
			signEntropy = SRG.SaltyRNG( null );
			signEntropy.initialEntropy = null;
		}

		signEntropy.reset();
		//console.log( "Feed message", msg );
		signEntropy.feed( msg );
		state = signEntropy.save();
		do {
			signEntropy.restore( state );

			{
				id = exports.generator();
				DecodeBase64( nextSalt, id );
				signEntropy.feed( nextSalt );
				var bytes = signEntropy.getBuffer( 256 );
				tries++;
				if( signCheck( bytes ) ) {
					//console.log( "bytes:", new Uint8Array( bytes ) );
					console.log( " %d  %s\n", tries, id );
				} else {
					id = null;
				}
			}
		} while( !id );
		return id;
		
}

exports.verify = function( msg, id  ) {
		if( !signEntropy ) {
			signEntropy = SRG.SaltyRNG( null );
			signEntropy.initialEntropy = null;
		}
		signEntropy.reset();
		//console.log( "Feed message.", msg );
		signEntropy.feed( msg );
		DecodeBase64( nextSalt, id );
		//console.log( "Feed ID", nextSalt, id );
		signEntropy.feed( nextSalt );
		var bytes = signEntropy.getBuffer( 256 );
		//console.log( "bytes:", new Uint8Array( bytes ) );
		return signCheck( bytes );
}

// Converts an ArrayBuffer directly to base64, without any intermediate 'convert to string then
// use window.btoa' step. According to my tests, this appears to be a faster approach:
// http://jsperf.com/encoding-xhr-image-data/5
// doesn't have to be reversable....
const encodings = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789$_'

	// My JS Encoding $_ and = at the end.  allows most to be identifiers too.
	// 'standard' encoding + /
	// variants            - /
	//                     + ,
	//                     . _
	// variants            - _

const decodings = { '~':0
		,'=':0
		,'$':62
		,'_':63
		,'+':62
		,'-':62
		,'.':62
		,'/':63
		,',':63
};


var u8 = '';

for( var x = 0; x < 256; x++ ) {
	if( x < 64 ) {
		decodings[encodings[x]] = x;
		u8 += String.fromCharCode(x);
	}
	else if( x < 128 ) {
		u8 += String.fromCharCode(x);
	}
	else {
		u8 += String.fromCharCode(x);
	}
}
Object.freeze( decodings );
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


function DecodeBase64( out, buf )
{
	var n;
	var outsize = 0;
	var l = (buf.length+3)/4;
	for( n = 0; n < l; n++ )
	{
		var index0 = decodings[buf[n*4]];
		var index1 = decodings[buf[n*4+1]];
		var index2 = decodings[buf[n*4+2]];
		var index3 = decodings[buf[n*4+3]];
		
		out[n*3+0] = (( index0 ) << 2 | ( index1 ) >> 4);
		out[n*3+1] = (( index1 ) << 4 | ( ( ( index2 ) >> 2 ) & 0x0f ));
		out[n*3+2] = (( index2 ) << 6 | ( ( index3 ) & 0x3F ));
	}

	// if the buffer is truncated in length, use that as the 
	// constraint, and if 1 char results with 6 bits, do not
	// count that as a whole byte of output.
	if( buf.length % 4 == 1 )
		outsize = (((buf.length + 3) / 4) * 3) - 3;
	else if( length % 4 == 2 )
		outsize = (((buf.length + 3) / 4) * 3) - 2;
	else if( length % 4 == 3 )
		outsize = (((buf.length + 3) / 4) * 3) - 1;
	else if( buf[buf.length - 1] == '=' ) {
		if( buf[buf.length - 2] == '=' )
			outsize = (((buf.length + 3) / 4) * 3) - 2;
		else
			outsize = (((buf.length + 3) / 4) * 3) - 1;
	}
	else
		outsize = (((buf.length + 3) / 4) * 3);
	return outsize;
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

function txor(a,b) {
	const d = [...b].map( (c)=>c.codePointAt(0) );
	const keylen = d.length;
	return [...a].map( (c,n)=>String.fromCodePoint( c.codePointAt(0)^d[n%keylen] )).join("");
}
exports.u16xor=txor;

function makeXKey( key, step ) {
    return { key : key, keybuf: key?base64ArrayBuffer(key):null, step: step?step:0
	, setKey(key,step) { this.key = key; this.keybuf = DecodeBase64( new Uint8Array(Math.ceil(key.length*3/4)), key); this.step = step?step:0; } };
}

function makeU16Key( ) {
    return exports.u16generator();
}

exports.xkey = makeXKey;
exports.ukey = makeU16Key;

Object.freeze( exports );


if( !module.parent ) {
	console.log( "TEST:", exports.generator(), exports.regenerator("12344") );
}