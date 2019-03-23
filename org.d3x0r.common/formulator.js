//
// formulator.js
//
//    Processes text expressions for formula.
//    It formulates text epxressions.  (Formularization of text?)
//    It can also process formula, and provides ways for external functions to be
//      invoked as part of the evaulattion.
//
//


//----------------------------------------------------------------------
// Expressions parser, processor
//   Limitation - handles only constant expressions
//   Limitation - expects expression to be on one continuous line
//                which is acceptable for the cpp layer.
//----------------------------------------------------------------------

var text = require( "./text.js" );
var util = require( "util" );

const debug_ = false;

const pHEX = "0123456789ABCDEF";
const phex = "0123456789abcdef";

/*
 Section Category Operators
7.5 Primary           x.y  f(x)  a[x]  x++  x--  new typeof  checked  unchecked
7.6 Unary             +  -  !  ~  ++x  --x  (T)x
7.7 Multiplicative    *  /  %
7.7 Additive          +  -
7.8 Shift             <<  >>
7.9 Relational and type testing <  >  <=  >=  is  as
7.9 Equality          ==  !=
7.10 Logical      AND &
7.10 Logical      XOR ^
7.10 Logical      OR  |
7.11 Conditional  AND &&
7.11 Conditional  OR ||

// both of these are right-associative
7.12 Conditional     ?:
7.13 Assignment      =  *=  /=  %=  +=  -=  <<=  >>=  &=  ^=  |=
*/

/*
 Section Category Operators (relevant to preprocessor)
 7.5 Primary           a[x] // should apply to const strings
                            // (results in an operand anyhow)
7.6 Unary             +  -  !  ~  // typecast? (T)x
7.7 Multiplicative    *  /  %
7.7 Additive          +  -
7.8 Shift             <<  >>
7.9 Relational and type testing <  >  <=  >=  is  as
7.9 Equality          ==  !=
7.10 Logical      AND &
7.10 Logical      XOR ^
7.10 Logical      OR  |
7.11 Conditional  AND &&
7.11 Conditional  OR ||

// both of these are right-associative
7.12 Conditional     ?:
*/


const ops = { OP_HANG : -1 // used to indicate prior op complete, please hang on tree
		// after hanging, please re-check current symbol
     , OP_NOOP : 0
     , OP_SUBEXPRESSION :1 // (...)

     , OP_NUMBER :2
//     , OP_INT_OPERAND_8 :2
//     , OP_INT_OPERAND_16  :3
//     , OP_INT_OPERAND_32    :4
//     , OP_INT_OPERAND_64    :5
                            
//     , OP_SINT_OPERAND_8    :6
//     , OP_SINT_OPERAND_16   :7
//     , OP_SINT_OPERAND_32   :8
//     , OP_SINT_OPERAND_64   :9

//     , OP_FLT_OPERAND_32    :10
//     , OP_FLT_OPERAND_64    :11

     , OP_CHARACTER_STRING  :12
     , OP_CHARACTER_CONST   :13

     , OP_SETEQUAL          :14           // =  equality
     , OP_ISEQUAL           :15           // == comparison

     , OP_PLUS             :16            // +
     , OP_INCREMENT         :17           // ++
     , OP_PLUSEQUAL           :18         // +=

     , OP_MINUS         :19               // -
     , OP_DECREMENT     :20               // --
     , OP_MINUSEQUAL    :21               // -=

     , OP_MULTIPLY        :22             // *
     , OP_MULTIPLYEQUAL   :23             // *=
     , OP_MOD             :24             // %
     , OP_MODEQUAL        :25             // %=
     , OP_DIVIDE          :26             // /
     , OP_DIVIDEEQUAL     :27             // /=

     , OP_XOR             :28             // ^
     , OP_XOREQUAL        :29             // ^=

     , OP_BINARYNOT       :30             // ~
     , OP_LOGICALNOT      :31             // !
     , OP_NOTEQUAL        :32             // !=

     , OP_GREATER         :33             // >
     , OP_SHIFTRIGHT      :34             // >>
     , OP_GREATEREQUAL    :35             // >=
     , OP_SHREQUAL        :36             // >>=

     , OP_LESSER          :37             // <
     , OP_SHIFTLEFT       :38             // <<
     , OP_LESSEREQUAL     :39             // <=
     , OP_SHLEQUAL        :40             // <<=

     , OP_BINARYAND       :41             // &
     , OP_LOGICALAND      :42             // &&
     , OP_ANDEQUAL        :43             // &=

     , OP_BINARYOR        :44             // |
     , OP_LOGICALOR       :45             // ||
     , OP_OREQUAL         :46             // |=

     , OP_COMPARISON       :47            // ?
     , OP_ELSE_COMPARISON  :48					// :
     , OP_COMMA            :49
     //, OP_DOT
     //, OP_
};

const fullopname = [ "noop", "sub-expr"
                     ,  "Number",  "uint16_t",  "uint32_t",  "uint64_t" // unsigned int
                     , "int8_t", "int16_t", "int32_t", "int64_t" // signed int
                     , "float", "double" // float ops
                     , "string", "character"
                     , "=", "=="
                     , "+", "++", "+="
                     , "-", "--", "-="
                     , "*", "*="
                     , "%", "%="
                     , "/", "/="
                     , "^", "^="
                     , "~"
                     , "!", "!="
                     , ">", ">>", ">=", ">>="
                     , "<", "<<", "<=", "<<="
                     , "&", "&&", "&="
                     , "|", "||", "|="
                     , "?", ":", ","
                     ];


