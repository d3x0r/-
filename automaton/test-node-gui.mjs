
"use strict";

//var sack = require( "../sack-gui" );
import sack from "../sack-gui" 
console.log( "SACK:", sack );
var disk = sack.Volume();


import Brain from "./brain.mjs";

var brain = Brain();

var a = brain.Neuron();
var b;
a.attach( b = brain.Neuron() );
var c;
b.attach( c = brain.External( ()=>3 ));

var o;
b.attach( o = brain.Oscillator() );
o.freq = 60;

console.log( a.value );
console.log( a.value );
console.log( a.value );
console.log( a.value );
console.log( a.value );
console.log( a.constructor );

var start = Date.now();
for( var n = 0; n < 1000000; n++ ) {
	brain.step();
}
console.log( "1m took:", Date.now() - start );