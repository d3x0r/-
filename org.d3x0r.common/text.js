/*jslint
    white:true, maxerr: 100, node
*/
"use strict";

/* copyright d3x0r; part of javascript/org.d3x0r.common
  ported from SACK ( github.com/d3x0r/SACK/src/typelib/text.c )
*/

/* usage
 *   var text = require( 'text.js' );
 *   var someText = Text( "some sort of text string" );
 *   var words = text.Parse( [Text object or String that gets converted to Text] [,punctuation [, filter_space [, bTabs,[  bSpaces]]]] ) );
 *      punctuation is a string of punctuation type characters (except . which is always treated as elipses ) *
 *      filter_Space is a string of space type characters
 *      bTabs is a boolean whether to keep tabs or count them.
 *      bSpaces is a boolean wheter to keep spaces or count them. // unimplmented
 *
 *
 *   String( someText ) === "some sort of text string"
 *   String( text.Parse( someText ) ) === "some sort of text string"
 */


// In this final implementation - it was decided that for a general
// library, that expressions, escapes of expressions, apostrophes
// were of no consequence, and without expressions, there is no excess
// so this simply is text stream in, text stream out.

// these are just shortcuts - these bits of code were used repeatedly....


const normal_punctuation=("\'\"\\({[<>]}):@%/,;!?=*&$^~#`");
//static CTEXTSTR not_punctuation;
//console.log( normal_punctuation )

const tab = "\t";
const space = " ";

function textString( self ) {
    if( self ) {
            //console.log(tab.repeat(self.tabs) + space.repeat(self.spaces) + self.text
            //                 + (self.next?textString( self.next ):"") );
            return   tab.repeat(self.tabs) + space.repeat(self.spaces) + self.text
                            + (self.indirect?textString( self.indirect ):"")
                             + (self.next?textString( self.next ):"");
           }
    return ""; }


var Text = exports.Text = function Text( def ) {
	var text= {tabs:def&&def.tabs||0, spaces:def&&def.spaces||0, flags:0
            , text : ( def && def.text === null )?null:def && def.text || def || ""
            , next: null
        	, pred: null
            , indirect : null
			, append : (seg)=>{ if( seg ) { var end=text;while( end.next)end=end.next;seg.pred = text; end.next = seg; } return seg; }
            , break : ()=>{ var result; if( result = text.next ) { text.next = null; result.pred = null; return result } return null; }
            , breakBefore : ()=>{ var result; if( result = text.pred ) { text.pred = null; result.next = null; return result } return null; }
            , breakAndSpliceTo : (start)=>{ var result; if( result = text.pred ) { text.pred = start; result.next = null; start.next = text; return result } return null; }
            , forEach : (callback)=>{ var cur = text; while( cur ) { callback(cur); cur = cur.next; } }
        	, toString : ()=>{ var t = text;
				while( t && t.pred ) t = t.pred;
				return textString( t ); }
            , clone : () => {
                    			var t = Text();
                    			t.spaces = seg.spaces;
                    			t.tabs = seg.tabs;
                    			t.text = seg.text;
                    			return t;
                    		}
            , Next : () => { if( !this || !text ) return null; return text.next  }
            , first : () => { var cur = text; while( cur.pred ) cur = cur.pred; return cur; }
        }
    return text;
}


function Next( wordref ) {
	if( wordref.word ) return wordref.word.Next();
	return null;
}
function SegAppend( _this, that ) { if( _this === null ) return that; return _this.append( that ); }