const Relations = [ { thisop:ops.OP_NOOP      , trans:[ { ch:'=', becomes:ops.OP_SETEQUAL }
                                              , { ch:'<', becomes:ops.OP_LESSER }
                                              , { ch:'>', becomes:ops.OP_GREATER }
                                              , { ch:'+', becomes:ops.OP_PLUS }
                                              , { ch:'-', becomes:ops.OP_MINUS }
                                              , { ch:'*', becomes:ops.OP_MULTIPLY }
                                              , { ch:'/', becomes:ops.OP_DIVIDE }
                                              , { ch:'%', becomes:ops.OP_MOD }
                                              , { ch:'^', becomes:ops.OP_XOR }
                                              , { ch:'~', becomes:ops.OP_BINARYNOT }
                                              , { ch:'!', becomes:ops.OP_LOGICALNOT }
                                              , { ch:'&', becomes:ops.OP_BINARYAND }
                                              , { ch:'|', becomes:ops.OP_BINARYOR }
                                              , { ch:'?', becomes:ops.OP_COMPARISON }
                                              , { ch:':', becomes:ops.OP_ELSE_COMPARISON }
                                              , { ch:',', becomes:ops.OP_COMMA } ] }
                       , { thisop:ops.OP_SETEQUAL  , trans:[ { ch:'=', becomes:ops.OP_ISEQUAL } ] }
                       , { thisop:ops.OP_PLUS      , trans:[ { ch:'+', becomes:ops.OP_INCREMENT }
                                              , { ch:'=', becomes:ops.OP_PLUSEQUAL } ] }
                       , { thisop:ops.OP_MINUS     , trans:[ { ch:'-', becomes:ops.OP_DECREMENT }
                                              , { ch:'=', becomes:ops.OP_MINUSEQUAL } ] }
                       , { thisop:ops.OP_MULTIPLY  , trans:[ { ch:'=', becomes:ops.OP_MULTIPLYEQUAL } ] }
                       , { thisop:ops.OP_MOD       , trans:[ { ch:'=', becomes:ops.OP_MODEQUAL } ] }
                       , { thisop:ops.OP_DIVIDE    , trans:[ { ch:'=', becomes:ops.OP_DIVIDEEQUAL } ] }
                       , { thisop:ops.OP_XOR       , trans:[ { ch:'=', becomes:ops.OP_XOREQUAL } ] }
                       , { thisop:ops.OP_LOGICALNOT, trans:[ { ch:'=', becomes:ops.OP_NOTEQUAL } ] }
                       , { thisop:ops.OP_GREATER   , trans:[ { ch:'>', becomes:ops.OP_SHIFTRIGHT }
                                              , { ch:'=', becomes:ops.OP_GREATEREQUAL } ] }
                       , { thisop:ops.OP_SHIFTRIGHT, trans:[ { ch:'=', becomes:ops.OP_SHREQUAL } ] }
                       , { thisop:ops.OP_LESSER    , trans:[ { ch:'<', becomes:ops.OP_SHIFTLEFT }
                                              , { ch:'=', becomes:ops.OP_LESSEREQUAL } ] }
                       , { thisop:ops.OP_SHIFTLEFT , trans:[ { ch:'=', becomes:ops.OP_SHLEQUAL } ] }
                       , { thisop:ops.OP_BINARYAND , trans:[ { ch:'&', becomes:ops.OP_LOGICALAND }
                                              , { ch:'=', becomes:ops.OP_ANDEQUAL } ] }
                       , { thisop:ops.OP_BINARYOR  , trans:[ { ch:'|', becomes:ops.OP_LOGICALOR }
                                              , { ch:'=', becomes:ops.OP_OREQUAL } ] }
                       ];

//--------------------------------------------------------------------------

function GetOpNode( ) { 
	var node = {
		 op : ops.OP_NOOP,
		data : { number:0, string:'',external:null, sub:null },
		left:null,
		right:null
	}
	return node;
};


//--------------------------------------------------------------------------
//void DestroyExpression(  root  );

function DestroyOpNode( node)
{
	if( node.left )
		node.left.right = node.right;
	if( node.right )
		node.right.left = node.left;
}

//--------------------------------------------------------------------------

function DestroyExpression( root  )
{
	var next;
	// go to the start of the expression...
	if( !root )
		return;
	while( root.left )
		root = root.left;
	next = root;
	while( root = next )
	{
		next = root.right;
		DestroyOpNode( root );
	}
}

//--------------------------------------------------------------------------

function ExpressionBreak(  breakbefore )
{
	if( breakbefore.left )
	{
		breakbefore.left.right = null;
		breakbefore.left = null;
	}
}

//--------------------------------------------------------------------------

function SubstNodes(  _this_left,  _this_right,  that )
{
	if( _this_left && _this_right && that )
	{
		var that_left = that;
		var that_right = that;

		while( that_left.left )
			that_left = that_left.left;
		while( that_right.right )
			that_right = that_right.right;

		if( _this_left.left )
			_this_left.left.right = that_left;
		that_left.left = _this_left.left;
		_this_left.left = null;

		if( _this_right.right )
			_this_right.right.left = that_right;
		that_right.right = _this_right.right;
		_this_right.right = null;
		return _this_left;
	}
	return null;
}

//--------------------------------------------------------------------------

function SubstNode(  _this,  that )
{
	return SubstNodes( _this, _this, that );
}

//--------------------------------------------------------------------------

function GrabNodes( start,  end )
{
	if( start.left )
		start.left.right = end.right;
	if( end.right )
		end.right.left = start.left;
	end.right = null;
	start.left = null;
	return start;
}

//--------------------------------------------------------------------------

function GrabNode( _this )
{
	return GrabNodes( _this, _this );
}

//--------------------------------------------------------------------------

