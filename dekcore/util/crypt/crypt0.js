
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

vol.write( oname, `π=${JSON.stringify(out)};eval(((θ)=>{const π=[...${JSON.stringify(ekey)}].map((π)=>π.codePointAt(0));const ϕ=π.length;return [...θ].map((ϵ,Λ)=>String.fromCodePoint(ϵ.codePointAt(0)^π[Λ%ϕ])).join('');})(π))`);
