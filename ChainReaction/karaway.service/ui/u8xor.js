
const u8_encodings = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789$_'
const u8xor_code_encodings2 = new Uint8Array( 64* 128 );
//const u8xor_code_encodings2 = new Uint8Array( 64* 128 );

for( let a = 0; a < 64; a++  ) {
   for( let b = 0; b < u8_encodings.length; b++  ) {
     u8xor_code_encodings2[(a<<7)+u8_encodings.codePointAt(b)] = a^b;
   }
}

//Object.freeze( u8xor_code_encodings2 );

//   0x xx xx xx     7 bits
//   10 xx xx xx   0  continuation byte
//   mask 3f
//   11 0x xx xx   6  8-11 bits
//       X XX X_  0x1E  ( required bits )  0x1 allowed bits on first byte
//   11 10 xx xx   12  12-16 bits
//         XX XX   10 X_ __ __   required bits  0x1F (allowed bits on second)
//   11 11 0x xx   18  17-21 bits
//          X XX   10 XX __ __   0xF (allowed bits on second)
//   11 11 10 xx   24  22-26 bits
//            XX   10 XX X_ __   0x7 (allowed bits on second byte)
//   11 11 11 0x   30  27-31 bits
//             X   10 XX XX __  0x3 (allowed bits on second byte)


function node_u8xor(a,b) {
	let buf = Buffer.from(a, 'utf8');
	if( !b.keybuf ) { /*console.trace( "Key needs buf...." );*/ b.keybuf = Buffer.from( b.key, 'utf8' ); }
	let c = b.keybuf;//Buffer.from(b.key, 'utf8');
	//var buf = TE.encode(a);
	let outBuf = new Buffer( buf.length );
	let o = b.step;
	b.step += buf.length;
	let keylen = b.key.length-5;
	b.step %= keylen;
	let _mask = 0x3F;
	let l = 0;
        //console.log( "Decode length:", buf.length );
	for( var n = 0; n < buf.length; n++ ) {
		let v = buf[n];
		let mask = _mask;

		if( (v & 0x80) == 0x00 )      { if( l ) throw new Error( "short utf8 sequence found" ); mask=0x3f; _mask = 0x3f; }
		else if( (v & 0xC0) == 0x80 ) { if( !l ) throw new Error( "invalid utf8 sequence" ); l--; _mask = 0x3f; }
		else if( (v & 0xE0) == 0xC0 ) { if( l ) throw new Error( "short utf8 sequence found" ); l = 1; mask=0x1;_mask = 0x3f; }  // 6 + 1 == 7
		else if( (v & 0xF0) == 0xE0 ) { if( l ) throw new Error( "short utf8 sequence found" ); l = 2; mask=0;  _mask = 0x1f; }  // 6 + 5 + 0 == 11 
		else if( (v & 0xF8) == 0xF0 ) { if( l ) throw new Error( "short utf8 sequence found" ); l = 3; mask=0;  _mask = 0x0f; }  // 6(2) + 4 + 0 == 16
		else if( (v & 0xFC) == 0xF8 ) { if( l ) throw new Error( "short utf8 sequence found" ); l = 4; mask=0;  _mask = 0x07; }  // 6(3) + 3 + 0 == 21
		else if( (v & 0xFE) == 0xFC ) { if( l ) throw new Error( "short utf8 sequence found" ); l = 5; mask=0;  _mask = 0x03; }  // 6(4) + 2 + 0 == 26

		if( mask )
			outBuf[n] = (v & ~mask ) | ( u8xor_code_encodings2[ ((v & mask)<<7) + (c[(n+o)%(keylen)]) ] & mask )
		else
			outBuf[n] = v;
	}
	return outBuf.toString( "utf8" );
}

if( typeof exports !== "undefined" ) {
	//var module = { exports : exports||this };
	//exports = module.exports;
	exports.u8xor = u8xor;
}

