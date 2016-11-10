"use strict";

// there's also 'toJSON()' method which can be defined for an object, which is called before replacer

var SRG = require( './salty_random_generator.js' );

function encodeString( data ) {
			var n = 0;
      var string = "";
      var dataView = new Uint8Array(data);
      //console.log( "Encode:", data)
      var len = data.byteLength;
      //console.log( data.bytes_used)
			for( n = 0; n < data.byteLength; n++ ) {
				var val = dataView[n];
        //console.log( "val : ", val)
				if( !val )
          string += "0";
        else if( val === 48 )
          string += "\\0";
        else if( val === 92 )
          string += "\\\\";
        else string += String.fromCharCode( val );
      }
      return string;
      /*
			var array = new Uint8Array(len);
			var out = 0;
			for( n = 0; n < data.byteLength; n++ )
				{ var val = data[n];
          if( !val ) {
              array[out++] = 92;
              array[out++] = 48;
          } else if( !val ) {
              array[out++] = 92;
              array[out++] = 92;
					}
					else array[out++] = val;
				};
				return array.buffer;
        */
}

function decodeString( string, skip ){
	var bytes = 0;
			for( var n = skip; n < string.length; n++ ){
				if( string[n] === '\\' ) {
					continue;
				} else bytes++;
			}

			var buffer = new ArrayBuffer(bytes);
			bytes = 0;
			for( var n = skip; n < string.length; n++ ){
        if( string[n] === '0' )
          buffer[bytes++] = 0;
				else if( string[n] === '\\' ) {
					if( string[n+1] === '0' )
						buffer[bytes++] = '0';
					else if( string[n+1] === '\\' )
						buffer[bytes++] = '\\';
					//else if( string[n+1] === '|' )
					//	buffer[bytes++] = '/';
					else
						throw new Error( "Invalid encoding" );
					n++;
					continue;
				}
				else
					buffer[bytes++] = string.codePointAt( n );
			}
			return buffer;
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
    var ptype = Object.getPrototypeOf(type);

console.log( "not in node?", ( ( type && ptype && ptype.constructor.name ) === "TypedArray" ));
		if( ( ( type && ptype && ptype.constructor.name ) === "TypedArray" )
		   || (val instanceof ArrayBuffer && val.constructor == ArrayBuffer) ) {
    	//console.log( "buffer? ", val, val.buffer, type.constructor.name );
      if( type.constructor === Uint8Array )
        return "U8:" + encodeString( val.buffer );
      else if( type.constructor === Uint8ClampedArray )
        return "U8C:" + encodeString( val.buffer );
      else if( type.constructor === Uint16Array )
  	     return "U16:" + encodeString( val.buffer );
      else if( type.constructor === Uint32Array )
         return "U32:" + encodeString( val.buffer );
      else if( type.constructor === Int8Array )
         return "I8:" + encodeString( val.buffer );
      else if( type.constructor === Int16Array )
  	     return "I16:" + encodeString( val.buffer );
      else if( type.constructor === Int32Array )
         return "I32:" + encodeString( val.buffer );
      else if( type.constructor === Float32Array )
         return "F32:" + encodeString( val.buffer );
      else if( type.constructor === Float64Array )
  	     return "F64:" + encodeString( val.buffer );
      else {
          //console.log( "val is ", val );
         return "AB:" + encodeString( val );
       }
    }
  }
  return val;
}

//exports.CryptObject
//var
exports.encryptObject = function( o, salt ) {
    if( salt ) var RNG = new SRG.SaltyRNG( salt );
    let s = JSON.stringify( o, replacer );
    //let char_s = decodeURIComponent(escape(s));
    //console.log( "output : ", char_s );
    if( salt ) {
        let l = s.length;
        let output = new ArrayBuffer( l * 2 );
        let outview = new Uint16Array( output );
        for( let i = 0; i < l; i++ ) outview[i] = s.charCodeAt( i ) ^ RNG.getBits( 10 );
        return String.fromCharCode.apply(null, outview);
    }else {
        return s;
    }
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
    	var ab = decodeString( val, 3 );
      return ab;
    } else if( val.startsWith( "U8:" ) ) {
    	var ab = decodeString( val, 3 );
      return new Uint8Array( ab );
    } else if( val.startsWith( "U8C:" ) ) {
    	var ab = decodeString( val, 4 );
      return new Uint8ClampedArray( ab );
    } else if( val.startsWith( "I8:" ) ) {
    	var ab = decodeString( val, 3 );
      return new Int8Array( ab );
    } else if( val.startsWith( "U16:" ) ) {
    	var ab = decodeString( val, 4 );
      return new Uint16Array( ab );
    } else if( val.startsWith( "I16:" ) ) {
    	var ab = decodeString( val, 4 );
      return new Int16Array( ab );
    } else if( val.startsWith( "U32:" ) ) {
    	var ab = decodeString( val, 4 );
      return new Uint32Array( ab );
    } else if( val.startsWith( "I32:" ) ) {
    	var ab = decodeString( val, 4 );
      return new Int32Array( ab );
    } else if( val.startsWith( "F32:" ) ) {
    	var ab = decodeString( val, 4 );
      return new Float32Array( ab );
    } else if( val.startsWith( "F64:" ) ) {
    	var ab = decodeString( val, 4 );
      return new Float64Array( ab );
    }
  }
  return val;        // return everything else unchanged
}

exports.decryptObject = function( str, salt ) {
    if( salt ) var RNG = new SRG.SaltyRNG( salt );
    let l = str.length;
    var buf = new ArrayBuffer(l*2); // 2 bytes for each char
    var bufView = new Uint16Array(buf);
    for (var i=0; i < l; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    let s;
    if( salt ) {
        let output = new ArrayBuffer( (l) * 2 );
        let outview = new Uint16Array( output );
        for( let i = 0; i < l; i++ ) { outview[i] = bufView[ i ] ^ RNG.getBits( 10 ); }
        s = String.fromCharCode.apply(null, outview );
    }else
        s = String.fromCharCode.apply(null, bufView );
    let obj = JSON.parse( s, reviver );

    return obj;
}
