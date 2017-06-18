const idGen = require( "../util/id_generator.js" );

var now = Date.now();
var n = 0;
const length = 300;

while( ( (n%100) !== 0 ) || (( Date.now() - now ) < length) )
{
	idGen.generator();
	n++;
}
console.log( `Generated ${n}(${n/length}/ms) in ${length/1000} seconds`  );


now = Date.now();
n = 0;
var key = idGen.regenerator( "basekey" );
while( ( (n%100) !== 0 ) || ( ( Date.now() - now ) < length) )
{
	var key = idGen.regenerator( key );
	n++;
}
console.log( `Regenerated ${n}(${n/length}/ms) in ${length/1000} seconds`  );

