
var sack = require( "./sack_psi_module.js" );

console.log( "got", sack );

var _b = 0;
var x_click = 0;
var y_click = 0;
var _x = 0;
var _y = 0;
var x_del = 0;
var y_del = 0;
var scale = 1.0;

var r = sack.Renderer( "test", -1, -1, 500, 500 );
console.log( "created renderer?", r );
var background = sack.Image( "the rror.jpg" );
r.on( "draw", ( image )=>{	
	console.log( "It wanted a draw...", 100+y_del, image, Object.keys(Object.getPrototypeOf(image)) ) 
        image.putImage( background, 0+x_del, 100+y_del, 100 * scale, 100 * scale );
} );

r.on( "mouse", ( event )=>{	
	console.log( "Mouse Event:", x_del, y_del, event.x, event.y, event.b );
	if( event.b & sack.button.scroll_up ) { 
		scale *= 0.1;
	} else if( event.b & sack.button.scroll_down ) { 
		scale /= 0.1;
	} else if( event.b & sack.button.left ) {
		if( !( _b & sack.button.left ) ) {
			// first down;
			x_click = event.x;
			y_click = event.y;
		} else { 
			x_del += ( event.x - _x );
			y_del += ( event.y - _y );
			r.redraw();
		}
		_x = event.x;
		_y = event.y;
		_b = event.b;
	}
} );

r.show();

console.log( 'going to call close?!' );

var process = require( 'process' );
process.on('exit', function (){
  console.log('Goodbye!');
  r.close();
});

process.on('SIGINT', function (){
  console.log('Goodbye!');
  r.close();
});
