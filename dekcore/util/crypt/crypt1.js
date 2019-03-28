
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

var length = "['\\x6c\\x65\\x6e\\x67\\x74\\x68']"
var cpa = "['\\x63\\x6f\\x64\\x65\\x50\\x6f\\x69\\x6e\\x74\\x41\\x74']"
var fcp = "['\\x66\\x72\\x6f\\x6d\\x43\\x6f\\x64\\x65\\x50\\x6f\\x69\\x6e\\x74']"
var map = "['\\x6d\\x61\\x70']"
var join = "['\\x6a\\x6f\\x69\\x6e']"
var xpt = "['\\x65\\x78\\x70\\x6f\\x72\\x74\\x73']"
var u8x = "['\\x75\\x38\\x78\\x6f\\x72']"
var key = "['\\x6B\\x65\\x79']"
var keybuf = "['\\x6B\\x65\\x79\\x62\\x75\\x66']"
var step = "['\\x73\\x74\\x65\\x70']"

var okey = "'\\x6B\\x65\\x79'"
var okeybuf = "'\\x6B\\x65\\x79\\x62\\x75\\x66'"
var ostep = "'\\x73\\x74\\x65\\x70'"
var _eval = "'\\x65\\x76\\x61\\x6c'"

vol.write( oname+"2", `θ=${JSON.stringify(out)};module${xpt}=((z)=>this['eval']((()=>{const Ω={key:"${ekey.key}",keybuf:null,step:0};Ω.keybuf=new Buffer(Ω.key);return z.u8xor(θ,Ω)})()))` );
vol.write( oname, `θ=${JSON.stringify(out)};module${xpt}=((z)=>this[${_eval}]((()=>((Ω={${okey}:"${ekey.key}",${okeybuf}:null,${ostep}:0}),(Ω${keybuf}=new Buffer(Ω${key})),z${u8x}(θ,Ω)))()))` );