function RelateOpNode( rootObj, rootKey,  node )
{
	debug_ && console.log( "relate node",  rootObj, rootKey,  node );
	if( !node )
	{
		console.log( "Fatal Error: cannot relate a null node\n" );
		return 0;
	}
	if( !rootObj )
	{
		console.log( "Fatal error: Cannot build expression tree with null root.\n" );
		return 0;
	}

	switch( node.op )
	{
	case ops.OP_SETEQUAL:
	case ops.OP_INCREMENT:
	case ops.OP_PLUSEQUAL:
	case ops.OP_DECREMENT:
	case ops.OP_MINUSEQUAL:
	case ops.OP_MULTIPLYEQUAL:
	case ops.OP_MODEQUAL:
	case ops.OP_XOREQUAL:
	case ops.OP_SHREQUAL:
	case ops.OP_SHLEQUAL:
	case ops.OP_ANDEQUAL:
	case ops.OP_OREQUAL:
		console.log( "%s(%d) Error: preprocessor expression may not use operand %s\n"
		       , fullopname[ node.op ] );
		DestroyOpNode( node );
		return 0;
		break;
	}

	if( !rootObj[rootKey] ) {
		rootObj[rootKey] = node;
	} else
	{
		last = rootObj[rootKey];
		while( last && last.right )
		{
			last = last.right;
		}
		if( last )
		{
			node.left = last;
			last.right = node;
		}
	}
	return 1;
}

//--------------------------------------------------------------------------

var level;
function LogExpression(  root )
{
	level++;
	while( root )
	{
		if( root.op == ops.OP_SUBEXPRESSION )
		{
			console.log( "( " );
			LogExpression( root.data.sub );
			console.log( " )" );
		}
		else
		{
			console.log( "(%s) = %d", fullopname[root.op], root.data.number );
		}
		root = root.right;
	}
	level--;
	if( !level )
		console.log( "\n" );
}

//--------------------------------------------------------------------------
// one might suppose that
// expressions are read ... left, current, right....
// and things are pushed off to the left and right of myself, and or rotated
// appropriately....
//
//     null
//     (op)+/-/##/(
//--------------------------------------------------------------------------

