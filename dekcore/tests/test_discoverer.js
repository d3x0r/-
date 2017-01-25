

    var discoverer = require( "../discovery.js" );
    discoverer.discover( { timeout: 1000
        , ontimeout : ()=>{
            console.log( "i'm all alone." )
        }
        , onconnect : ( sock ) => {
            console.log( "someone discovered me, and has connected?" );
        }
    })
