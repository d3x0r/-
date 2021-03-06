import {SaltyRNG} from "./salty_random_generator.js"

import {noise} from "./perlin-sphere.js"

var config = {
	patchSize : 128,
	seed_noise : null,
	gen_noise : null,
	nodes : [],  // trace of A*Path
	base : 0,
	generations : 6,
	seed : '' + Date.now(),
	cache : [],  // pool used to cache perlin coordinates
}


if( typeof document !== "undefined" ) {
	config.canvas = [document.getElementById( "testSurfacee0" ), //0
		document.getElementById( "testSurfacee1" ),
		document.getElementById( "testSurfacee2" ),
		document.getElementById( "testSurfacee3" ),
		document.getElementById( "testSurfacee4" ),
		document.getElementById( "testSurfacee5" ),
		//document.getElementById( "testSurfacee6" ),
		//document.getElementById( "testSurfacee7" ),  //7
		document.getElementById( "testSurfacen0" ),  //8
		document.getElementById( "testSurfacen1" ),  //9
		document.getElementById( "testSurfacen2" ),  //10
		//document.getElementById( "testSurfacen3" ),  //11
		document.getElementById( "testSurfaces0" ),  //12
		document.getElementById( "testSurfaces1" ),  //13
		document.getElementById( "testSurfaces2" ),  //14
		//document.getElementById( "testSurfaces3" )
		], //15
	config.canvas2 = [		//document.getElementById( "testSurfacee6" ),
		//document.getElementById( "testSurfacee7" ),  //7
		document.getElementById( "testSurfacen0a" ),  //8
		document.getElementById( "testSurfacen1a" ),  //9
		document.getElementById( "testSurfacen2a" ),  //10
		//document.getElementById( "testSurfacen3" ),  //11
		document.getElementById( "testSurfaces0a" ),  //12
		document.getElementById( "testSurfaces1a" ),  //13
		document.getElementById( "testSurfaces2a" ),  //14
		//document.getElementById( "testSurfaces3" )
		], //15
	//config.canvas = document.getElementById( "testSurface" );
        config.ctx = config.canvas.map( (c)=>c.getContext("2d") );

        config.ctx2 = config.canvas2.map( (c)=>c.getContext("2d") );
	//config.canvas2 = document.getElementById( "testSurface2" );
        //config.ctx2 = config.canvas2.getContext("2d");

} else {
	config.lib = true;
}

const BASE_COLOR_WHITE = [255,255,255,255];
const BASE_COLOR_BLACK = [0,0,0,255];
const BASE_COLOR_RED = [127,0,0,255];
const BASE_COLOR_LIGHTBLUE = [0,0,255,255];
const BASE_COLOR_LIGHTRED = [255,0,0,255];
const BASE_COLOR_LIGHTGREEN = [0,255,0,255];

var h = 0;
var h2 = 0;
var h2Target = 20;

init( config );

