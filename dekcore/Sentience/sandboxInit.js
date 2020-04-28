// This source is loaded, and appended with sandboxPrerun.js
Error.stackTraceLimit = Infinity;

const sack = require( 'sack.vfs' );
sack.Volume.Thread.accept( Λ, (ident,hostedVolume)=>{ console.log( "caught nativedisk" ); sandbox.nativeDisk = hostedVolume });

const vm = require('vm' );
const u8xor = require("./util/u8xor.js")
const idGenModule = require("./util/id_generator.js")
const idGen = sack.SaltyRNG.id;
sack.system.disallowSpawn();

const pendingInit = [];
var initDispatched = false;
sack.ObjectStorage.Thread.accept( Λ, (ident,hostedVolume)=>{

    sandbox.storage = hostedVolume;

    hostedVolume.getRoot()
    .then( (dir)=>{
        sandbox.disk = dir;
        console.log( "Resume waiter on init...");

        dir.open( "config.jsox" )
            .then( file=>file.read( )
                .then( (d)=>{ 
                    sandbox.config = d; 
                    initDispatched = true;
                    for( var cb of pendingInit ) cb();
                    pendingInit.length=0;
                })
                .catch( (err)=>{
                    console.log( "Error in write:", err)
                    file.write( JSOX.stringify( config)).then( ()=>{
                        console.log( "config has been stored...")
                        initDispatched = true;
                        for( var cb of pendingInit ) cb();
                        pendingInit.length=0;
                    })
                    .catch(err)( (err)=>{
                        console.log( "Error putting config? (FATALITY)", err );
                    })
                }) )
            .catch( (err)=>{console.log( "Directory open failed? Why?", err )})

    } )
    .catch( (err)=>{
        console.log( "Get root failed?", err );
    })
} );

function Function() {
    throw new Error( "Please use other code import methods.");
}
function eval() {
    throw new Error( "Please use other code import methods.");
}


const sandbox = vm.createContext( {
    Λ : Λ
    , config : null
    , sandbox : null
    , Function : Function
    , eval: eval
    , require: require
    , module:module
    , storage: null // privateStorage
    , disk : null
	, nativeDisk : null //physicalDisk
    , console:console
    , process: process
    , idGen : idGenModule
    , onInit(cb) {
        if( initDispatched)cb();
        else pendingInit.push(cb);
    }
    //, Buffer: Buffer
    , vmric:(a,b)=>vm.runInContext(a,sandbox,b)
    //, crypto: crypto
    //, config(...args) { returnpost("config",...args); })(); }  // sram type config; reloaded at startup; saved on demand
});
sandbox.idGen.u8xor = u8xor;
sandbox.sandbox = sandbox;

/* Seal Sandbox */
["require","eval", "Function", /*"module",*/ "console", "process", /*"require",*/ "sandbox", "fs", "vm"].forEach(key => {
    if( key in sandbox )
        Object.defineProperty(sandbox, key, { enumerable: false, writable: true, configurable: false });
});
    