function BuildExpression( input, variables ) // expression is queued
{
	var expression = {
		root : null,
		
	};
	var words = text.Parse( input, "\'\"\\({[<>]}):@%/,;!?=*&$^~#`+-" );
	var word = words;
	var pExp; // string
	var nLastLogical = 0;
	var nResult = 0;
	var quote = 0;
	var overflow = 0;
	var ThisOp = GetOpNode();
        //var br = { branch: null};
	var thisword;
	//return 0; // force false output ... needs work on substitutions...

	function GetCurrentWord() {
		return word;
	}

	function StepCurrentWord() {
		word = word.next;
		return word;
	}
	const GetText=(word)=>word.text
	const GetTextSize=(word)=>word.text.length
	//if( g.bDebugLog )
	//{
	//	fprintf( stddbg, "Build expression for: " );
	//	DumpSegs( GetCurrentWord() );
	//}

	while( ( thisword = GetCurrentWord() ) )
	{
		var n;
		pExp = GetText( thisword );
		debug_ && console.log( "word: %s\n", pExp );
		if( pExp == '\'' )
		{
			if( quote == '\'' )
			{
				overflow = 0;
				RelateOpNode( expression, "root", ThisOp );
			  	ThisOp = GetOpNode();
				quote = 0;
			}
			else if( !quote )
			{
				ThisOp.op = ops.OP_CHARACTER_CONST;
				quote = pExp[0];
			}
			StepCurrentWord();
			continue;
		}
		else if( pExp[0] == '\"' )
		{
			if( quote == '\"' )
			{
				var tmp = ThisOp.data.string.toString();
				//LineRelease( ThisOp.data.string );
				ThisOp.data.string = tmp;
				RelateOpNode( expression, "root", ThisOp );
			  	ThisOp = GetOpNode();
				quote = 0;
			}
			else if( !quote )
			{
				ThisOp.op = ops.OP_CHARACTER_STRING;
				quote = pExp[0];
			}
			StepCurrentWord();
			continue;
		}

		if( quote )
		{
			if( ThisOp.op == ops.OP_CHARACTER_STRING )
			{
				ThisOp.data.string.append( thisWord.clone() );
			}
			else if( ThisOp.op == ops.OP_CHARACTER_CONST )
			{
				var n, len = GetTextSize( thisword );
				for( n = 0; n < thisword.spaces; n++ )
				{
					if( !overflow &&
						 (ThisOp.data.number & 0xFF00000000000000) )
					{
						overflow = 1;
						console.log( " warning character constant overflow.\n"
						        );
					}
					ThisOp.data.number *= 256;
					ThisOp.data.number += ' ';
				}
				for( n = 0; n < len; n++ )
				{
					ThisOp.data.number *= 256;
					ThisOp.data.number += pExp[n];
				}
			}
			StepCurrentWord();
			continue;
		}

		if( pExp[0] == '(' )
		{
			var subexpression;

			if( ThisOp.op != ops.OP_NOOP )
			{
			//if( g.bDebugLog )
			//{
			//	fprintf( stddbg, "Adding operation: " );
			//	LogExpression( ThisOp );
			//}
				RelateOpNode( expression, "root", ThisOp );
				ThisOp = GetOpNode();
			}

			StepCurrentWord();
			subexpression = BuildExpression();
			pExp = GetText( GetCurrentWord() );
			if( pExp && pExp[0] != ')' )
			{
				console.log( "(%s%d Error: Invalid expression\n" );
				DestroyExpression( expression.root );
				DestroyOpNode( ThisOp );
				return null;
				// invalid pairing of parens in expression
			}
			ThisOp.op = ops.OP_SUBEXPRESSION;
			ThisOp.data.sub = subexpression;
			RelateOpNode( expression, "root", ThisOp );
		  	ThisOp = GetOpNode();
			// pExp = GetText( GetCurrentWord() );
			// on return check current token as ')'
		}
		else if( pExp[0] == ')' )
		{
			if( ThisOp.op != ops.OP_NOOP )
			{
				RelateOpNode( expression, "root", ThisOp );
			}
			else
				DestroyOpNode( ThisOp );
			//if( g.bDebugLog )
			//{
			//	fprintf( stddbg, "Built Expression: ") ;
			//	LogExpression( branch );
			//}
			return expression;
		}
		else if( ( pExp[0] >= '0' && pExp[0] <= '9' ) ||
					( pExp[0] == '.' ) )
		{

			if( ThisOp.op != ops.OP_NOOP )
			{
				RelateOpNode( expression, "root", ThisOp );
				ThisOp = GetOpNode();
			}

			ThisOp.op = ops.OP_NUMBER;
			ThisOp.data.number = Number( pExp );
			RelateOpNode( expression, "root", ThisOp );
			ThisOp = GetOpNode();
		}
		else {
                	do {
				if( !thisword.spaces || ThisOp.op == ops.OP_NOOP )
				{
				retry_this_operator:
					for( n = 0; n < Relations.length; n++ )
					{
						//console.log( "test operator:", fullopname[ThisOp.op], n );
					 	if( Relations[n].thisop == ThisOp.op )
				 		{
				 			var o;
					
				 			for( o = 0; o < Relations[n].trans.length; o++ )
					 		{
								//console.log( "test thing:", n, o, Relations[n].trans[o].ch, pExp);
					 			if( Relations[n].trans[o].ch == pExp )
								{
									//console.log( "operator", fullopname[ThisOp.op], "becomes", fullopname[Relations[n].trans[o].becomes] );
		 							ThisOp.op = Relations[n].trans[o].becomes;
				 					break;
				 				}
					 		}
					 		if( o >= Relations[n].trans.length )
				 			{
				 				//fprintf( stddbg, "Invalid expression addition\n" );
								console.log( " Error invalid operator: %s\n",pExp );
				 				// invalid expression addition....
				 				n = Relations.length;
					 		}
					 		break;
					 	}
					}
				}
				else // spaces seperate operators.
					n = Relations.length;
				// then this operator does not add to the prior operator...
				// therefore hang the old, create the new...
				if( n == Relations.length ) // unfound
				{
					if( ThisOp.op != ops.OP_NOOP )
					{
						RelateOpNode( expression, "root", ThisOp );
						ThisOp = GetOpNode();
						//console.log( "New ThisOP; and checking plus again.." );
						continue;//goto retry_this_operator;
					}
					if( variables )
					{
						// this is unsubstituted, is not a predefined thing, etc,
						// therefore this is a 0.
						//console.log( "Test word in variables", word.text, pExp, variables );
						if( variables[word.text] ){
							ThisOp.op = ops.OP_EXTERNAL;
							console.log( "This shouldl evaluate some sort of callback and get a data type for this." );
							ThisOp.data.external = variables[word.text].getReference( word.text, expression.root );
							break;
						}
						else if( variables.default ) {
							ThisOp.op = ops.OP_EXTERNAL;
							console.log( "This shouldl evaluate some sort of callback and get a data type for this." );
							ThisOp.data.external = variables.default( word.text, expression.root );
							break;
						}
						else
						{
							ThisOp.data.string = word.text;
							RelateOpNode( expression, "root", ThisOp );
							ThisOp = GetOpNode();
							break; // next word.
						}
					}

					throw new Error( util.format( "invalid opcode sequence at", word.text, "in:", input ) );
					DestroyExpression( expression.root );
					return null;
				}
                                break;
                        } while( 1 );
		}
		StepCurrentWord();
	}

	//if( g.bDebugLog )
	//{
	//	fprintf( stddbg, "Deleting: " );
	//	LogExpression( ThisOp );
	//}
	DestroyOpNode( ThisOp );
	//if( g.bDebugLog )
	//{
	//	fprintf( stddbg, "Built Expression: ") ;
	//	LogExpression( branch );
	//}
	return expression;
}

//--------------------------------------------------------------------------

function IsValue( nodeObj, nodeKey,  collapse_sub )
{
	var temp;
	if( !nodeObj )
		return false;
	switch( nodeObj[nodeKey].op )
	{
	case ops.OP_NUMBER:
	case ops.OP_STRING:
		return true;
		return true;

	case ops.OP_SUBEXPRESSION:
		if( collapse_sub )
		{
			temp = ResolveExpression( nodeObj[nodeKey].data, "sub" );
			nodeObj[nodeKey].data.sub = null;
			DestroyOpNode( SubstNode( nodeObj[nodeKey], temp ) );
			nodeObj[nodeKey] = temp;
		}
		return true;
	}
	return false;
}

//--------------------------------------------------------------------------

function ApplyBinaryNot(  node )
{
	if( node.op ===  ops.OP_NUMBER )
		node.data.number = ~node.data.number;
	else
		console.log( "Dunno how we got here...\n" );
}

//--------------------------------------------------------------------------

function ApplyLogicalNot(  node )
{
	if( node.op ===  ops.OP_NUMBER )
		node.data.number = !node.data.number;
	else
		console.log( "Dunno how we got here...\n" );
}

//--------------------------------------------------------------------------

function ApplyNegative( node )
{
	if( node.op ===  ops.OP_NUMBER )
		node.data.number = -node.data.number;
	else
		console.log( "Dunno how we got here...\n" );
}