exports.Parse = function TextParse( input, punctuation, filter_space, bTabs, bSpaces )
// returns a TEXT list of parsed data
{
    if( !filter_space ) filter_space = " \t\r"
    if( !punctuation ) punctuation = normal_punctuation;
	if (!input)        // if nothing new to process- return nothing processed.
		return null;
	if( typeof( input ) === 'string' ){ input = Text( input ); }
	if( Object.getPrototypeOf( input).constructor.name === 'Buffer' ){ input = Text( input.toString() ); }

	var out = { collect: Text()
	          , getText:()=>{
				  if( !out.collect || ( out.collect.tabs===0 && out.collect.spaces===0 && out.collect.text==="" ) )
			 		return null;
					var tmp = out.collect; out.collect = Text(); return tmp; } };
	var outdata= null,
	      word;
	var has_minus = -1;
	var has_plus = -1;

	var index;
	var codePoint;

	var elipses = false;
	var spaces = 0;
	var tabs = 0;

    //console.log( out );
    //console.log( input );

	function SET_SPACES( word ) {
		//if( word ) {
		word.tabs = tabs;
		word.spaces = spaces;
        //console.log( `set spaces ${word.tabs} ${word.spaces}  '${word.text}'`)
		tabs = 0;
		spaces = 0;
		//}
		return word;
	}

	function collapse() {
		if( out.collect.text.length > 0 ) {
			outdata = SegAppend( outdata, SET_SPACES( out.getText() ) );
		}
	}
	function defaultChar() {
		if( elipses )
		{
			if( ( word = out.getText() ) )
				outdata = SegAppend( outdata, SET_SPACES( word ) );
			elipses = FALSE;
		}
		out.collect.text += character;
        // characters are added at this point.
        //console.log( `out collect is '${out.collect.text}'`);
	}


	function NextChar() {
        	//console.log( `NextChar and... ${index} ${input.text} ${input.text.length} ` );
        	if( index < (input.text.length - 1) ) {
	        	var codePoint = input.text.codePointAt( index + 1 );
		      	var character = String.fromCodePoint( codePoint );
	        	return character;
                } else {
                	return "";
                }
        }

    function normalPunctuation() {
        if( ( word = out.getText() ) )
        {
            outdata = SegAppend( outdata, SET_SPACES( word ) );
            out.collect.text += character;
            outdata = SegAppend( outdata, out.getText() );
        }
        else
        {
            out.collect.text += character;
            outdata = SegAppend( outdata, SET_SPACES( out.getText() ) );
        }
    }
	while( input )
	{
		//Log1( ("Assuming %d spaces... "), spaces );
		//console.log( "input is : ",input, typeof input, Object.getPrototypeOf(input).constructor.name );
		for (index=0;(codePoint = (input.text).codePointAt( index )),
                   (index < input.text.length); index++) // while not at the
                                         // end of the line.
		{
			var character = String.fromCodePoint( codePoint );
			if( codePoint > 0xFFFF ) index++;
			if( elipses && character != '.' )
			{
				outdata = SegAppend( outdata, SET_SPACES( out.getText() ) );
				elipses = false;
			}
			else if( elipses ) // elipses and character is . - continue
			{
				out.collect.text += character;
				continue;
			}
			if( filter_space.includes( character ) )
			{
				if( ( word = out.getText() ) )
				{
					outdata = SegAppend( outdata, SET_SPACES( word ) );
				}
				spaces++;
			}
			else if( punctuation.includes( character ) )
			{
                normalPunctuation();
			}
			else switch(character)
			{
			case '\n':
				if( ( word = out.getText() ) )
				{
					outdata = SegAppend( outdata, SET_SPACES( word ) );
				}
				outdata = SegAppend( outdata, Text() ); // add a line-break packet
				break;
			case ' ':
				collapse();
				spaces++;
				break;
			case '\t':
				if( bTabs )
				{
					if( ( word = out.getText() ) )
					{
						outdata = SegAppend( outdata, SET_SPACES( word ) );
					}
					if( spaces )
					{
						//lprintf( ("Input stream has mangled spaces and tabs.") );
						spaces = 0; // assume that the tab takes care of appropriate spacing
					}
					tabs++;
				}
				else {
					defaultChar();
				}
				break;
			case '\r': // a space space character...
				if( ( word = out.getText() ) )
				{
					outdata = SegAppend( outdata, SET_SPACES( word ) );
				}
				break;
			case '.': // handle multiple periods grouped (elipses)
				//goto NormalPunctuation;
				{
					let c;
					if( ( !elipses &&
						  ( c = NextChar() ) &&
						  ( c === '.' ) ) )
					{
						if( ( word = out.getText() ) )
						{
							outdata = SegAppend( outdata, SET_SPACES( word ) );
						}
						out.collect.text += '.';
						elipses = true;
						break;
					}
					if( ( c = NextChar() ) &&
						( c >= '0' && c <= '9' ) )
					{
						// gather together as a floating point number...
						out.collect.text += character;
						break;
					}
				}
                normalPunctuation();
                break;
			case '-':  // work seperations flaming-long-sword
				if( has_minus == -1 )
					if( !punctuation || punctuation.includes( '-' ) )
						has_minus = 1;
					else
						has_minus = 0;
				if( !has_minus )
				{
					out.collect.text += '-';
					break;
				}
			case '+':
				{
					let c;
					if( has_plus == -1 )
						if( !punctuation || punctuation.includes ( '+' ) )
							has_plus = 1;
						else
							has_plus = 0;
					if( !has_plus )
					{
						out.collect.text += '+';
						break;
					}
					if( ( c = NextChar() ) &&
						( c >= '0' && c <= '9' ) )
					{
						if( ( word = out.getText() ) )
						{
							outdata = SegAppend( outdata, SET_SPACES( word ) );
							// gather together as a sign indication on a number.
						}
						out.collect.text += character;
						break;
					}
				}
				if( ( word = out.getText() ) )
				{
					outdata = SegAppend( outdata, SET_SPACES( word ) );
					out.collect.text += character;
					word = out.getText();
					outdata = SegAppend( outdata, word );
				}
				else
				{
					out.collect.text += character;
					word = out.getText();
					outdata = SegAppend( outdata, SET_SPACES( word ) );
				}
				break;
			default:
				defaultChar();
				break;
			}
		}
		input=input.next;
	}

	if( ( word = out.getText() ) ) // any generic outstanding data?
	{
		outdata = SegAppend( outdata, SET_SPACES( word ) );
	}

	while( outdata && outdata.pred ) outdata = outdata.pred;
	return(outdata);
}
