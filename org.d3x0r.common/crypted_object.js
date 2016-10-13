"use strict";

// there's also 'toJSON()' method which can be defined for an object, which is called before replacer

var SRG = require( './salty_random_generator.js' );

function ab2str(buf) {
	//console.log( "what is buf?", buf, typeof( buf ) );
    return String.fromCharCode.apply(null, new Uint8Array(buf));
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

function encodeString( data ) {
			var n = 0;
			var string = "";
			for( n = 0; n < data.bytes_used; n++ ) {
				var val = data[n];
				if( !val )
					string += "\\0";
				else {
					var out = String.fromCodePoint( val );
					if( out === "\\" )
						string += "\\/";
					else if( out === "/" )
						string += "\\|";
					else
						string += out;
				}
			}

			
			var array = new ArrayBuffer(string.length);
			var escape = false;
			var out = 0;
			for( n = 0; n < string.length; n++ )
				{ var val = string.codePointAt( n );
					if( escape ) {
						if( val === 48 )
							val = 0;
						escape = false;
					}else {
						if( val == 92 ) {
							escape = true;
							continue;
						}
					}
					array[out++] = val;
				 };
				return array;
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
				if( string[n] === '\\' ) {
					if( string[n+1] === '0' )
						buffer[bytes++] = 0;
					else if( string[n+1] === '/' )
						buffer[bytes++] = '\\';
					else if( string[n+1] === '|' )
						buffer[bytes++] = '/';
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

		if( ( ( type && type.__proto__ && type.__proto__.constructor.name ) === "TypedArray" )
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
      else
         return "AB:" + encodeString( val );
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
        //console.log( "decode ", s );
    }else
        s = String.fromCharCode.apply(null, bufView );
    let obj = JSON.parse( s, reviver );

    return obj;
}
