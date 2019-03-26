const encodings = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789$_'
const u8xor_code_encodings2 = new Uint8Array( 64* 128 );
//const u8xor_code_encodings2 = new Uint8Array( 64* 128 );

for( let a = 0; a < 64; a++  ) {
   for( let b = 0; b < encodings.length; b++  ) {
     u8xor_code_encodings2[(a<<7)+encodings.codePointAt(b)] = a^b;
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


function u8xor(a,b) {
	let buf = Buffer.from(a, 'utf8');
	if( !b.keybuf ) { /*console.trace( "Key needs buf...." );*/ b.keybuf = Buffer.from( b.key, 'utf8' ); }
	let c = b.keybuf;//Buffer.from(b.key, 'utf8');
	//var buf = TE.encode(a);
	let outBuf = new Buffer.alloc( buf.length );
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
module.exports = exports = u8xor;
Object.freeze( u8xor );
//Object.freeze( module );
/*
if( false ) {
	function test(a,b) {
		var ab = u8xor(a,{ key:b, step:0 });
		console.log( "encod: ", a, " ^ ", b, " = ", ab, "==", [...ab].map(c=>c.codePointAt(0)) );

		console.log( "decod: ", ab, " ^ ", b, " = ", u8xor(ab,{ key:b, step:0 }) );
	}

	// this generates NUL characters...
	test( " !\"#$%&'()*+,-./0123456789:;<=>?@ABC"
            , "ghijklmnopqrstuvwxyz0123456789$_ABCDEF....." );
}
*/