//--------------------------------------------------------------------------

function ApplyMultiply(  node1,  node2 )
{
	var result = GetOpNode();
	result.op = ops.OP_NUMBER;
	result.data.number = node1.data.number * node2.data.number;
	return result;
}

//--------------------------------------------------------------------------

function ApplyDivide( node1, node2 )
{
	var result = GetOpNode();
	result.op = ops.OP_NUMBER;
	if( node2.data.number != 0 )
		result.data.number = node1.data.number / node2.data.number;
	else
	{
		console.log( "Right hand operator of divide is 0! - returning NaN\n" );
		result.data.number = NaN;
	}
	return result;
}

//--------------------------------------------------------------------------

function ApplyModulus( node1, node2 )
{
	var result = GetOpNode();
	result.op = ops.OP_NUMBER;
	result.data.number = node1.data.number % node2.data.number;
	return result;
}

//--------------------------------------------------------------------------

function ApplyShiftRight( node1, node2 )
{
	var result = GetOpNode();
	result.op = ops.OP_NUMBER;
	result.data.number = node1.data.number >> node2.data.number;
	return result;
}

//--------------------------------------------------------------------------

function ApplyShiftLeft( node1, node2 )
{
	var result = GetOpNode();
	result.op = ops.OP_NUMBER;
	result.data.number = node1.data.number << node2.data.number;
	return result;
}

//--------------------------------------------------------------------------

function ApplyGreater( node1, node2 )
{
	var result = GetOpNode();
	result.op = ops.OP_NUMBER;
	if( node1.data.number > node2.data.number )
		result.data.number = 1;
	else
		result.data.number = 0;
	return result;
}

//--------------------------------------------------------------------------

function ApplyLesser( node1, node2 )
{
	var result = GetOpNode();
	result.op = ops.OP_NUMBER;
	if( node1.data.number < node2.data.number )
		result.data.number = 1;
	else
		result.data.number = 0;
	return result;
}

//--------------------------------------------------------------------------

function ApplyGreaterEqual( node1, node2 )
{
	var result = GetOpNode();
	result.op = ops.OP_NUMBER;
	if( node1.data.number >= node2.data.number )
		result.data.number = 1;
	else
		result.data.number = 0;
	return result;
}

//--------------------------------------------------------------------------

function ApplyLesserEqual( node1, node2 )
{
	var result = GetOpNode();
	result.op = ops.OP_NUMBER;
	if( node1.data.number <= node2.data.number )
		result.data.number = 1;
	else
		result.data.number = 0;
	return result;
}

//--------------------------------------------------------------------------

function ApplyIsEqual( node1, node2 )
{
	var result = GetOpNode();
	result.op = ops.OP_NUMBER;
	if( node1.data.number == node2.data.number )
		result.data.number = 1;
	else
		result.data.number = 0;
	return result;
}

//--------------------------------------------------------------------------

function ApplyIsNotEqual( node1, node2 )
{
	var result = GetOpNode();
	result.op = ops.OP_NUMBER;
	if( node1.data.number != node2.data.number )
		result.data.number = 1;
	else
		result.data.number = 0;
	return result;
}

//--------------------------------------------------------------------------

function ApplyBinaryAnd( node1, node2 )
{
	var result = GetOpNode();
	result.op = ops.OP_NUMBER;
	result.data.number = node1.data.number & node2.data.number;
	return result;
}

//--------------------------------------------------------------------------

function ApplyBinaryOr( node1, node2 )
{
	var result = GetOpNode();
	result.op = ops.OP_NUMBER;
	result.data.number = node1.data.number | node2.data.number;
	return result;
}

//--------------------------------------------------------------------------

function ApplyXor( node1, node2 )
{
	var result = GetOpNode();
	result.op = ops.OP_NUMBER;
	result.data.number = node1.data.number ^ node2.data.number;
	return result;
}

//--------------------------------------------------------------------------

function ApplyLogicalAnd( node1, node2 )
{
	var result = GetOpNode();
	result.op = ops.OP_NUMBER;
	result.data.number = node1.data.number && node2.data.number;
	//if( g.bDebugLog )
	//{
	//	fprintf( stddbg, "%Ld && %Ld == %Ld\n", node1.data.number, node2.data.number, result.data.number );
	//}
	return result;
}

//--------------------------------------------------------------------------

function ApplyLogicalOr( node1, node2 )
{
	var result = GetOpNode();
	result.op = ops.OP_NUMBER;
	result.data.number = node1.data.number || node2.data.number;
	return result;
}

//--------------------------------------------------------------------------

function ApplyAddition( node1, node2 )
{
	var result = GetOpNode();
	result.op = ops.OP_NUMBER;
	result.data.number = node1.data.number + node2.data.number;
	return result;
}

//--------------------------------------------------------------------------


