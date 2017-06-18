
var a = 'once upon a time in a land far far away'

var now = Date.now();
for( var n = 0; n < 100000; n++ ) {
	var z = [...a];
}
console.log( "Took", Date.now() - now );


var now = Date.now();
for( var n = 0; n < 100000; n++ ) {
	var z = a.split('');
}
console.log( "Took", Date.now() - now );
