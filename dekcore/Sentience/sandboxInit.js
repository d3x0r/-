// This source is loaded, and appended with sandboxPrerun.js
Error.stackTraceLimit = Infinity;

const vm = require('vm' );
const sack = require( 'sack.vfs' );
sack.system.disallowSpawn();
const hostedVolume = sack.Volume( Λ, null );
sack.system.enableThreadFileSystem();
const privateStorage = hostedVolume.ObjectStorage( sack.SaltyRNG.id( a.Λ + ":storage" ) );

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
    , disk: privatestorage
    , console:console
    , process: process
    //, Buffer: Buffer
    , vmric:(a,b)=>vm.runInContext(a,sandbox,b)
    //, crypto: crypto
    //, config(...args) { returnpost("config",...args); })(); }  // sram type config; reloaded at startup; saved on demand
});
sandbox.sandbox = sandbox;

/* Seal Sandbox */
["require","eval", "Function", "module", "console", "process", "require", "sandbox", "fs", "vm"].forEach(key => {
    if( key in sandbox )
        Object.defineProperty(sandbox, key, { enumerable: false, writable: true, configurable: false });
});
    