function ResolveExpressionInner( exprObj, exprKey )
{
	// find highest operand... next next next next....
	var node;
	node = exprObj[exprKey];
	//if( g.bDebugLog )
	//	LogExpression( node );
	while( node )
	{
		 // first loop - handle ! and ~
		if( node.op == ops.OP_SUBEXPRESSION )
		{
			var sub;
			ResolveExpression( node.data, "sub" );
			SubstNode( node, sub = node.data.sub );
			node.data.sub = null;
			DestroyExpression( node );
			if( node == exprObj[exprKey] )
				exprObj[exprKey] = sub;
			node = exprObj[exprKey];
			continue;
		}
		else if( node.op == ops.OP_BINARYNOT )
		{
			if( !node.right )
			{
				console.log( " Error binary not operator(~) with no right hand operand\n" );
				g.ErrorCount++;
				return null;
			}
			{
				var right = node.right;
				if( IsValue( nodes, "right", true ) )
				{
					ApplyBinaryNot( right );
					DestroyOpNode( GrabNode( node ) );
					if( node == exprObj[exprKey] )
						exprObj[exprKey] = right;
					node = exprObj[exprKey];
				}
				else
				{
					console.log( " Error binary not(~) is not followed by an integer...\n" );
					g.ErrorCount++;
				}
			}
			continue;
		}
		else if( node.op == ops.OP_LOGICALNOT )
		{
			if( !node.right )
			{
				console.log( " Error logical not operator with no right hand operand\n"
				        );
				g.ErrorCount++;
				return null;
			}
			{
				var nodes = { right : node.right };
				if( IsValue( nodes, "right", true ) )
				{
					ApplyLogicalNot( nodes.right );
					DestroyOpNode( GrabNode( node ) );
					if( node == exprObj[exprKey] )
						exprObj[exprKey] = nodes.right;
					node = exprObj[exprKey];
				}
				else
				{
					console.log( " Logical not is not followed by an integer...\n");
					g.ErrorCount++;
				}
			}
			continue;
		}
		else if( node.op == ops.OP_PLUS )
		{
			var nodes = { right : node.right };
			DestroyOpNode( node );
			if( node == exprObj[exprKey] )
				exprObj[exprKey] = nodes.right;
			node = exprObj[exprKey];
			continue;
		}
		else if( node.op == ops.OP_MINUS )
		{
			var nodes = { right : node.right };
			if( IsValue( nodes, "right", true ) )
			{
				ApplyNegative( nodes.right );
				DestroyOpNode( node );
				if( node == exprObj[exprKey] )
					exprObj[exprKey] = nodes.right;
				node = exprObj[exprKey];
				continue;
			}
			else
			{
				console.log( " Negative operator is not followed by a value\n");
				g.ErrorCount++;
				return null;
			}
		}
		node = node.right;
	}
	//if( g.bDebugLog )
	//	fprintf( stddbg, "Done with unary +,-,!,~,(") );
	node = exprObj[exprKey];
	//if( g.bDebugLog )
	//	LogExpression(node);
	while( node )
	{
		// Second loop handle * / %
		if( node.op == ops.OP_MULTIPLY )
		{
			var nodes={left:node.left,right:node.right};
			if( IsValue( nodes, "left", true )
				&& IsValue( nodes, "right", true ) )
			{
				var result;
				result = ApplyMultiply( nodes.left, nodes.right );
				DestroyExpression( SubstNodes( nodes.left, nodes.right, result ) );
				if( exprObj[exprKey] == nodes.left )
					exprObj[exprKey] = result;
				node = exprObj[exprKey];
				continue;
			}
			else
			{
				console.log( " Error invalid operands to multiply?\n" );
				g.ErrorCount++;
			}
		}
		if( node.op == ops.OP_DIVIDE )
		{
			var nodes={left:node.left,right:node.right};
			if( IsValue( nodes, "left", true )
				&& IsValue( nodes, "right", true ) )
			{
				var result;
				result = ApplyDivide( nodes.left, nodes.right );
				DestroyExpression( SubstNodes( nodes.left, nodes.right, result ) );
				if( exprObj[exprKey] == nodes.left )
					exprObj[exprKey] = result;
				node = exprObj[exprKey];
				continue;
			}
			else
			{
				console.log( " Error invalid operands to divide?\n" );
				g.ErrorCount++;
			}
		}
		if( node.op == ops.OP_MOD )
		{
			var nodes={left:node.left,right:node.right};
			if( IsValue( nodes, "left", true )
				&& IsValue( nodes, "right", true ) )
			{
				var result;
				result = ApplyModulus( nodes.nodes.left, nodes.right );
				DestroyExpression( SubstNodes( nodes.nodes.left, nodes.right, result ) );
				if( exprObj[exprKey] == nodes.nodes.left )
					exprObj[exprKey] = result;
				node = exprObj[exprKey];
				continue;
			}
			else
			{
				console.log( " Error invalid operands to mod?\n" );
				g.ErrorCount++;
			}
		}
		node = node.right;
	}
	// +/- additive operators would be next - but already done as unary.
	node = exprObj[exprKey];
	//if( g.bDebugLog )
	//	LogExpression(node);
	while( node )
	{
		// third loop handle >> <<
		if( node.op == ops.OP_SHIFTRIGHT )
		{
			var nodes={left:node.left,right:node.right};
			if( IsValue( nodes, "left", true )
				&& IsValue( nodes, "right", true ) )
			{
				var result;
				result = ApplyShiftRight( nodes.left, nodes.right );
				DestroyExpression( SubstNodes( nodes.left, nodes.right, result ) );
				if( exprObj[exprKey] == nodes.left )
					exprObj[exprKey] = result;
				node = exprObj[exprKey];
				continue;
			}
			else
			{
				console.log( " Error invalid operands to shift right?\n" );
				g.ErrorCount++;
			}
		}
		if( node.op == ops.OP_SHIFTLEFT )
		{
			var nodes={left:node.left,right:node.right};
			if( IsValue( nodes, "left", true )
				&& IsValue( nodes, "right", true ) )
			{
				var result;
				result = ApplyShiftLeft( nodes.left, nodes.right );
				DestroyExpression( SubstNodes( nodes.left, nodes.right, result ) );
				if( exprObj[exprKey] == nodes.left )
					exprObj[exprKey] = result;
				node = exprObj[exprKey];
				continue;
			}
			else
			{
				console.log( " Error invalid operands to shift left?\n" );
				g.ErrorCount++;
			}
		}
		node = node.right;
	}
	node = exprObj[exprKey];
	while( node )
	{
		// 4th loop handle > < >= <= comparisons (result in 0/1)
		if( node.op == ops.OP_GREATER )
		{
			var nodes={left:node.left,right:node.right};
			if( IsValue( nodes, "left", true )
				&& IsValue( nodes, "right", true ) )
			{
				var result;
				result = ApplyGreater( nodes.left, nodes.right );
				DestroyExpression( SubstNodes( nodes.left, nodes.right, result ) );
				if( exprObj[exprKey] == nodes.left )
					exprObj[exprKey] = result;
				node = exprObj[exprKey];
				continue;
			}
			else
			{
				console.log( " Error invalid operands to greater?\n" );
				g.ErrorCount++;
			}
		}
		if( node.op == ops.OP_LESSER )
		{
			var nodes={left:node.left,right:node.right};
			if( IsValue( nodes, "left", true )
				&& IsValue( nodes, "right", true ) )
			{
				var result;
				result = ApplyLesser( nodes.left, nodes.right );
				DestroyExpression( SubstNodes( nodes.left, nodes.right, result ) );
				if( exprObj[exprKey] == nodes.left )
					exprObj[exprKey] = result;
				node = exprObj[exprKey];
				continue;
			}
			else
			{
				console.log( " Error invalid operands to lesser?\n" );
				g.ErrorCount++;
			}
		}
		if( node.op == ops.OP_GREATEREQUAL )
		{
			var nodes={left:node.left,right:node.right};
			if( IsValue( nodes, "left", true )
				&& IsValue( nodes, "right", true ) )
			{
				var result;
				result = ApplyGreaterEqual( nodes.left, nodes.right );
				DestroyExpression( SubstNodes( nodes.left, nodes.right, result ) );
				if( exprObj[exprKey] == nodes.left )
					exprObj[exprKey] = result;
				node = exprObj[exprKey];
				continue;
			}
			else
			{
				console.log( " Error invalid operands to greater equal?\n" );
				LogExpression( exprObj[ exprKey] );
				g.ErrorCount++;
			}
		}
		if( node.op == ops.OP_LESSEREQUAL )
		{
			var nodes={left:node.left,right:node.right};
			if( IsValue( nodes, "left", true )
				&& IsValue( nodes, "right", true ) )
			{
				var result;
				result = ApplyLesserEqual( nodes.left, nodes.right );
				DestroyExpression( SubstNodes( nodes.left, nodes.right, result ) );
				if( exprObj[exprKey] == nodes.left )
					exprObj[exprKey] = result;
				node = exprObj[exprKey];
				continue;
			}
			else
			{
				console.log( " Invalid operands to lesser equal?\n" );
				g.ErrorCount++;
			}
		}
		node = node.right;
	}
	node = exprObj[exprKey];
	//if( g.bDebugLog )
	//	LogExpression(node);
	while( node )
	{
		// 5th loop handle == !=
		if( node.op == ops.OP_ISEQUAL )
		{
			var left, right;
			left = node.left;
			right = node.right;
			if( IsValue( nodes, "nodes.left", true )
				&& IsValue( nodes, "right", true ) )
			{
				var result;
				result = ApplyIsEqual( nodes.left, nodes.right );
				DestroyExpression( SubstNodes( nodes.left, nodes.right, result ) );
				if( exprObj[exprKey] == nodes.left )
					exprObj[exprKey] = result;
				node = exprObj[exprKey];
				continue;
			}
			else
			{
				console.log( " Error invalid operands to equal?\n");
				g.ErrorCount++;
			}
		}
		if( node.op == ops.OP_NOTEQUAL )
		{
			var nodes={left:node.left,right:node.right};
			if( IsValue( nodes, "left", true )
				&& IsValue( nodes, "right", true ) )
			{
				var result;
				result = ApplyIsNotEqual( nodes.left, nodes.right );
				DestroyExpression( SubstNodes( nodes.left, nodes.right, result ) );
				if( exprObj[exprKey] == nodes.left )
					exprObj[exprKey] = result;
				node = exprObj[exprKey];
				continue;
			}
			else
			{
				console.log( " Error invalid operands to not equal?\n" );
				LogExpression( exprObj[ exprKey] );
				g.ErrorCount++;
			}
		}
		node = node.right;
	}
	node = exprObj[exprKey];
	//if( g.bDebugLog )
	//	LogExpression(node);
	while( node )
	{
		// 6th loop
		if( node.op == ops.OP_BINARYAND )
		{
			var nodes={left:node.left,right:node.right};
			if( IsValue( nodes, "left", true )
				&& IsValue( nodes, "right", true ) )
			{
				var result;
				result = ApplyBinaryAnd( nodes.left, nodes.right );
				DestroyExpression( SubstNodes( nodes.left, nodes.right, result ) );
				if( exprObj[exprKey] == nodes.left )
					exprObj[exprKey] = result;
				node = exprObj[exprKey];
				continue;
			}
			else
			{
				console.log( " Error invalid operands to not equal?\n" );
				g.ErrorCount++;
			}
		}
		node = node.right;
	}
	node = exprObj[exprKey];
	//if( g.bDebugLog )
	//	LogExpression(node);
	while( node )
	{
		// 7th loop
		if( node.op == ops.OP_XOR )
		{
			var nodes={left:node.left,right:node.right};
			if( node.left.op === ops.OP_NUMBER
				&& node.right.op === ops.OP_NUMBER )
			{
				var result;
				result = ApplyXor( nodes.left, nodes.right );
				DestroyExpression( SubstNodes( nodes.left, nodes.right, result ) );
				if( exprObj[exprKey] == nodes.left )
					exprObj[exprKey] = result;
				node = exprObj[exprKey];
				continue;
			}
			else
			{
				console.log( " Error invalid operands to not equal?\n" );
				g.ErrorCount++;
			}
		}
		node = node.right;
	}
	node = exprObj[exprKey];
	//if( g.bDebugLog )
	//	LogExpression(node);
	while( node )
	{
		// 8th loop
		if( node.op == ops.OP_BINARYOR )
		{
			var nodes={left:node.left,right:node.right};
			if( node.left.op === ops.OP_NUMBER
				&& node.right.op === ops.OP_NUMBER )
			{
				var result;
				result = ApplyBinaryOr( nodes.left, nodes.right );
				DestroyExpression( SubstNodes( nodes.left, nodes.right, result ) );
				if( exprObj[exprKey] == nodes.left )
					exprObj[exprKey] = result;
				node = exprObj[exprKey];
				continue;
			}
			else
			{
				console.log( " Error invalid operands to not equal?\n" );
				g.ErrorCount++;
			}
		}
		node = node.right;
	}
	node = exprObj[exprKey];
	//if( g.bDebugLog )
	//	LogExpression(node);
	while( node )
	{
		// 8th loop
		if( node.op == ops.OP_LOGICALAND )
		{
			var nodes={left:node.left,right:node.right};
			if( IsValue( nodes, "left", true )
				&& IsValue( nodes, "right", true ) )
			{
				var result;
				result = ApplyLogicalAnd( nodes.left, nodes.right );
				DestroyExpression( SubstNodes( nodes.left, nodes.right, result ) );
				if( exprObj[exprKey] == nodes.left )
					exprObj[exprKey] = result;
				node = exprObj[exprKey];
				continue;
			}
			else
			{
				console.log( " Error invalid operands to not equal?\n" );
				g.ErrorCount++;
			}
		}
		node = node.right;
	}
	node = exprObj[exprKey];
	//if( g.bDebugLog )
	//	LogExpression(node);
	while( node )
	{
		// 9th loop
		if( node.op == ops.OP_LOGICALOR )
		{
			var nodes={left:node.left,right:node.right};
			if( IsValue( nodes, "left", true )
				&& IsValue( nodes, "right", true ) )
			{
				var result;
				result = ApplyLogicalOr( nodes.left, nodes.right );
				DestroyExpression( SubstNodes( nodes.left, nodes.right, result ) );
				if( exprObj[exprKey] == nodes.left )
					exprObj[exprKey] = result;
				node = exprObj[exprKey];
				continue;
			}
			else
			{
				console.log( " Error invalid operands to not equal?\n" );
				g.ErrorCount++;
			}
		}
		node = node.right;
	}
	node = exprObj[exprKey];
	while( node )
	{
		// and finally - add all subsequent operators...
		var nodes={left:node.left,right:node.right};
		if( node && nodes.right )
		{
			var result;
			result = ApplyAddition( node, nodes.right );
			DestroyExpression( SubstNodes( node, nodes.right, result ) );
			exprObj[exprKey] = result;
			node = exprObj[exprKey];
			continue;
		}
		node = node.right;
	}
	//if( g.bDebugLog )
	//	LogExpression(expr);
	return "NO FILE";
}