function init( config ) {
	if( config.lib ) {
	} else {
	}
	var myNoise = [];
	for( var n = 0; n < 12; n++ )
		myNoise.push( noise( n, config ) ); 
		var start = Date.now();
	//fillData( config );
	if( config.canvas ) {

		function delayGen(n) {
			if( n < 12 ) {
				drawData( n, myNoise[n], config );
				drawDataAlt( n, myNoise[n], config );
				setTimeout( ()=>delayGen(n+1), 0 );
			}else {
				if( 0 /*refresh noise*/ ) {
					cache.length = 0;
				// this is cached...
				   // redrawing this same thing is the same?
					config.seed = Date.now();
					console.log( "took:", Date.now() - start );
					setTimeout( ()=>delayGen(0), 1000 );
				}
			}
		}
		setTimeout( ()=>delayGen(0), 0 );

	}

     /*
	function stepPlasma() {
		config.base += 0.1;
		//genData( config );
	for( n = 0; n < 12; n++ )
		if( config.canvas[n] ) {
			drawData( n, myNoise[n], config );
		}
		//setTimeout( stepPlasma, 10 );
	}
	console.log( "FILL IS:", Date.now() - start );
	stepPlasma();
	        */

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


function drawData( s, noise, config ) {

	var _output = config.ctx[s].getImageData(0, 0, config.patchSize, config.patchSize);
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


	function stepDraw() {
		//var h;
		//var start = Date.now();
				const c1r1 = 0.10;
				const c1r2 = 0.36;
				const c1r3 = 0.50;
				const c1r4 = 0.63;
				const c1r5 = 0.90;

		output_offset = 0;//config.patchSize *h;


		for( let h = 0; h < _output.height; h++ )
		{
			const hh = 2 * ( ( h / _output.height ) - 0.5 );
			
			//output_offset =  + ( surface.height - h - 1 ) * surface.width;
			for( let w = 0; w < _output.width; w++ )
			{
				let here;
				const ww = 2 * ( ( w / _output.width ) - 0.5 );
				if( s === 0 ) {
					const x = ww * 150;
					const y = hh * 150;
					const z = Math.cos(Math.sqrt(ww*ww + hh *hh) * Math.PI/2)  * 150;

				 here = noise.get2( x, y, z, s );
				}
				else if( s === 2 ) {
					const x = ww * 75;
					const y = hh * 75;
//					const z = Math.cos(Math.sqrt(ww*ww + hh *hh) * Math.PI/2)  * 150;
					const z = 0;//Math.sqrt(ww*ww + hh *hh) * 150;

				 here = noise.get2( x, y, z, s );
				} else if( s === 1 ) {
					const x = ww * 75;
					const y = hh * 75;
//					const z = Math.cos(Math.sqrt(ww*ww + hh *hh) * Math.PI/2)  * 150;
					const z = Math.sqrt(ww*ww + hh *hh) * 100;

				 here = noise.get2( x, y, z, s );
				} else if( s === 3 ) {
					const x = ww * 75;
					const y = hh * 75;
//					const z = Math.cos(Math.sqrt(ww*ww + hh *hh) * Math.PI/2)  * 150;
					const z = 15;

				 here = noise.get2( x, y, z, s );
				}else continue;
				//var here1 = noise.get( w+wO+1000, h+hO, h2, s );
				//var here2 = noise.get( w+wO, h+hO+1000, h2, s );
				var c1,c2,c3;
   
   			if( s >= 6 && s < 9 && w > h ) {
					output_offset += 4;
					continue;
				}
   			if( s >= 9 && s < 12 && (_output.width-w) < h ) {
					output_offset += 4;
					continue;
				}
				if (true) {
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
   
			}
			
		}
	//console.log( "Rendered in:", h2, Date.now() - start );
	//h2+=1;
	/*
		hO += 10;
		wO += 10;
		if( h2 > h2Target ) {
			h2 = 0;
			h2Target += 640;
		}

	*/

	}

	//if( h == 0 )
	
	stepDraw();
	//console.trace( "Result is " );
	config.ctx[s].putImageData(_output, 0,0);


}

function drawDataAlt( s, noise, config ) {
	if( s < 6 ) return;
	s -= 6;
	var _output = config.ctx2[s].getImageData(0, 0, config.patchSize, config.patchSize);
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


	function stepDraw() {
		//var h;
		//var start = Date.now();
				const c1r1 = 0.10;
				const c1r2 = 0.36;
				const c1r3 = 0.50;
				const c1r4 = 0.63;
				const c1r5 = 0.90;

		output_offset = 0;//config.patchSize *h;
		//for( var w = _output.width-1; w >= 0 ; w-- )
		for( var w = 0; w < _output.width; w++ )
		{
			//output_offset =  + ( surface.width - w - 1 ) * surface.height;
			//for( var h = _output.height-1; h >= 0 ; h-- )
			for( var h = 0; h < _output.height; h++ )
			{
				//( _output.width - w - 1 )
				if( s < 3 ) 
					output_offset =  + w * _output.height * 4 + (_output.height-h-1)*4;
				else
					output_offset =  + ( _output.width - w - 1 ) * _output.height * 4 + (h)*4;

				var offset = s==4?2:0;//s==0?0:s==1?2:s==2?4:2;
				var offset2 = s==0?0:s==1?-2:s==2?-4:s==3?0:s==4?2:s==5?4:0;
				var here = noise.get( (w+offset), (h+offset2), h2, s+6 );
				//var here1 = noise.get( w+wO+1000, h+hO, h2, s );
				//var here2 = noise.get( w+wO, h+hO+1000, h2, s );
				var c1,c2,c3;

   			if( s < 3 && w < h ) {
					output_offset += 4;
					continue;
				}
   			if( s > 2 && (_output.width-w) > h ) {
					output_offset += 4;
					continue;
				}
   
   
				if (true) {
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
   
			}
			
		}
	//console.log( "Rendered in:", h2, Date.now() - start );
	//h2+=1;
	/*
		hO += 10;
		wO += 10;
		if( h2 > h2Target ) {
			h2 = 0;
			h2Target += 640;
		}

	*/

	}

	//if( h == 0 )
	
	stepDraw();
	//console.trace( "Result is " );
	config.ctx2[s].putImageData(_output, 0,0);


}



// find nearest does a recusive search and finds nodes
// which may qualify for linking to the new node (to).
// from is some source point, in a well linked web, should be irrelavent which to start from
// paint is passed to show nodes touched during the (last)search.
