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


var crypto = require( 'crypto' );

function MASK_TOP_MASK(length) {
   //console.log( "mask is " + ((0xFFFFFFFF) >>> (32-(length))).toString(16) );
   //return (0xFFFFFFFF) >>> (32-(length))
   //console.log( "top mask is " + ((0xFF) >>> (8-(length))).toString(16) );
   return (0xFF) >>> (8-(length))
 };

function MY_MASK_MASK(n, length) {
  //console.log( "aligned mask is ", ( ( MASK_TOP_MASK(length) << ((n)&0x3) ) & 0xFF) .toString(16) );
  return (MASK_TOP_MASK(length) << ((n)&0x3)) & 0xFF;
}
function MY_GET_MASK(v,n,mask_size)  {
     //console.log( "bit start is " + n + " size is " + mask_size, " data is ", v[n>>3].toString(16) );
        return (v[(n)>>3] & MY_MASK_MASK(n,mask_size) ) >>> (((n))&0x3)
}

exports.SaltyRNG = function( f ) {
  var RNG = {
     getSalt : f,
     compute : ()=>{ return crypto.createHash('sha256') },
     saltbuf : [],
     entropy : 0,
     available : 0,
     used : 0,
     reset() {
       //this.compute.
       this.entropy = this.compute().update( "test" ).digest();
       //console.log( "data : ", typeof( this.entropy ), this.entropy );
       this.available = 0;//this.entropy.words.length * 32;
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
            //console.log( "mask is ", tmp.toString(16), " at ", this.used );
       			this.used += get_bits;
       			if( partial_bits )
       			{
              //console.log( "partial " + partial_bits )
       				tmp = partial_tmp | ( tmp << partial_bits );
       				partial_bits = 0;
       			}
       			result[resultIndex++] = tmp;
       			bits -= get_bits;
       		}
       	} while( bits );
        /*
        {
        // debug logging, make long hex string for random buffer data
          var str = "";

          for( var x = 0; x < (_bits/32); x++ ) {
             var val = result[x].toString(16);
             console.log( "val ", val.length, "which is leading : ", "00000000".substr(  val.length ))
             str += "00000000".substr( val.length ) + val
          }
          console.log( "randomness is ", str );
          console.log( "randomness is ", result[0] );
        }
        */
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
