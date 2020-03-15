// This source is loaded, and appended with sandboxPrerun.js
Error.stackTraceLimit = Infinity;

const vm = require('vm' );
const sack = require( 'sack.vfs' );
const u8xor = require("./util/u8xor.js")
const idGenModule = require("./util/id_generator.js")
const idGen = sack.SaltyRNG.id;
sack.system.disallowSpawn();
const hostedVolume = sack.Volume( Λ, null );
const physicalDisk = sack.Volume();

sack.system.enableThreadFileSystem();
var config;
const hostedSqlite = hostedVolume.Sqlite.bind(hostedVolume);
hostedVolume.Sqlite = (name)=>{
    return hostedSqlite(  Λ + ":sqlite:" + name);
}
hostedVolume.readJSOX( Λ + "config.jsox", (cfg)=>{
    config = cfg;
} );
if( !config ) {
    config = {
        keys : [idGen(), idGen()],
        directory : null
    }
}
const privateStorage = hostedVolume.ObjectStorage( idGen(), idGen( Λ + ":storage" ), config.keys[0], config.keys[1] );

privateStorage.Sqlite = hostedVolume.Sqlite;

if( !config.directory )
{
    privateStorage.put( {}, {
        then(id){
            config.directory = id;
            hostedVolume.write( Λ + "config.jsox", JSOX.stringify( config ) );
        },
        catch(err){
            console.log( "Error putting object?", err );
        }
    } )
}
function Function() {
    throw new Error( "Please use other code import methods.");
}
function eval() {
    throw new Error( "Please use other code import methods.");
}
const sandbox = vm.createContext( {
    Λ : Λ
    , sandbox : null
    , Function : Function
    , eval: eval
    , require: require
    , module:module
    , disk: privateStorage
	, nativeDisk : physicalDisk
    , console:console
    , process: process
	, idGen : idGenModule
    //, Buffer: Buffer
    , vmric:(a,b)=>vm.runInContext(a,sandbox,b)
    //, crypto: crypto
    //, config(...args) { returnpost("config",...args); })(); }  // sram type config; reloaded at startup; saved on demand
});
sandbox.idGen.u8xor = u8xor;
sandbox.sandbox = sandbox;

/* Seal Sandbox */
["require","eval", "Function", /*"module",*/ "console", "process", "require", "sandbox", "fs", "vm"].forEach(key => {
    if( key in sandbox )
        Object.defineProperty(sandbox, key, { enumerable: false, writable: true, configurable: false });
});
    


