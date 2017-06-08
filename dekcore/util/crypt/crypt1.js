
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
vol.write( oname, `θ=${JSON.stringify(out)};module.exports=((z)=>eval((()=>{const Ω={key:"${ekey.key}",keybuf:null,step:0};Ω.keybuf=new Buffer(Ω.key);return z.u8xor(θ,Ω)})()))` );
