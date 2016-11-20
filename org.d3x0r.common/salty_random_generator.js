"use strict";

// usage
//  var RNG = require( "salty_random_generator")( callback }
//    constructor callback is used as a source of salt to the generator
//    the callback is passed an array to which strings are expected to be added
//     ( [] )=>{ [].push( more_salt ); }
//
//    - methods on RNG
//         reset()
//                clear current random state, and restart
//
//         getBits( /* 0-31 */ )
//                return a Number that is that many bits from the random stream
//
//         getBuffer( /* 0-n */ )
//                returns a ArrayBuffer that is that many bits of randomness...


try {
var crypto = require( 'crypto' );
var compute = (s)=>{ return crypto.createHash('sha256').update(s).digest() }
} catch( err ) {
var crypto = require( './forge-sha256.js' );
var compute = (s)=>{ return crypto.forge_sha256(s); }
}


function MASK_TOP_MASK(length) {
   return (0xFF) >>> (8-(length))
 };

function MY_MASK_MASK(n, length) {
  return (MASK_TOP_MASK(length) << ((n)&0x3)) & 0xFF;
}
function MY_GET_MASK(v,n,mask_size)  {
        return (v[(n)>>3] & MY_MASK_MASK(n,mask_size) ) >>> (((n))&0x3)
}

exports.SaltyRNG = function( f ) {
  var RNG = {
     getSalt : f,
     compute : compute,
     saltbuf : [],
     entropy : 0,
     available : 0,
     used : 0,
     reset() {
       this.entropy = this.compute( "test" );
       this.available = 0;
       this.used = 0;
     },
     getBits( count ) {
       if( count > 32 )
          throw "Use getBuffer for more than 32 bits.";
        var tmp = this.getBuffer( count );
        var arr = new Uint32Array( tmp );
        return arr[0];
     },
     getBuffer ( bits ) {
       let _bits = bits;
      let resultIndex = 0;
      let resultBuffer = new ArrayBuffer( 4 * ( ( bits + 31 ) >> 5 ) );
      let result = new Uint8Array( resultBuffer );
      //console.log( "buffer is ", resultBuffer.byteLength );
      {
       	let tmp;
       	let partial_tmp;
       	let partial_bits = 0;
       	let get_bits;

       	do
       	{
       		if( bits > 8 )
       			get_bits = 8;
       		else
       			get_bits = bits;

       		// only greater... if equal just grab the bits.
       		if( get_bits > ( this.available - this.used ) )
       		{
       			if( this.available - this.used )
       			{
       				partial_bits = this.available - this.used;
       				if( partial_bits > 8 )
       					partial_bits = 8;
     					partial_tmp = MY_GET_MASK( this.entropy, this.used, partial_bits );
       			}
       			needBits();
       			bits -= partial_bits;
       		}
       		else
       		{
      			tmp = MY_GET_MASK( this.entropy, this.used, get_bits );
       			this.used += get_bits;
       			if( partial_bits )
       			{
       				tmp = partial_tmp | ( tmp << partial_bits );
       				partial_bits = 0;
       			}
       			result[resultIndex++] = tmp;
       			bits -= get_bits;
       		}
       	} while( bits );
        return resultBuffer;
      }
    }
  }
  function needBits( ) {
    RNG.saltbuf.length = 0;
    if( typeof( RNG.getSalt) === 'function')
        RNG.getSalt( RNG.saltbuf );
    RNG.entropy = RNG.compute().update( RNG.entropy.join() + RNG.saltbuf.join() ).digest();
    RNG.available = RNG.entropy.length * 8;
    RNG.used = 0;
  };
  RNG.reset();
  return RNG;
}
