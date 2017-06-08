const encodings = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789$_'
var u8xor_code_encodings2 = new Uint8Array( 64* 128 );

for( var a = 0; a < 64; a++  ) {
   for( var b = 0; b < encodings.length; b++  ) {
     u8xor_code_encodings2[(a<<7)+encodings.codePointAt(b)] = a^b;
   }
}
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
	let _mask = 0;
	for( var n = 0; n < buf.length; n++ ) {
		let v = buf[n];
		let mask = 0x3f;
		let __mask = _mask;
		if( (v & 0xE0) == 0xC0 )      { mask=0x1F; }
		else if( (v & 0xF0) == 0xE0 ) { mask=0xF; }
		else if( (v & 0xF8) == 0xF0 ) { mask=0x7; }
		_mask = mask;
		if( __mask === 0xF )
			mask = 0x1F;
		else if( __mask === 0x7 )
			mask = 0xF;
		if( mask === 0x3f )
			outBuf[n] = (v & ~mask ) | ( u8xor_code_encodings2[ ((v & mask)<<7) + (c[(n+o)%(keylen)]) ] & mask )
		else
			outBuf[n] = v;
	}
	return outBuf.toString( "utf8" );
}
exports.u8xor=u8xor;
Object.freeze( exports );
