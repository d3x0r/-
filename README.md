Test Grounds; some common core routines I have...

# Salty Random Genertor

   Takes some salt (some bits of either known or entropic valus) and generates a stream of bits from it.  
When the stream runs out of bits, the salt callback is invoked for more entropy and more bits are computed.
This can be used for procedural noise generation, because seed values can be specified and will re-generate the same stream of bits.
By feeding a source of randomness (the low milliseconds of a clock for instance) a bit of entropy is added... in this case 10 bits or so, which isn't very much.  Other sources of entropy may be used from other generators, or maybe another longer running generator with its own cycle?

salty_random_generator.js usage

```
  var SRG = require( 'salty_random_generator' );
  var RNG = SRG.SaltyRNG( saltingCallback );
  function saltingCallback( salt ) {
      //salt is an array.
      // push objects into the array to be used for next random generation
      // some things one might use - new Date().getTime()
      salt.push( new Date().getTim() );
  }


function doSomething () {
  var uint = RNG.getBits( [1-32 bits] );
  var arrayBuffer = RNG.getBuffer( [some number of bits...] );
   // use uint or arraybuffer values appropriately.... 
  
}
  
```

I think it might technically allows you to get 0 or less bits and return an empty value (0 or new ArrayBuffer(0) ).

RNG.compute() // function that takes salt and generates some bits
RNG.saltbuf = [] // the array that is used to communicate salt when more random bits are required.


----

#Crypted Object

crypted_object.js usage
   (requires salty_random_generator.js)
   
```
var cryptObj = require( "./crypted_object" );

// encode/decode to a text representation
var s = cryptObj.encryptObject( { some: "object" } );
// '{"some":"S:object"}'
var o = cryptObj.decryptObject( s );

// encode/decode to a pseodu-random representation
var s = cryptObj.encryptObject( { some: "object" }, ( salt )=>{ salt.push( "add RNG seed" ) } );
// 'ŔĐȔŪƶ͍ȏȷȽͿʄuƇɺ˯ňϱ\u0011_'
var o = cryptObj.decryptObject( s, ( salt )=>{ salt.push( "add RNG seed" } );

```

The method used is about 4x faster than the 'standard' ab2str (arrayBuffer to string)
The method used is about 2x faster than the 'standard' str2ab (arrayBuffer from string)



---

#Text Object

   text.js usage
   
```
    var text = require( 'text.js' );
    var someText = Text( "some sort of text string" );
    var words = text.Parse( [Text object or String that gets converted to Text] [,punctuation [, filter_space [, bTabs,[  bSpaces]]]] ) );
/*   
 *      punctuation is a string of punctuation type characters (except . which is always treated as elipses ) *
 *      filter_Space is a string of space type characters
 *      bTabs is a boolean whether to keep tabs or count them.
 *      bSpaces is a boolean wheter to keep spaces or count them. // unimplmented
 *
 *
 *   String( someText ) === "some sort of text string"
 *   String( text.Parse( someText ) ) === "some sort of text string"
 */
     var word = words;
     while( word ) {
       // process word.text
       word = word.next();
     }
 ```
 
 text Properties
 ```
    tabs   - count of tabs before the text on the segment
    spaces  - count of spaces before the text on the segment (after tabs)
    flags   - optional flags indiciting attributes of the text
    text    - the text of the current segment
    next    - next text segment
    pred    - prior text segment
    indirect - this segment shouldn't have 'text' but instead this is a list of segments which should be considered as the content of this semgent.
```
Text Methods
```
    append(segment)   - (incomplete) links the passed segment after the referenced 'this' segment.  incomplete, because if the thing being added is multiple segments, doesn't link the end segment; also if the segment being appended to is in the middle of a list of segments, this should insert the list of segments between 'here' and 'there'.
    break()    - after the current segment, unlink all following segments, return the list of segments removed.
    breakBefore() - before the current segment, unlink this and all following segments, return the prior segment which this was broken from.
    breakAndSpliceTo(start) - remove leading segments, and relink this after the segment passed as start.  (incomplete, no checking for start/end of segments for proper phrase linking.
    forEach(cb)   - for each segment from here until the end, call the callback with each text segment.
    toString()    - rewinds to the start of the string, and results with the full, unparsed string.
    clone()       - duplicate a segment's contents; does not duplicate links and other segments attached
    Next()        - safer accessor than using 'null' of a segment; (should also, but does not)handle stepping through indirect segments
    first()       - access the first segment of this text phrase.
```
