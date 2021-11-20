

import {AdjacencyMatrix} from "./nodeList.mjs"


var m = AdjacencyMatrix();

m.add( 1, 3 );
m.add( 3, 2 );
m.add( 5, 0 );
m.add( 0, 7 );
m.add( 8, 0 );

m.add( 8, 2 );
m.add( 8, 4 );
m.add( 8, 6 );

console.log( "3 near:", m.near( 3 ) );
console.log( "0 near:", m.near(0) );
console.log( "8 near:", m.near(8) );