//--------------------------------------------------------------------------

function ResolveExpression( expression )
{
	return ResolveExpressionInner( expression, "root" );
}

//--------------------------------------------------------------------------

function IsValidExpression( expression )
{
	// check to see if any operands are next to any other operands...
	// like 3 4 2 is not valid 3 + 4 + 2 is though
	// though the processing will cause the +'s to dissappear and
	// subsequently when done - any operands next to each other are
	// implied +'s
	var thisnode = { node : expression.root };
	var prior_operand = 0;
	while( thisnode.node )
	{
		if( thisnode.node.op == ops.OP_COMMA )
		{
			exprObj[objKey] = thisnode.node.right;
			ExpressionBreak( thisnode.node.right );
			DestroyExpression( thisnode.node );
			thisnode.node = exprObj[objKey];
			prior_operand = 0;
			continue;
		}
		if( thisnode.node.op == ops.OP_SUBEXPRESSION )
		{
			if( !IsValidExpression( thisnode.node.data, "sub" ) )
				return false;
			prior_operand = 1;
		}
		else if( IsValue( thisnode, "node", false ) )
		{
			if( prior_operand )
			{
				LogExpression( expression.root );
				console.log( " Multiple operands with no operator!\n");
				return false;
			}
			prior_operand = 1;
		}
		else
			prior_operand = 0;
		thisnode.node = thisnode.node.right;
	}
	return true;
}

//--------------------------------------------------------------------------

function ProcessExpression( input )
{
	var expression = BuildExpression( input );
	if( IsValidExpression( expression ) )
	{
		ResolveExpression( expression );
		if( !expression.root )
			throw new Error( "Failed to parse expression...", input );
		if( expression.root.left || expression.root.right )
		{
			console.log( " Expression failed to resolve completely...\n" );
		}
		{
			var resultval = 0;
			if( expression.root )
			{
				resultval = expression.root.data.number;
			}
			DestroyExpression( expression.root );
			return resultval;
		}
	}
	DestroyExpression( expression.root );
	return 0;
}


exports.buildExpression = BuildExpression
exports.resolveExpression = ResolveExpression
exports.processExpression = ProcessExpression


BuildExpression( "apple + banana", { 
			default(word,expression) {
				return { name: "other value", param:word };
			}
			, apple: { getReference(word,expression) {
					return { name : "apple" };
				}
			}
			, banana : { getReference( word,expression) {
					return {
						name : "banana"
					};
				}
			}
		} );

