Error.stackTraceLimit = Infinity;

const vm = require('vm' );
const wt = require( 'worker_threads');

const coreThreadEventer = wt.parentPort ;


function Function() {
    doLog( "Please use other code import methods.");
}
function eval() {
    doLog( "Please use other code import methods.");
}


var sandbox = vm.createContext( {
    Λ : Λ
    , Function : Function
    , eval: eval
    , require: require
    , module:module
    , console:console
    , process: process
    , Buffer: Buffer
    , vmric:(a,b,c)=>vm.runInContext(a,sandbox,c)
    //, crypto: crypto
    //, config(...args) { returnpost("config",...args); })(); }  // sram type config; reloaded at startup; saved on demand
});
sandbox.sandbox = sandbox;

/* Seal Sandbox */
["JSOX","events", "crypto", "_module", "console", "Buffer", "require", "process", "fs", "vm"].forEach(key => {
    if( key in sandbox )
        Object.defineProperty(sandbox, key, { enumerable: false, writable: true, configurable: false });
});
    


