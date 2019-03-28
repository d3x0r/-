
var formulator = require( "./formulator.js" );

function testExpr( e, r ) {
	var a = formulator.processExpression( e );
	if( a !== r )
		console.log( "Result is : ", a );

}

testExpr( "1+1", 2 );

testExpr( "2*3", 6 );
testExpr( "1+2*3", 7 );


testExpr( "x+y", 7 );