function u8xor(a,b) {
	//var buf = Buffer.from(a, 'utf8');
	var buf = TE.encode(a);
	if( !b.keybuf ) { /*console.trace( "Key needs buf...." );*/ b.keybuf = TE.encode( b.key ); }
	let c = b.keybuf;

	var outBuf = new Uint8Array( buf.length );
	var o = b.step;
	b.step += buf.length;
	var keylen = b.key.length-5;
	b.step %= keylen;
	let _mask = 0x3F;
	let l = 0;
	
	for( let n = 0; n < buf.length; n++ ) {
		let v = buf[n];
		let mask = _mask;

		if( (v & 0x80) == 0x00 )      { if( l ) throw new Error( "short utf8 sequence found" ); mask=0x3f; _mask = 0x3f; }
		else if( (v & 0xC0) == 0x80 ) { if( !l ) throw new Error( "invalid utf8 sequence" ); l--; _mask = 0x3f; }
		else if( (v & 0xE0) == 0xC0 ) { if( l ) throw new Error( "short utf8 sequence found" ); l = 1; mask=0x1;_mask = 0x3f; }  // 6 + 1 == 7
		else if( (v & 0xF0) == 0xE0 ) { if( l ) throw new Error( "short utf8 sequence found" ); l = 2; mask=0;  _mask = 0x1f; }  // 6 + 5 + 0 == 11 
		else if( (v & 0xF8) == 0xF0 ) { if( l ) throw new Error( "short utf8 sequence found" ); l = 3; mask=0;  _mask = 0x0f; }  // 6(2) + 4 + 0 == 16
		else if( (v & 0xFC) == 0xF8 ) { if( l ) throw new Error( "short utf8 sequence found" ); l = 4; mask=0;  _mask = 0x07; }  // 6(3) + 3 + 0 == 21
		else if( (v & 0xFE) == 0xFC ) { if( l ) throw new Error( "short utf8 sequence found" ); l = 5; mask=0;  _mask = 0x03; }  // 6(4) + 2 + 0 == 26

		if( mask )
			outBuf[n] = (v & ~mask ) | ( u8xor_code_encodings2[ ((v & mask)<<7) + (c[(n+o)%(keylen)]) ] & mask )
		else
			outBuf[n] = v;
	}
	//console.log( "buf" , buf.toString('hex') );
	//console.log( "buf" , outBuf.toString('hex') );
	//return outBuf.toString( "utf8" );
	return TD.decode(outBuf);
}


Object.freeze( u8xor );


var TD;
var TE;

if( typeof TextDecoder === "undefined" ) {
	function myTextEncoder() {
		this.encode = function(s) {	
			var chars = [...s];
			var len = 0;
			for( var n = 0; n < chars.length; n++ ) {
				var chInt = chars[n].codePointAt(0);
				if( chInt < 128 ) 
					len++;
				else if( chInt < 0x800 ) 
					len += 2;
				else if( chInt < 0x10000 ) 
					len += 3;
				else if( chInt < 0x110000 ) 
					len += 4;
			}
			var out = new Uint8Array( len );
			len = 0;			
			for( var n = 0; n < chars.length; n++ ) {
				var chInt = chars[n].codePointAt(0);
				if( chInt < 128 ) 
					out[len++] = chInt;
				else if( chInt < 0x800 ) {
					out[len++] = ( (chInt & 0x7c0) >> 6 ) | 0xc0;
					out[len++] = ( (chInt & 0x03f) ) | 0x80;
				} else if( chInt < 0x10000 ) {
					out[len++] = ( (chInt & 0xf000) >> 12 ) | 0xE0;
					out[len++] = ( (chInt & 0x0fc0) >> 6 ) | 0x80;
					out[len++] = ( (chInt & 0x003f) ) | 0x80;
				} else if( chInt < 0x110000 ) {
					out[len++] = ( (chInt & 0x01c0000) >> 18 ) | 0xF0;
					out[len++] = ( (chInt & 0x003f000) >> 12 ) | 0xE0;
					out[len++] = ( (chInt & 0x0000fc0) >> 6 ) | 0x80;
					out[len++] = ( (chInt & 0x000003f) ) | 0x80;
				}
			}
			return out;
		}
	}
	function myTextDecoder() {
		this.decode = function(buf) {
			var out = '';
			var len;
			for( var n = 0; n < buf.length; n++ ) {
				if( ( buf[n]& 0x80 ) == 0 )
					out += String.fromCodePoint( buf[n] );
				else if( ( buf[n] & 0xC0 ) == 0x80 ) {
					// invalid character... should already be skipped
				} else if( ( buf[n] & 0xE0 ) == 0xC0 ) {
					out += String.fromCodePoint( ( ( buf[n] & 0x1f ) << 6 ) | ( buf[n+1] & 0x3f ) );
					n++;
				} else if( ( buf[n] & 0xF0 ) == 0xE0 ) {
					out += String.fromCodePoint( ( ( buf[n] & 0xf ) << 12 ) | ( ( buf[n+1] & 0x3f ) << 6 ) | ( buf[n+2] & 0x3f ) );
					n+=2;
				} else if( ( buf[n] & 0xF8 ) == 0xF0 ) {
					out += String.fromCodePoint( ( ( buf[n] & 0x7 ) << 18 ) | ( ( buf[n+1] & 0x3f ) << 12 ) | ( ( buf[n+2] & 0x3f ) << 6 ) | ( buf[n+3] & 0x3f ) );
					n+=3;
				} else if( ( buf[n] & 0xFC ) == 0xF8 ) {
					out += String.fromCodePoint( ( ( buf[n] & 0x3 ) << 24 ) | ( ( buf[n+1] & 0x3f ) << 18 ) | ( ( buf[n+2] & 0x3f ) << 12 ) | ( ( buf[n+3] & 0x3f ) << 6 ) | ( buf[n+4] & 0x3f ) );
					n+=4;
				}
			}
			return out;
		}
	}
	TD = new myTextDecoder();
	TE = new myTextEncoder();
}
else {
	TD = new TextDecoder();
	TE = new TextEncoder();
}

