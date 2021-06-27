
const generate_3D = false;
//-------------------------
// Usage : 



var config = {
	patchSize : 128,
	generations : 4,
	"2D" : true,
	left : 32,    // default left side (entry)
	right : 96,   // default right side (exit)
	nodes : [],  // trace of A*Path
	base : 0,
	seed : Date.now()
}

//import {noise} from "./perlin-min.mjs";
import {noise} from "./perlin-sphere-3.js";

if( typeof document !== "undefined" ) {
	config.canvas = document.getElementById( "testSurface" );
        config.ctx = config.canvas.getContext("2d");
	config.canvas2 = document.getElementById( "testSurface2" );
        config.ctx2 = config.canvas2.getContext("2d");

} else {
	config.lib = true;
}


const BASE_COLOR_WHITE = [255,255,255,255];
const BASE_COLOR_BLACK = [0,0,0,255];
const BASE_COLOR_DARK_BLUE = [0,0,132,255];
const BASE_COLOR_MID_BLUE = [0x2A,0x4F,0xA8,255];
const BASE_COLOR_RED = [127,0,0,255];
const BASE_COLOR_LIGHT_TAN = [0xE2,0xB5,0x71,255];    //E2B571
const BASE_COLOR_YELLOW = [255,255,0,255];
const BASE_COLOR_LIGHTBLUE = [0,0,255,255];
const BASE_COLOR_LIGHTCYAN = [0,192,192,255];
const BASE_COLOR_DARK_BLUEGREEN = [0x06, 0x51, 0x42,255];
const BASE_COLOR_LIGHTRED = [255,0,0,255];
const BASE_COLOR_LIGHTGREEN = [0,255,0,255];
const BASE_COLOR_DARK_GREEN = [0,93,0,255];
const BASE_COLOR_DARK_BROWN = [0x54,0x33,0x1c,255];  //54331C


//const RANGES = [BASE_COLOR_BLACK, BASE_COLOR_DARK_BLUE, BASE_COLOR_DARK_GREEN, BASE_COLOR_LIGHT_TAN, BASE_COLOR_DARK_BROWN, BASE_COLOR_WHITE, BASE_COLOR_BLACK ];
//const RANGES_THRESH = [0, 0.01, 0.25, 0.50, 0.75, 0.99, 1.0 ];

const RANGES = [BASE_COLOR_BLACK, BASE_COLOR_DARK_BLUE, BASE_COLOR_MID_BLUE, BASE_COLOR_LIGHT_TAN, BASE_COLOR_DARK_GREEN, BASE_COLOR_LIGHT_TAN, BASE_COLOR_DARK_BROWN, BASE_COLOR_WHITE, BASE_COLOR_BLACK ];
const RANGES_THRESH = [0, 0.02, 0.20, 0.24, 0.29, 0.50, 0.75, 0.99, 1.0 ];



var w = 0;
var h = 0;
var h2 = 0;
var h2Target = 20;
var wO = 0;
var hO = 0;


const wstride = ( 50 * Math.random() - 25 ) ;
const hstride = ( 50 * Math.random() - 25 ) ;

init( config );

function init( config ) {
	if( config.lib ) {
	} else {
	}

	var myNoise = noise( 0, config );

	if( config.canvas ) {
		drawData( myNoise, config );
	}


	function stepPlasma() {
		if( config.canvas ) {
			drawData( myNoise, config );
		}
		setTimeout( stepPlasma, 10 );
	}
	stepPlasma();


}

function ColorAverage( a, b, i,m) {

    var c = [ (((b[0]-a[0])*i/m) + a[0])|0,
        (((b[1]-a[1])*i/m) + a[1])|0,
        (((b[2]-a[2])*i/m) + a[2])|0,
		(((b[3]-a[3])*i/m) + a[3])|0
             ]
    //c[3] -= c[1];
    //console.log( "color: ", a, b, c, i, ((b[1]-a[1])*i/m)|0, a[1], ((b[1]-a[1])*i/m) + a[1] )
    return c;//`#${(c[0]<16?"0":"")+c[0].toString(16)}${(c[1]<16?"0":"")+c[1].toString(16)}${(c[2]<16?"0":"")+c[2].toString(16)}`
}


