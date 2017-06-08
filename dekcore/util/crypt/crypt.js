
const idGen = require( "../id_generator.js" );
const ekey = idGen.xkey( idGen.generator() );
const vfs = require( "sack.vfs" );
const vol = vfs.Volume();

const fname = process.argv[2];
const oname = process.argv[3];
if( !fname ) { 
	console.log( "Required input file parameter missing." ); 
	process.exit();
}

if( !oname ) { 
	console.log( "Required output file parameter missing." ); 
	process.exit();
}

var file = vol.read( fname ).toString();
var out = idGen.u8xor( file, ekey );


vol.write( oname, `
( (buf)=>{
const key={key:"${ekey.key}",keybuf:null,step:0};
key.keybuf = new Buffer(key.key)
const encodings = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789$_';
const u8xor_code_encodings2 = new Uint8Array( 64* 128 );
for( var a = 0; a < 64; a++  ) {
   for( var b = 0; b < encodings.length; b++  ) {
     u8xor_code_encodings2[a*128+encodings.codePointAt(b)] = a^b;
   }
}

function u8xor(a,b) {
	let buf = Buffer.from(a, 'utf8');
	let c = b.keybuf;
	let outBuf = new Buffer( buf.length );
	let o = b.step;
	b.step += buf.length;
	let keylen = b.key.length-5;
	b.step %= keylen;

	for( var n = 0; n < buf.length; n++ ) {
		let v = buf[n];
		let mask = 0x3f;
		if( (v & 0xE0) == 0xC0 )      { mask=0x1F; }
		else if( (v & 0xF0) == 0xE0 ) { mask=0xF; }
		else if( (v & 0xF8) == 0xF0 ) { mask=0x7; }
		outBuf[n] = (v & ~mask ) | ( u8xor_code_encodings2[ ((v & mask) <<7) + (c[(n+o)%(keylen)]) ] & mask )
	}
	return outBuf.toString( "utf8" );
}
console.log( \`this File:\${u8xor(buf,key)}\`);
})(${JSON.stringify(out)})` );

