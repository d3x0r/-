
const idGen = require( "../id_generator.js" );
const ekey = idGen.ukey();
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
var out = idGen.u16xor( file, ekey );

vol.write( oname, `eval(((a)=>{const d=[...${JSON.stringify(ekey)}].map((c)=>c.codePointAt(0));const e=d.length;return [...a].map((c,n)=>String.fromCodePoint(c.codePointAt(0)^d[n%e])).join("");})(${JSON.stringify(out)}))`);