function drawData( noise, config ) {

    var _output = config.ctx.getImageData(0, 0, config.patchSize, config.patchSize);
    var output = _output.data;
	var surface = null;
    var output_offset = 0;
	

    function plot(b,c,d) { 
		//console.log( "output at", output_offset, d )
        output[output_offset+0] = d[0]; 
        output[output_offset+1] = d[1]; 
        output[output_offset+2] = d[2]; 
        output[output_offset+3] = d[3]; 
        output_offset+=4
        //output++;
    }

var lastTick = Date.now();

function stepDraw() {
	//var h;
	var start = Date.now();
	//if
	output_offset = 0;//config.patchSize *h;
	for( h = -_output.height; h < 0; h++ )
	{
		//output_offset =  + ( surface.height - h - 1 ) * surface.width;
		for( w = -_output.width; w < 0; w++ )
		{
			var here = noise.get( 5*13*w/_output.width +wO, 5*13*h/_output.height+hO, h2 );
			var c1,c2,c3;
const c1r1 = 0.10;
const c1r2 = 0.36;
const c1r3 = 0.50;
const c1r4 = 0.63;
const c1r5 = 0.90;


if (true) {
	for( var r = 1; r < RANGES_THRESH.length; r++ ) {
			if( here <= RANGES_THRESH[r] ) {
				c1 =ColorAverage( RANGES[r-1], RANGES[r+0], (here-RANGES_THRESH[r-1])/(RANGES_THRESH[r+0]-RANGES_THRESH[r-1]) * 1000, 1000 );
				break;
			}
	}

	if(0)
			if( here <= 0.10 )
				c1 = ColorAverage( BASE_COLOR_WHITE,
												 BASE_COLOR_BLACK, (here)/(c1r1) * 1000, 1000 );
			else if( here <= 0.36 )
				c1=ColorAverage( BASE_COLOR_BLACK,
												 BASE_COLOR_LIGHTBLUE, (here-c1r1)/(c1r2-c1r1) * 1000, 1000 );
			else if( here <= 0.5 )
				c1=ColorAverage( BASE_COLOR_LIGHTBLUE,
												 BASE_COLOR_LIGHTGREEN, (here-c1r2)/(c1r3-c1r2) * 1000, 1000 );
			else if( here <= 0.63 )
				c1=ColorAverage( BASE_COLOR_LIGHTGREEN,
												 BASE_COLOR_LIGHTRED, (here-c1r3)/(c1r4-c1r3) * 1000, 1000 ) ;
			else if( here <= 0.90 )
				c1=ColorAverage( BASE_COLOR_LIGHTRED,
												 BASE_COLOR_WHITE, (here-c1r4)/(c1r5-c1r4) * 1000, 1000 ) ;
			else //if( here <= 4.0 / 4 )
				c1=ColorAverage( BASE_COLOR_WHITE,
												 BASE_COLOR_BLACK, (here-c1r5)/(1.0-c1r5) * 10000, 10000 );
}

if (false) {
			var here1 = noise.get( w+wO+1000, h+hO, h2 );
			if( here1 <= 0.01 )
				c2 = ColorAverage( BASE_COLOR_WHITE,
												 BASE_COLOR_BLACK, (here)/(0.01) * 1000, 1000 );
			else if( here1 <= 0.25 )
				c2=ColorAverage( BASE_COLOR_BLACK,
												 BASE_COLOR_LIGHTBLUE, (here-0.01)/(0.25-0.01) * 1000, 1000 );
			else if( here1 <= 0.5 )
				c2=ColorAverage( BASE_COLOR_LIGHTBLUE,
												 BASE_COLOR_LIGHTGREEN, (here-0.25)/(0.5-0.25) * 1000, 1000 );
			else if( here1 <= 0.75 )
				c2=ColorAverage( BASE_COLOR_LIGHTGREEN,
												 BASE_COLOR_LIGHTRED, (here-0.5)/(0.75-0.5) * 1000, 1000 ) ;
			else if( here1 <= 0.99 )
				c2=ColorAverage( BASE_COLOR_LIGHTRED,
												 BASE_COLOR_WHITE, (here-0.75)/(0.99-0.75) * 1000, 1000 ) ;
			else //if( here <= 4.0 / 4 )
				c2=ColorAverage( BASE_COLOR_WHITE,
												 BASE_COLOR_BLACK, (here-0.99)/(1.0-0.99) * 10000, 10000 );
}

if (false) {
			//var here2 = noise.get( w+wO, h+hO+1000, h2 );
			if( here2 <= 0.01 )
				c3 = ColorAverage( BASE_COLOR_WHITE,
												 BASE_COLOR_BLACK, (here)/(0.01) * 1000, 1000 );
			else if( here2 <= 0.25 )
				c3=ColorAverage( BASE_COLOR_BLACK,
												 BASE_COLOR_LIGHTBLUE, (here-0.01)/(0.25-0.01) * 1000, 1000 );
			else if( here2 <= 0.5 )
				c3=ColorAverage( BASE_COLOR_LIGHTBLUE,
												 BASE_COLOR_LIGHTGREEN, (here-0.25)/(0.5-0.25) * 1000, 1000 );
			else if( here2 <= 0.75 )
				c3=ColorAverage( BASE_COLOR_LIGHTGREEN,
												 BASE_COLOR_LIGHTRED, (here-0.5)/(0.75-0.5) * 1000, 1000 ) ;
			else if( here2 <= 0.99 )
				c3=ColorAverage( BASE_COLOR_LIGHTRED,
												 BASE_COLOR_WHITE, (here-0.75)/(0.99-0.75) * 1000, 1000 ) ;
			else //if( here <= 4.0 / 4 )
				c3=ColorAverage( BASE_COLOR_WHITE,
												 BASE_COLOR_BLACK, (here-0.99)/(1.0-0.99) * 10000, 10000 );
}
if( false ) {
			c1[0] = (c1[0]+c2[0]+c3[0])/4;	
			c1[1] = (c1[1]+c2[1]+c3[1])/4;	
			c1[2] = (c1[2]+c2[2]+c3[2])/4;
			c1[3] = 255;
;
}
if (true) {
			if( here <= 0.01 )
				plot( w, h, c1 );//ColorAverage( BASE_COLOR_WHITE,
						//						 BASE_COLOR_BLACK, (here)/(0.01) * 1000, 1000 ) );
			else if( here <= 0.25 )
				plot( w, h, c1 );//ColorAverage( BASE_COLOR_BLACK,
						//						 BASE_COLOR_LIGHTBLUE, (here-0.01)/(0.25-0.01) * 1000, 1000 ) );
			else if( here <= 0.5 )
				plot( w, h, c1 );//ColorAverage( BASE_COLOR_LIGHTBLUE,
						//						 BASE_COLOR_LIGHTGREEN, (here-0.25)/(0.5-0.25) * 1000, 1000 ) );
			else if( here <= 0.75 )
				plot( w, h, c1 );//ColorAverage( BASE_COLOR_LIGHTGREEN,
						//						 BASE_COLOR_LIGHTRED, (here-0.5)/(0.75-0.5) * 1000, 1000 ) );
			else if( here <= 0.99 )
				plot( w, h, c1 );//ColorAverage( BASE_COLOR_LIGHTRED,
						//						 BASE_COLOR_WHITE, (here-0.75)/(0.99-0.75) * 1000, 1000 ) );
			else //if( here <= 4.0 / 4 )
				plot( w, h, c1 );//ColorAverage( BASE_COLOR_WHITE,
						//						 BASE_COLOR_BLACK, (here-0.99)/(1.0-0.99) * 10000, 10000 ) );
}
			//plot( w, h, ColorAverage( BASE_COLOR_BLACK,
			//									 BASE_COLOR_LIGHTRED, (here) * 1000, 1000 ) );
			//console.log( "%d,%d  %g", w, h, data[ h * surface.width + w ] );
		}
		
	}
	//console.log( "Rendered in:", h2, Date.now() - start );
	//h2+=1;

	var now = Date.now();
	var delta = ( now - lastTick );
	if( !delta ) delta = 1;
	lastTick = now;


	hO += hstride * ( delta / 100 );
	wO += wstride * ( delta / 100 );
	
	if( h2 > h2Target ) {
		h2 = 0;
		h2Target += 640;
	}

}

	//if( h == 0 )
		stepDraw();
//	console.log( "Result is %g,%g", min, max );
	config.ctx.putImageData(_output, 0,0);


}


export {noise}

// find nearest does a recusive search and finds nodes
// which may qualify for linking to the new node (to).
// from is some source point, in a well linked web, should be irrelavent which to start from
// paint is passed to show nodes touched during the (last)search.
