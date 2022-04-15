

import {SaltyRNG} from "./salty_random_generator.mjs"


var RNG = SaltyRNG( arr=>arr.push( "test" ) );

function bench1() {
        
	

        function Do(c) {
        	const start = Date.now();
        	let n = 0;
                let i = 0;
        	for( ; i < 10000000; i++ ) n += c();
                const end = Date.now();
                
                return { n:n, del:end-start, tries:i, tpms:i/(end-start) } ;
        }
        
        console.log( "SRG", Do( RNG.getBits.bind(RNG, 32) ) );
        
        
}

bench1();