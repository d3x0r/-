
var sack = require( "./sack_psi_module.js" );


var r = sack.Renderer( "test", -1, -1, 500, 500 );
console.log( "renderer=", r );
var background = sack.Image( "the rror.jpg" );
console.log( "background=", r );

r.setDraw( ( image )=>{	
	console.log( "Needs to be drawn..." );
        image.putImage( background );
} );

/*
r.setMouse( ( event )=> {
	console.log( "mouse event : ", event.x, event.y, event.b );
} );

r.setKey( ( key )=> {
	console.log( "key event : ", key.toString(16) );
} );
*/

r.show();

