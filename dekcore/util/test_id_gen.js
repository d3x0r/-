
const idGen = require( "./id_generator.js" );
//const SaltyRNG = require( "../../org.d3x0r.common/salty_random_generator.js" );

var signThis = "Some message Content with some sort of packet { name:\"beans\", qty:1234 }";

console.log( "verify:", idGen.verify( signThis, '6jufOAPSllFBOmcu0YG13gzoWgZWLyCTecK4$oqgAwk=' ) );
console.log( "verify:", idGen.verify( signThis, 'AenqaqCAWi8RpVdW26vXu44_cqxONCQCUSKj2ne3p88=' ) );
 

for( var n =0; n < 10000; n++ ) {
	var id = idGen.sign( signThis );
	if( !idGen.verify( signThis, id ) )
		console.log( "non reproducable" );
}


