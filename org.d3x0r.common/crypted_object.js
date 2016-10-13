"use strict";

// there's also 'toJSON()' method which can be defined for an object.


var SRG = require( './salty_random_generator.js' );
var RNG = SRG.SaltyRNG( );


function ab2str(buf) {
	//console.log( "what is buf?", buf, typeof( buf ) );
	if( buf.byteLength & 1 )
	  return String.fromCharCode.apply(null, new Uint8Array(buf));
        else
	  return String.fromCharCode.apply(null, new Uint16Array(buf));
}

function str2ab(str,skip) {
  var n = 0;
  var buf = new ArrayBuffer(str.length*2); // 2 bytes for each char
  var bufView = new Uint16Array(buf);
  for (var i=skip, strLen=str.length; i < strLen; i++) {
    bufView[n++] = str.charCodeAt(i);
  }
  return buf;
}

function replacer(key,val) {
  // this === fromObj
  //console.log( "key, val", key, val, typeof val );
  if( key ) {
  }
	if (typeof val === "string") {
		return "S:"+val;
	}
	else if (typeof val === 'number') {
		return val;  // return v * 2 for numbers
	}
  else if( val ) {
    var type = val && Object.getPrototypeOf( val );

		if( ( ( type && type.__proto__ && type.__proto__.constructor.name ) === "TypedArray" )
		   || (val instanceof ArrayBuffer && val.constructor == ArrayBuffer) ) {
    	//console.log( "buffer? ", val, val.buffer, type.constructor.name );
      if( type.constructor === Uint8Array )
        return "U8:" + ab2str( val.buffer );
      else if( type.constructor === Uint8ClampedArray )
        return "U8C:" + ab2str( val.buffer );
      else if( type.constructor === Uint16Array )
  	     return "U16:" + ab2str( val.buffer );
      else if( type.constructor === Uint32Array )
         return "U32:" + ab2str( val.buffer );
      else if( type.constructor === Int8Array )
         return "I8:" + ab2str( val.buffer );
      else if( type.constructor === Int16Array )
  	     return "I16:" + ab2str( val.buffer );
      else if( type.constructor === Int32Array )
         return "I32:" + ab2str( val.buffer );
      else if( type.constructor === Float32Array )
         return "F32:" + ab2str( val.buffer );
      else if( type.constructor === Float64Array )
  	     return "F64:" + ab2str( val.buffer );
      else
         return "AB:" + ab2str( val );
    }
  }
  return val;
}

//exports.CryptObject
//var
exports.encryptObject = function( o, salt ) {
    var RNG = new SRG.SaltyRNG( salt );
    RNG.reset();
    let s = JSON.stringify( o, replacer );
    let char_s = decodeURIComponent(escape(s));
    let l = s.length;
    //console.log( "output : ", char_s );
    let output = new ArrayBuffer( l * 2 );
    let outview = new Uint16Array( output );
    for( let i = 0; i < l; i++ ) {
        outview[i] = s.charCodeAt( i ) ^ RNG.getBits( 10 );
    }
    return String.fromCharCode.apply(null, outview);
}

function reviver( key, val ) {
  //console.log( "reviver: key-val", key, val );
  if (typeof val === 'number') {
    return val;  // return v * 2 for numbers
  }
  else if( typeof val === 'string' ) {
    if( val.startsWith( "S:" ) ) {
        return val.slice( 2 );
    } else if( val.startsWith( "AB:" ) ) {
    	var ab = str2ab( val, 3 );
      return ab;
    } else if( val.startsWith( "U8:" ) ) {
    	var ab = str2ab( val, 3 );
      return new Uint8Array( ab );
    } else if( val.startsWith( "U8C:" ) ) {
    	var ab = str2ab( val, 4 );
      return new Uint8ClampedArray( ab );
    } else if( val.startsWith( "I8:" ) ) {
    	var ab = str2ab( val, 3 );
      return new Int8Array( ab );
    } else if( val.startsWith( "U16:" ) ) {
    	var ab = str2ab( val, 4 );
      return new Uint16Array( ab );
    } else if( val.startsWith( "I16:" ) ) {
    	var ab = str2ab( val, 4 );
      return new Int16Array( ab );
    } else if( val.startsWith( "U32:" ) ) {
    	var ab = str2ab( val, 4 );
      return new Uint32Array( ab );
    } else if( val.startsWith( "I32:" ) ) {
    	var ab = str2ab( val, 4 );
      return new Int32Array( ab );
    } else if( val.startsWith( "F32:" ) ) {
    	var ab = str2ab( val, 4 );
      return new Float32Array( ab );
    } else if( val.startsWith( "F64:" ) ) {
    	var ab = str2ab( val, 4 );
      return new Float64Array( ab );
    }
  }
  return val;        // return everything else unchanged
}

exports.decryptObject = function( str, salt ) {
    var RNG = new SRG.SaltyRNG( salt );
    let l = str.length;
    var buf = new ArrayBuffer(l*2); // 2 bytes for each char
    var bufView = new Uint16Array(buf);
    for (var i=0; i < l; i++) {
        bufView[i] = str.charCodeAt(i);
    }

    let output = new ArrayBuffer( (l) * 2 );
    let outview = new Uint16Array( output );
    for( let i = 0; i < l; i++ ) {
        outview[i] = bufView[ i ] ^ RNG.getBits( 10 );
    }

    let s = String.fromCharCode.apply(null, outview );
    //console.log( "decode ", s );
    let obj = JSON.parse( s, reviver );
    return obj;
}
