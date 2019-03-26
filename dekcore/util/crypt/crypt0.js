
const idGen = require( "../id_generator.js" );
const ekey = idGen.ukey();
const vfs = require( "../../../vfs/native" );
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
var length = "['\\x6c\\x65\\x6e\\x67\\x74\\x68']"
var cpa = "['\\x63\\x6f\\x64\\x65\\x50\\x6f\\x69\\x6e\\x74\\x41\\x74']"
var fcp = "['\\x66\\x72\\x6f\\x6d\\x43\\x6f\\x64\\x65\\x50\\x6f\\x69\\x6e\\x74']"
var map = "['\\x6d\\x61\\x70']"
var join = "['\\x6a\\x6f\\x69\\x6e']"
var _eval = "'\\x65\\x76\\x61\\x6c'"
var _String = "'\\x53\\x74\\x72\\x69\\x6e\\x67'";

vol.write( oname+"2", `π=${JSON.stringify(out)};eval(((θ)=>{const π=[...${JSON.stringify(ekey)}].map((π)=>π.codePointAt(0));const ϕ=π.length;return [...θ].map((ϵ,Λ)=>String.fromCodePoint(ϵ.codePointAt(0)^π[Λ%ϕ])).join('');})(π))`);
vol.write( oname, `π=${JSON.stringify(out)};this[${_eval}](((θ,ϕ)=>((π=[...${JSON.stringify(ekey)}]${map}((π)=>π${cpa}(0))),(ϕ=π${length}),[...θ]${map}((ϵ,Λ)=>this[${_String}]${fcp}(ϵ${cpa}(0)^π[Λ%ϕ]))${join}('')))(π))`);
