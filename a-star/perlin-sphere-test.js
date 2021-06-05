import {SaltyRNG} from "./salty_random_generator.js"

import {noise} from "./perlin-sphere.js"
import {lnQuat} from "./lnQuatSq.js"

var config = {
	patchSize : 128,
	seed_noise : null,
	gen_noise : null,
	nodes : [],  // trace of A*Path
	base : 0,
	generations : 2,
	seed : '' + Date.now(),
	cache : [],  // pool used to cache perlin coordinates
}

let counter = 0;
const CUBE_ELEMENT_SIZE = 16

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
		config.canvas3 = document.getElementById( "testSurfacesOne" );
		config.canvas3.width = 256*6;
		config.canvas3.height = 256*2+3;
		config.ctx3 = config.canvas3.getContext("2d" );
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
var wO = 0;
var hO = 0;

var myNoise = [];
init( config );

function init( config ) {
	if( config.lib ) {
	} else {
	}
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
		draw();
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
		const oh = _output.height;
		const ow = _output.width;
		for( var h = 0; h < oh; h++ )
		{
			//output_offset =  + ( surface.height - h - 1 ) * surface.width;
			for( var w = 0; w < ow; w++ )
			{
				var here = noise.get( (w+wO), (h+hO), h2, s );
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

	}

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
				var here = noise.get( (w+wO+offset), (h+hO+offset2), h2, s+6 );
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



function deg2rad(x) { return x * Math.PI / 180.0 }


function makeDrawer( size ) {

	const eqOffset = 5;
	const width = size*6+1;
	const height = size*2+7;

	function plotTo( lat, long, alt ) {
		
		const out = [];
		alt = alt || 0;
		const sect = Math.floor(long/lat);
		const lng  = long%(lat);
		const qlat = lat/(size*3)*Math.PI;

		if( lat === 0 ) {
			// 'north' pole.. 4 peaks
			if( alt === 0 )
				out.push( { lat:0,lng:0, x:0, y:eqOffset });
			if( alt === 1 )
				out.push( { lat:0,lng:Math.PI*2/3, x:size*2, y:eqOffset });
			if( alt === 2 )
				out.push( { lat:0,lng:Math.PI*4/3, x:size*4, y:eqOffset });
			if( alt === 3 )
				out.push( { lat:0,lng:0, x:size*6, y:eqOffset });
		} else if( lat === 3*size ){
			// 'south' pole.. 3 peaks
			if( alt === 0 )
				out.push( { lat:qlat,lng:0, x:size*1, y:size-1 + 1 });
			if( alt === 1 )
				out.push( { lat:qlat,lng:Math.PI*2/3, x:size*3, y:size-1 + 1 });
			if( alt === 2 )
				out.push( { lat:qlat,lng:Math.PI*4/3, x:size*5, y:size-1 + 1 });
		} else if( lat < size ) {
			const qlng = (sect * deg2rad(60)) + lng * (deg2rad(30)/(lat||1))*2;
			// north polar patches...
			{
				const y = lat+5;
				if( sect & 1 ) {
					//if( sect !== 5 ) return[];
					
					if( lng === 0 ){
						if( sect === 5 && lat == 1 ) {
							if( alt === 2 ) {
								if(0) // duplicate right to left (not anymore)
								out.push( {lat:qlat,lng:qlng, x:0,y:y})
							}
						}
						
						if( alt === 1 ) {
							out.push( {lat:qlat,lng:qlng, x:((sect+1)*size) -(lat-1),y:y})
							//console.log( "pushed:", out );
						}
						if( alt === 0 ) {
							// duplicate bottom to top...
							out.push( {lat:qlat,lng:qlng, x:(sect-1)*size+lat+lng,y:y})
						}
					} else {
						// this is the vertical line between two patches, and the triangle fill.
						if(alt === 0)
							out.push( {lat:qlat,lng:qlng, x:(sect+1)*size-lat+lng+1,y:y})

						if( alt === 1 ) {
							// copy to top?
							//out.push( {lat:qlat,lng:qlng, x:(sect-1)*size+lat,y:y})
						}

						if( alt === 1 ) {
							if( sect === 5 ){
								out.push( {lat:qlat,lng:qlng, x:0,y:y})

							}
						}
						//out.push( {lat:qlat,lng:qlng, x:(sect+1)*size-lng,y:2+lat})
					}
				}else {
					// even pole sector...
					//console.log( "do:", lat, long, lng );
					if( lng === 0 ){
						// this is the vertical line between two patches
						if(alt === 0) 
							out.push( {lat:qlat,lng:qlng, x:sect*size+lng,y:y})
						if( alt === 1 ) {
							// duplicate left to right... 
							if( sect === 0 )
								out.push( {lat:qlat,lng:qlng, x:6*size,y:y, c:[0,255,0,255]})

						}
					} else if( lng === (lat-1) ){
						if(alt === 0) {
							// 0 is done above...
							out.push( {lat:qlat,lng:qlng, x:sect*size+lng,y:y})
							//console.log( "point:", out );
						}
						if(alt === 1)
							out.push( {lat:qlat,lng:qlng, x:(sect+2)*size-lng,y:y-1, c:[0,255,255,255]})

					} else // lng > 0 and < lat-1
					{
						if(alt === 0)
							out.push( {lat:qlat,lng:qlng, x:(sect)*size+lng,y:y})
						//else
						//	out.push( {lat:qlat,lng:qlng, x:2+(sect)*size-lat+lng+y,y:y+1})
					}
					
				}
			}
			
		}
		else if(  lat <= 2*size ) {
			const sect = Math.floor(long/size);
			const lng  = long%(size);
			//if( sect != 1 ) return [];
			const qlng = (sect * deg2rad(60)) + lng * (deg2rad(60)/(size));
			if(1)
			if( lat === (size*2) ) {
				// this is the bottom line mirrored to the top to match with south pole.
				if( alt & 2 ) {
					//return [];
					if( long === 0 ) {
						if(alt === 3)
							out.push( {lat:qlat,lng:qlng, x:6*(size),y:0})
						if(alt === 2)
							out.push( {lat:qlat,lng:qlng, x:6*(size),y:eqOffset + lat})
					}else if( long === (size*6-1)) {
						if(alt === 3)
							out.push( {lat:qlat,lng:qlng, x:0, y:0})
						if(alt === 2)
							out.push( {lat:qlat,lng:qlng, x:0, y:eqOffset + lat})
					}
				}else {
					if(alt === 1)  {
						out.push( {lat:qlat,lng:qlng, x:sect*(size)+lng,y:0})
					}
					if(alt === 0)
						out.push( {lat:qlat,lng:qlng, x:sect*(size)+lng,y:eqOffset + lat})
				}
			}else{
				if(alt === 1){
					if( long === 0 )
						out.push( {lat:qlat,lng:qlng, x:6*(size),y:eqOffset + lat})
					else if( long === (size*6-1) ){
						if(0)  // duplicate right to left... (not anymore)
							out.push( {lat:qlat,lng:qlng, x:0,y:eqOffset + lat})
					}
				}
				if(alt === 0)
					out.push( {lat:qlat,lng:qlng, x:sect*(size)+lng,y:eqOffset + lat})
			}
		}
		else { //if( lat < 3*size ) {
			let nlat = (3*size-(lat));
			const sect = Math.floor(long/(nlat));
			const lng  = long%(nlat);
			const qlng = (sect * deg2rad(60)) + lng * (deg2rad(30)/(nlat||1))*2;
			const y = (size-nlat)-1;// + size*2;
			{

				if( sect & 1 ) {
					if( lng === 0 ){
						// this is a vertical line...
						if( alt === 0 )
							out.push( {lat:qlat,lng:qlng, x:(sect)*size+lng,y:y+1})
						//console.log( "OUT:", lat, long, qlat, qlng)
					} else if( lng === (nlat-1) ){
						
						if( alt === 0 )
							out.push( {lat:qlat,lng:qlng, x:(sect)*size+lng,y:y+1})
						if(alt === 1)
							if( sect === 5 )
								out.push( {lat:qlat,lng:qlng, x:(sect-4)*size-lng-1,y:2+y})
							else
								out.push( {lat:qlat,lng:qlng, x:(sect+2)*size-lng-1,y:2+y})
							
					} else // lng > 0 and < lat-1
					{
						if( alt === 0 )
							out.push( {lat:qlat,lng:qlng, x:(sect)*size+lng,y:y+1})
					}
				}else {
					//if( sect != 2 ) return [];
					//if(0)
					//console.log( "Blah", sect, lng, lat, nlat );
					if( lng === 0 ){
									
						if( alt === 0 )
							out.push( {lat:qlat,lng:qlng, x:1+(sect)*size+y,y:y+1})
						if(alt === 1)
							if( sect )
								out.push( {lat:qlat,lng:qlng, x:(sect)*size-lng-y-1,y:y+1})
							else
								out.push( {lat:qlat,lng:qlng, x:(sect+5)*size-lng+nlat,y:y+1})

					} else if( lng === (nlat-1) ){
						if( alt === 0 )
							out.push( {lat:qlat,lng:qlng, x:(sect+1)*size-1,y:y+1})
						//console.log( "OUT2:", nlat, lat, long, qlat, qlng)
					} else // lng > 0 and < lat-1
					{
						if( alt === 0 )
							out.push( {lat:qlat,lng:qlng, x:1+(sect)*size+lng+y,y:y+1})
					}
					
				}
			}
		}
		return out;
	}
	function uvPlotTo( lat,long,alt ) {
		let out = plotTo( lat, long, alt );
		if( alt && !out.length )
			out = plotTo( lat, long, 0 );
		if( out.length ) {
			out[0].x = out[0].x/width;
			// y is inverted??
			out[0].y = 1 - out[0].y /height;
		}
		return out[0];
	}

	const drawer = {
		plot : plotTo,
		uvPlot : uvPlotTo
	}
	return drawer;
}



function draw() {
	const size = 128;
	const dr = makeDrawer( size );
	let lat, long;
	config.canvas3.width = size*6+1;
	config.canvas3.height = size*2+5;
	config.ctx3 = config.canvas3.getContext("2d" );
	config.ctx3.imageSmoothingEnabled = false;
	config.ctx3.webkitImageSmoothingEnabled = false;
	config.ctx3.mozImageSmoothingEnabled = false;
	//config.canvas3.style.width = "512"
	var _output = config.ctx3.getImageData(0, 0, config.canvas3.width,  config.canvas3.height);
	var output = _output.data;
	const lnQ = new lnQuat();
	const latlen = size*3;

	for( lat = 0; lat <= latlen; lat++ ) {
		let len;
		// real angle for said line

		if( lat < size ) {
			if( !lat ) len = 1;
			else len = lat*6;
		} else if( lat <= size*2 ) {
			len = size*6;
			//console.log( "doing mid badn length:", len );
		} else {
			if( lat === (size*3))
				len = 1;
			else len = (((3*size))-lat) * 6;
		}
		if( !len ) len = 1;
		//console.log( "lat len:", lat, len,)
		for( long = 0; long < len; long++ ) {
			let alt = 0;
			//console.log( "doing:", lat, long );
			let out = dr.plot( lat, long, alt++ );
			if( !out.length ) continue;
			const pp = Math.floor( long / (size*2) );

			let qlat = out[0].lat;
			let qlng = out[0].lng;//(pp * deg2rad(120)) + (long%(size*2)) * (deg2rad(60)/((len/6)||1));

			const up = lnQ.set( {lat:qlat, lng:qlng}, true).update().up();
			var here = myNoise[0].get2( up.x*150, up.y*150, up.z*150 );
			//console.log( "check", here, len, long, size, pp, qlng*180/Math.PI, qlat*180/Math.PI)

			var c1;


			if (true) {
				const c1r1 = 0.10;
				const c1r2 = 0.36;
				const c1r3 = 0.50;
				const c1r4 = 0.63;
				const c1r5 = 0.90;
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
			/*
			c1[0] = 0;//(out[0].lat*180/Math.PI - 64) * 3;;
			c1[1] = ((out[0].lng*180/Math.PI) /360)*255;
			
			c1[2] = 0;//(out[0].lat*180/Math.PI - 64) * 3;;
			*/
			// c1[0] = (out[0].lat*255/Math.PI);;
			//c1[1] = ((out[0].lng*180/Math.PI) /360)*255;
			
			//c1[2] = 0;//(out[0].lat*180/Math.PI - 64) * 3;;
			if( out[0].c )
				c1 = out[0].c;
			const d = c1;//[255/(size*6)*lat,255/size*long,128,255]
			do {
				for( let p of out ) {
					const output_offset = (p.y*(config.canvas3.width)+p.x)*4;
					output[output_offset+0] = d[0]; 
					output[output_offset+1] = d[1]; 
					output[output_offset+2] = d[2]; 
					output[output_offset+3] = d[3]; 
			
				}
				//alt = 5;
				break;
				out =  dr.plot( lat, long, alt++ );
				if( out.length ) {
				//c1[0] = (out[0].lat*255/Math.PI);;
				//c1[1] = ((out[0].lng*180/Math.PI) /360)*255;
				
				//c1[2] = 0;//(out[0].lat*180/Math.PI - 64) * 3;;
				}
	
			} while( out.length && alt < 5 );
		}
	}

	config.ctx3.putImageData(_output, 0,0);

}


// find nearest does a recusive search and finds nodes
// which may qualify for linking to the new node (to).
// from is some source point, in a well linked web, should be irrelavent which to start from
// paint is passed to show nodes touched during the (last)search.
