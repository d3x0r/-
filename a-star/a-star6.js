
var config = {
	patchSize : 512,
	seed_noise : null,
	gen_noise : null,
	ero_noise : null,
	left : 32,    // default left side (entry)
	right : 96,   // default right side (exit)
	nodes : [],  // trace of A*Path
}

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

// more water, more green, shorter tan...
//const RANGES = [BASE_COLOR_BLACK, BASE_COLOR_DARK_BLUE, BASE_COLOR_DARK_BLUE, BASE_COLOR_DARK_GREEN, BASE_COLOR_LIGHT_TAN, BASE_COLOR_DARK_BROWN, BASE_COLOR_WHITE, BASE_COLOR_BLACK ];
//const RANGES_THRESH = [0, 0.01, 0.1, 0.52, 0.60, 0.72, 0.95, 1.0 ];

	const noiseGen = [
		{ steps : 2, scalar : 1/2, corn: [0,0,0,0], dx : 0, dy : 0, cx : 0, cy : 0 },
		{ steps : 4, scalar : 1/4, corn: [0,0,0,0], dx : 0, dy : 0, cx : 0, cy : 0 },
		{ steps : 8, scalar : 1/8, corn: [0,0,0,0], dx : 0, dy : 0, cx : 0, cy : 0 },
		{ steps : 16, scalar : 1/16, corn: [0,0,0,0], dx : 0, dy : 0, cx : 0, cy : 0 },
		{ steps : 32, scalar : 1/32, corn: [0,0,0,0], dx : 0, dy : 0, cx : 0, cy : 0 },
		{ steps : 64, scalar : 1/64, corn: [0,0,0,0], dx : 0, dy : 0, cx : 0, cy : 0 },
		{ steps : 128, scalar : 1/128, corn: [0,0,0,0], dx : 0, dy : 0, cx : 0, cy : 0 },
		{ steps : 256, scalar : 1/256, corn: [0,0,0,0], dx : 0, dy : 0, cx : 0, cy : 0 },
	];
	var updatedNoiseGenerators = false;

	var oldout = [];
init( config );

function init( config ) {
	if( config.lib ) {
	} else {
	}

	config.neighbors = [];
	config.neighbors.push( { x:1, y:0, z:0 } );
	config.neighbors.push( { x:-1, y:0, z:0 } );
	config.neighbors.push( { x:0, y:1, z:0 } );
	config.neighbors.push( { x:0, y:-1, z:0 } );

	// allow diagonal?

	config.neighbors.push( { x:1, y:1, z:0 } );
	config.neighbors.push( { x:-1, y:1, z:0 } );
	config.neighbors.push( { x:1, y:-1, z:0 } );
	config.neighbors.push( { x:-1, y:-1, z:0 } );

	fillData( config );
	genData( config );
	erodeData(config);
	//for( var z = 0; z < 2; z++ ) smoothData(config);
	function tick() {
		//smoothData(config);
	erodeData(config);
		drawData( config );
		setTimeout( tick, 1000 );
	}
	tick();

	//erode( config );
	if( config.canvas ) {
		drawData( config );
	}

	var step = AStar( config );
	function tickStar(step) {
		function tick() {
			for( var n = 0; n < 50; n++ )
				step();
			setTimeout( tick, 10 );
		}
		setTimeout( tick, 100 );
	}
	tickStar(step);


}




function fillData( config ) {
	var noise = [];
	for( var n = 0; n < config.patchSize; n++ ) 
		for( m = 0; m < config.patchSize; m++ ) {
			noise.push( Math.random() );
		}
	config.seed_noise = noise;
}


function erode( config ) {
	var noise = config.gen_noise;
	var outNoise = config.ero_noise || [];
	var offset = 0;
	var uo, dof, lo, ro;

	var todo = [];

	function process( offset ) {
		var here = noise[offset];
		var up = noise[uo=( offset + noise.length - config.patchSize ) %config.patchSize ];
		if( here > up ) {
			todo.push( { out : uo, from: offset } );
		}
		var down = noise[dof=( offset + config.patch_size ) %config.patchSize ];
		if( here > down ) {
			todo.push( { out : dof, from: offset } );
		}
		var left = noise[lo=( offset + config.patchSize - 1 ) %config.patchSize ];
		if( here > left ) {
			todo.push( { out : lo, from: offset } );
		}
		var right = noise[ro=( offset + 1 ) %config.patchSize ];
		if( here > right ) {
			todo.push( { out : ro, from: offset } );
		}
	}

	for( var n = 0; n < config.patchSize; n++ ) 
		for( m = 0; m < config.patchSize; m++ ) {
			process( offset );
			offset++;
		}

	while( move = todo.pop() ) {
		var here = noise[move.from];
		var up = noise[move.out];
		outNoise[move.out] = ( here - up ) / 3 + up
		outNoise[move.from] = up - ( here - up ) / 3;
		//process( move.from );
		process( move.out );
	}
	config.ero_noise = noise;	
}	


function erodeData( config ) {
	var flowmap = [];
	var noise = config.gen_noise;
	var out;

	for( var cycle =0; cycle< 1; cycle++ ) {	
		out = [];
			var tx;
			var ty;
		for( var n = 0; n < noise.length; n++ ) {
			var x = ( n % config.patchSize );
			var y = ( n / config.patchSize )|0;
			tx = 0;
			ty = 0;
  	  		var c = 0;
			if( x )  {
				tx -= noise[n] - noise[n-1];
				if( y ) {
					ty -= noise[n] - noise[n -1 -config.patchSize] * 1.414/2;
				}
				if( y < (config.patchSize-1) ) {
					ty += noise[n] - noise[n -1 +config.patchSize] * 1.414/2;
				}
			}
			if( y )  {
				ty -= noise[n] - noise[n-config.patchSize];
				c++;
			}
			if( x < (config.patchSize-1) )  {
				tx += noise[n] - noise[n+1];
				if( y ) {
					ty -= noise[n] - noise[n +1 -config.patchSize] * 1.414/2;
				}
				if( y < (config.patchSize-1) ) {
					ty += noise[n] - noise[n +1 +config.patchSize] * 1.414/2;
				}
			}
			if( y < (config.patchSize-1) )  {
				ty += noise[n] - noise[n+config.patchSize];
				c++;
			}
			out.push( { dx:tx, dy:ty, here:n, d : Math.sqrt( tx * tx + ty * ty ) } );
		}

		if( oldout.length ) {
			for( var n = 0; n < out.length; n++ ) {
				let cx = n % config.patchSize;
				let cy = ( n / config.patchSize ) | 0;
				out[n].dx += oldout[n].dx * 0.1;
				out[n].dy += oldout[n].dy * 0.1;
/*
				if( oldout[n].dx > 0 ) {
					if( cx < config.patchSize-1 ) {
						out[n+1].dx += oldout[n].dx * 0.4;
					}
				} else {
					if( cx > 0 ) {
						out[n-1].dx += oldout[n].dx * 0.4;
					}
				}
				if( oldout[n].dy > 0 ) {
					if( cy < config.patchSize-1 ) {
						out[n+config.patchSize].dy += oldout[n].dy * 0.4;
					}
				} else {
					if( cy > 0 ) {
						out[n-config.patchSize].dy += oldout[n].dy * 0.4;
					}
				}
*/
				out[n].d = Math.sqrt( out[n].dx * out[n].dx + out[n].dy * out[n].dy )
			}	
		}

		oldout = out;
		for( var n = 0; n < out.length; n++ ) {
			let cx = n % config.patchSize;
			let cy = ( n / config.patchSize ) | 0;

			noise[n] -= out[n].d * out[n].d/3;

			if( out[n].dx > 0 ) {
				if( cx < config.patchSize-1 ) {
					noise[n+1] += out[n].dx * out[n].d/6;
				}
			} else {
				if( cx > 0 ) {
					noise[n-1] -= out[n].dx * out[n].d/6;
				}
			}
			if( out[n].dy > 0 ) {
				if( cy < config.patchSize-1 ) {
					noise[n+config.patchSize] += out[n].dy * out[n].d/6;
				}
			}else {
				if( cy > 0 ) {
					noise[n-config.patchSize] -= out[n].dy * out[n].d/6;
				}
			}
		}
		
		
	}
	//config.gen_noise = out;
}



function smoothData1( config ) {
	var noise = config.gen_noise;
	var out = []
	for( var n = 0; n < noise.length; n++ ) {
		var x = ( n % config.patchSize );
		var y = ( n / config.patchSize )|0;
		var t = 0;
  		var c = 0;
		if( x )  {
			t += noise[n-1];
			c++;
		}
		if( y )  {
			t += noise[n-config.patchSize];
			c++;
		}
		if( x < (config.patchSize-1) )  {
			t += noise[n+1];
			c++;
		}
		if( y < (config.patchSize-1) )  {
			t += noise[n+config.patchSize];
			c++;
		}
		out.push( t/c );
	}
	config.gen_noise = out;
}

function smoothData( config ) {
	var noise = config.gen_noise;
	var out = []
	for( var n = 0; n < noise.length; n++ ) {
		var h = noise[n];
		var x = ( n % config.patchSize );
		var y = ( n / config.patchSize )|0;
		var t = 0;
  		var c = 0;
		if( x )  {
			t = noise[n-1];
			if( h > t ) {
				noise[n-1] += (h-t)/3;
				noise[n] -= (h-t)/3;
			} else {
				noise[n] += (h-t)/3;
				noise[n-1] -= (h-t)/3;
			}
			c++;
		}
		if( y )  {
			t = noise[n-config.patchSize];
			if( h > t ) {
				noise[n-config.patchSize] += (h-t)/3;
				noise[n] -= (h-t)/3;
			} else {
				noise[n] += (h-t)/3;
				noise[n-config.patchSize] -= (h-t)/3;
			}
			c++;
		}
		if( x < (config.patchSize-1) )  {
			t = noise[n+1];
			if( h > t ) {
				noise[n+1] += (h-t)/3;
				noise[n] -= (h-t)/3;
			} else {
				noise[n] += (h-t)/3;
				noise[n+1] -= (h-t)/3;
			}
			c++;
		}
		if( y < (config.patchSize-1) )  {
			t = noise[n+config.patchSize];
			if( h > t ) {
				noise[n+config.patchSize] += (h-t)/3;
				noise[n] -= (h-t)/3;
			} else {
				noise[n] += (h-t)/3;
				noise[n+config.patchSize] -= (h-t)/3;
			}
			c++;
		}
		//out.push( t/c );
	}
	//config.gen_noise = out;
}


function genData( config ) {
	var noise = config.seed_noise;
	var outNoise = [];
	
	if( !updatedNoiseGenerators  ) {
		updatedNoiseGenerators = true;
		for( var n = 0; n < noiseGen.length; n++ ) {
			var gen = noiseGen[n];
			if( n < 4 )
				gen.scalar /= 2;
			if( n > 6 )
				gen.scalar *= 5;
			//	gen.scalar *= 4;
		}
		noiseGen[0].scalar = 0.1;
		//noiseGen[6].scalar = 20;
	}

	var maxtot = 0;
	var minVal = Infinity;
	var maxVal = 0;
	for( var n = 0; n < noiseGen.length; n++ ) {
		var gen = noiseGen[n];
		//gen.scalar *= 2 ;
		//gen.steps *= 2 ;
		gen.dirty = true;
		gen.pitch = config.patchSize / gen.steps;
		gen.dx = gen.dy = 1/(config.patchSize/gen.steps);
		maxtot += gen.scalar;
	}
	//noiseGen[0].scalar = 0.4
	//noiseGen[6].scalar = 0.0225
	//console.log( "MAX TOTAL:", maxtot );

	//console.log( "MAX TOTAL:", noiseGen );

	for( var x = 0; x < config.patchSize; x++ ) {
		 
		// Y will be 0 at the same time this changes...  which will update all anyway
		for( var n = 0; n < noiseGen.length; n++ ) {
			var gen = noiseGen[n];
			if( !( x  / gen.pitch % 1 ) ) {
				gen.cx = 0;
				//gen.dirty = true;
			}
		}
		
		for( y = 0; y < config.patchSize; y++ ) {

			for( var n = 0; n < noiseGen.length; n++ ) {
				var gen = noiseGen[n];
				//console.log( "Y Test:", ( y  / gen.pitch % 1 ) );
				if( !( y  / gen.pitch % 1 ) ) {
					gen.cy = 0;
					gen.dirty = true;
				}

				if( gen.dirty ) {
					gen.dirty = false;
					gen.corn[0] = noise[ ( n + ( (gen.pitch * ((y / gen.pitch)|0)) * config.patchSize + (gen.pitch * ((x / gen.pitch)|0)) ) ) % noise.length ];
					gen.corn[1] = noise[ ( n + ( (gen.pitch * ((y / gen.pitch)|0)) * config.patchSize + (gen.pitch * ((((x+gen.pitch) / gen.pitch)|0)%gen.steps))  ) ) % noise.length];
					gen.corn[2] = noise[ ( n + ( (gen.pitch * ((((y+gen.pitch) / gen.pitch)|0)%gen.steps)) * config.patchSize + (gen.pitch * ((x / gen.pitch)|0)) ) ) % noise.length ];
					gen.corn[3] = noise[ ( n + ( (gen.pitch * ((((y+gen.pitch) / gen.pitch)|0)%gen.steps)) * config.patchSize + (gen.pitch * ((((x+gen.pitch) / gen.pitch)|0)%gen.steps))  ) ) % noise.length];

					//gen.corn[0] = noise[ ((gen.cy)   * config.patchSize + (gen.cx))   * config.patchSize];
					//gen.corn[1] = noise[ ((gen.cy)   * config.patchSize + (gen.cx+gen.dx)) * config.patchSize];
					//gen.corn[2] = noise[ ((gen.cy+gen.dy) * config.patchSize + (gen.cx))   * config.patchSize];
					//gen.corn[3] = noise[ ((gen.cy+gen.dy) * config.patchSize + (gen.cx+gen.dx)) * config.patchSize];

					/*
					if( n == 0 ) {
						console.log(  "  GEN:", gen, x, y, (gen.pitch * ((x / gen.pitch)|0)), (gen.pitch * (((x / gen.pitch)|0)%gen.steps)), (((y+gen.pitch) / gen.pitch)|0)%gen.steps );
						console.log( gen.corn[0] ,  (gen.pitch * (y / gen.pitch)|0) * config.patchSize, (gen.pitch * (x / gen.pitch)|0) );
						console.log( gen.corn[1] ,  (gen.pitch * (y / gen.pitch)|0) * config.patchSize, (gen.pitch * ((x+gen.pitch) / gen.pitch)|0) );
						console.log( gen.corn[2] ,  (gen.pitch * ((y+gen.pitch) / gen.pitch)|0) * config.patchSize, (gen.pitch * (x / gen.pitch)|0) );
						console.log( gen.corn[3] ,  (gen.pitch * ((y+gen.pitch) / gen.pitch)|0) * config.patchSize, (gen.pitch * ((x+gen.pitch) / gen.pitch)|0) );
					}
					*/
				}
			}
	
			var tot = 0;
			for( var n = 0; n < noiseGen.length; n++ ) {
				var gen = noiseGen[n];
				// ((((c1)*(max-(d))) + ((c2)*(d)))/max)				
				//console.log( "gen.cx:", gen.cx );
				var value1 = gen.corn[0] * ( 1-gen.cx ) + gen.corn[1] * ( gen.cx );
				var value2 = gen.corn[2] * ( 1-gen.cx ) + gen.corn[3] * ( gen.cx );

				var value = value1 * ( 1-gen.cy ) + value2 * ( gen.cy );
				if( value > 1 ) debugger;
				//console.log( "value: ", value, value1, value2, gen.cy );
				//if( n == 0 )
				//	outNoise.push( value );
				tot += value * gen.scalar;				
			}
			//console.log( "value: ", tot );
			//outNoise.push( noiseGen[3].corn[0] );
			if( maxVal < tot ) maxVal = tot;
			if( minVal > tot ) minVal = tot;
			outNoise.push( tot );
				

			for( var n = 0; n < noiseGen.length; n++ ) {
				var gen = noiseGen[n];
				gen.cy += gen.dy;
			}	
		}
		for( var n = 0; n < noiseGen.length; n++ ) {
			var gen = noiseGen[n];
			gen.cy = 0;
			gen.cx += gen.dx;
		}
	}
	for( var n = 0; n < outNoise.length; n++ ) {
		outNoise[n] = ( ( outNoise[n] ) - minVal ) / ( maxVal-minVal);
	}
	config.gen_noise = outNoise;
}

function ColorAverage( a, b, i,m) {

    var c = [ (((b[0]-a[0])*i/m) + a[0])|0,
        (((b[1]-a[1])*i/m) + a[1])|0,
        (((b[2]-a[2])*i/m) + a[2])|0,
		(((b[3]-a[3])*i/m) + a[3])|0
             ]
    //console.log( "color: ", a, b, c, i, ((b[1]-a[1])*i/m)|0, a[1], ((b[1]-a[1])*i/m) + a[1] )
    return c;//`#${(c[0]<16?"0":"")+c[0].toString(16)}${(c[1]<16?"0":"")+c[1].toString(16)}${(c[2]<16?"0":"")+c[2].toString(16)}`
}


function drawData( config ) {

    var _output = config.ctx.getImageData(0, 0, config.patchSize, config.patchSize);
    var output = _output.data;
	var surface = null;
    var output_offset = 0;
	

    function plot(b,c,d) { 
		//console.log( "output at", output_offset, d )
        output[output_offset*4+0] = d[0]; 
        output[output_offset*4+1] = d[1]; 
        output[output_offset*4+2] = d[2]; 
        output[output_offset*4+3] = d[3]; 
        output_offset++
        //output++;
    }


	var h;
	for( h = 0; h < _output.height; h++ )
	{
		//output_offset =  + ( surface.height - h - 1 ) * surface.width;

		for( w = 0; w < _output.width; w++ )
		{
			var here3;
			var here = config.gen_noise
				//config.ero_noise
				[ h * config.patchSize + w ];
/*
			var here2 = config.gen_noise[ h * config.patchSize + (w+1)%_output.width ];
			here3 = ( here2 - here ) * 10 ;
			here2 = config.gen_noise[ ((h+1)%_output.height) * config.patchSize + (w+1)%_output.width ];
			here3 += ( here2 - here ) * 10 ;
			here2 = config.gen_noise[ h * config.patchSize + (w-1)%_output.width ];
			here3 = ( here2 - here ) * 10 ;
			here2 = config.gen_noise[ ((h-1)%_output.height) * config.patchSize + (w+1)%_output.width ];
			here3 += ( here2 - here ) * 10 ;
			here = here3;			
*/
if (true) {
	for( var r = 1; r < RANGES_THRESH.length; r++ ) {
			if( here <= RANGES_THRESH[r] ) {
				plot( w, h, ColorAverage( RANGES[r-1], RANGES[r+0], (here-RANGES_THRESH[r-1])/(RANGES_THRESH[r+0]-RANGES_THRESH[r-1]) * 1000, 1000 ) );
				break;
			}
	}
	if( false ){
			if( here <= RANGES_THRESH[1] )
				plot( w, h, ColorAverage( RANGES[0],
												 RANGES[1], (here)/(RANGES_THRESH[1]-RANGES_THRESH[0]) * 1000, 1000 ) );
			else if( here <= RANGES_THRESH[2] ) // 3
				plot( w, h, ColorAverage( RANGES[1],
												 RANGES[2], (here-RANGES_THRESH[1])/(RANGES_THRESH[2]-RANGES_THRESH[1]) * 1000, 1000 ) );
			else if( here <= 0.5 )
				plot( w, h, ColorAverage( RANGES[2],
												 RANGES[3], (here-0.25)/(RANGES_THRESH[2]-RANGES_THRESH[1]) * 1000, 1000 ) );
			else if( here <= 0.75 )
				plot( w, h, ColorAverage( RANGES[3],
												 RANGES[4], (here-0.5)/(0.75-0.5) * 1000, 1000 ) );
			else if( here <= 0.99 )
				plot( w, h, ColorAverage( RANGES[4],
												 RANGES[5], (here-0.75)/(0.99-0.75) * 1000, 1000 ) );
			else //if( here <= 4.0 / 4 )
				plot( w, h, ColorAverage( RANGES[5],
												 RANGES[6], (here-0.99)/(1.0-0.99) * 10000, 10000 ) );
	}

}
			//plot( w, h, ColorAverage( BASE_COLOR_BLACK,
			//									 BASE_COLOR_LIGHTRED, (here) * 1000, 1000 ) );
			//console.log( "%d,%d  %g", w, h, data[ h * surface.width + w ] );
		}
	}
//	console.log( "Result is %g,%g", min, max );
	config.ctx.putImageData(_output, 0,0);


}


// find nearest does a recusive search and finds nodes
// which may qualify for linking to the new node (to).
// from is some source point, in a well linked web, should be irrelavent which to start from
// paint is passed to show nodes touched during the (last)search.

function AStar( config ) {
	var from = { x:0, y:(Math.random()*config.patchSize)|0, z:0 };
	var to = { x : config.patchSize-1, y : (Math.random()*config.patchSize)|0, z: 0 };
	return doAStar( config.nodes, [], null, from, to, 0 );
}

function doAStar( nodes, came_from, targetNode, from,  to )
{

	var __clearTick = 0;
	var __drawTick = 0;
	function drawAStar( config, path, minpath, minH, maxH ) {
		maxH -= minH;
		if( __clearTick++ > 400 )  {
			__drawTick++;
			config.ctx2.clearRect( 0, 0, config.patchSize, config.patchSize );
			__clearTick = 0;
		}
		//config.ctx2.fillStyle = "white";
		path.forEach( node => {
			if( node._draw !== __drawTick ) {
				node._draw = __drawTick;

				var z = `#${ ( (255*(node.h-minH)/maxH)|0 ).toString(16)}${ ( (255*(node.h-minH)/maxH)|0 ).toString(16)}${ ( (255*(node.h-minH)/maxH)|0 ).toString(16)}`;
				config.ctx2.fillStyle = z;
				//console.log( "fill:", ( (255*(node.h-minH)/maxH)|0 ).toString(16) );
				node = node.node;
				config.ctx2.fillRect( node.x, node.y, 1, 1 );
			}
		} );


		config.ctx2.fillStyle = "#00f0f0";
		paths.forEach( path=>
		{
			var cur = path;
			if( cur ) 
			{
				config.ctx2.fillRect( cur.node.x, cur.node.y, 1, 1 );
				//cur = cur.parent;
			}
		} );

		config.ctx2.fillStyle = "#f000f0";
		var lastClosed = closedSet.first; 
		//for( var n = 0; lastClosed && n < 20; n++ ) 
		{
			
			var cur = lastClosed;
			//while( cur ) 
			{
				config.ctx2.fillRect( cur.node.x, cur.node.y, 1, 1 );
				//cur = cur.parent;
			}

			lastClosed = lastClosed.next;
		}		

		config.ctx2.fillStyle = "blue";
		if( minpath )
			minpath.forEach( node => {
				node = node.node;
			config.ctx2.fillRect( node.x, node.y, 1, 1 );
		} );

	}


	function dist( a, b ) {
		var x = {};
		sub2( x, a, b );
		return len(x);
	}
	function h1( here ) {
		//return dist( here, to ) * maxH;//( ( minH + maxH ) / 2);
		return dist( here, to ) * maxH/3.5;//18;// *( ( minH + maxH ) / 2);
	}


	var openSet = makeOpenSet();
	var _openSet = makeOpenSet();
	var __openSet = null;
	function makeOpenSet() {
		return {
			first : null,
			length : 0,
			add(n, g, h) {
				var newNode = { 
					node: n, 
					checked : false, 
					final : false,
					f:h1(n) + g, // dist to target, plus g (g is sum of all to here + myself hard )
					g:g, 
					h:h,
					_draw : 0,
					next : null,  // link in set
					parent : null   // link backward from success
				};
				this.link( newNode );
				this.length++;
				return newNode;
			},
			link(newNode) {
				if( !this.first )
					this.first = newNode;
				else {
					if( newNode.f < this.first.f ) {
						newNode.next = this.first;
						this.first = newNode;
					} else {
						for( var cur = this.first; cur.next && ( cur.f < newNode.f ); cur = cur.next );
						newNode.next = cur.next;
						cur.next = newNode;
					}
				}
			},
			find(n) {
				var c, _c = null;
				for( c = this.first; c && ( c.node.x != n.x || c.node.y != n.y ); (_c = c), (c = c.next) );
				if( c )
					return { node:c, prior:_c};
				return null;
			},
			pop() {
				var n = this.first;
				if( n ) {
					this.length--;
					this.first = this.first.next;
				}
				return n;
			}
		};
	}
	var closedSet = {
			first : null,
			length : 0,
			add(n) {
				n.checked = true;
				if( !this.first )
					this.first = n;
				else {
					n.next = this.first;
					this.first = n;
				}
				this.length++;
			},
			find(n) {
				var c, _c;
				for( c = this.first; c && ( c.node.x != n.x || c.node.y != n.y); _c = c, c = c.next );
				if( c )
					return { node:c, prior:_c};
				return null;
			}
		};
//debugger;
	openSet.add( from, 0, 0 );
	var check;
	var longest = [];
	var paths = [];
	function min(a,b,c) {
		var r;
		longest.push( r= { dist: a, len : b, node : c } );
		return r;
	}
	var minPath = min(Infinity,Infinity,null);
	var finalNode = null;
	var draw_skips = 0;
	//var min_dist = Infinity;
	//var min_len = Infinity;
	//var min_node = null;
	var _node;
	var maxH = 0;
	var minH = Infinity;
	var fix = 0;
	//while( check = openSet.pop() ) 
	//	tick( check );
	function scaleHeight(here) {
		//if( here > 0.5 ) return 1000000;
		return here *here * 3;
		//return ( (here) * 1000 ); 
		if( here > 0.9 ) here = 9000 + ( here - 0.9 ) * 50;
		else if( here > 0.75 ) here = 700 + ( here - 0.75 ) * 30;
		else if( here > 0.50 ) here = 50 + ( here - 0.50 ) * 20;
		else if( here > 0.25 ) here = 1 + ( here - 0.25 ) * 10;
		else here = ( here ) * 2.5;
		return here*here;
	}
	function aTick( check ) 
	{
		if( !check ) return;
		if( finalNode && check.g > finalNode.g ) 
			return;
		if( check.node.x === to.x && check.node.y == to.y ) {
			finalNode = check; 
			if( !__openSet ) {
				__openSet = openSet;
				openSet = makeOpenSet();
			}
			//minPath.node = check;
			//minPath.dist = 0;
			//openSet.first = null;
			return;
			//break;
		}
		//if( check.h > 15 ) return;
		if( draw_skips++ > 50 ) {
				draw_skips = 0;

		if( _node ) {
			var path = [];
			for( var back = _node; back; back = back.parent ) {
				path.push( back );
			}
			var minpath = [];
			for( var back = minPath.node; back; back = back.parent ) {
				minpath.push( back );
			}
			var finalpath = [];
			//if( check.
			for( var back = finalNode; back; back = back.parent ) {
				finalpath.push( back );
			}
			drawAStar( config, path, finalpath, minH, maxH );
		}
		}

		var nearness = check.f;
		
		if( nearness < minPath.dist ) {
			minPath.node = check;
			minPath.len = check.f;
			minPath.dist = nearness;
		}
		if( check.f < minPath.len ) {
			minPath.len = check.f;
			minPath.node = check;
		}
		// win condition is tough.... there is no exact answer.... 		
		closedSet.add( check );

		var fromValue = config.gen_noise[check.node.y*config.patchSize+check.node.x]
		fromValue = scaleHeight( fromValue );
		//fromValue = 10 * (fromValue) * (fromValue);

		config.neighbors.forEach( neighbor=>{
			var testX, testY;
			if( neighbor.x < 0 && check.node.x == 0 ) return;
			if( neighbor.y < 0 && check.node.y == 0 ) return;
			if( neighbor.x > 0 && check.node.x == (config.patchSize-1) ) return;
			if( neighbor.y > 0 && check.node.y == (config.patchSize-1) ) return;
			testX = check.node.x + neighbor.x;
			testY = check.node.y + neighbor.y;

			var find;
			var node;


			var here = config.gen_noise[testY*config.patchSize+testX];
			var _here = scaleHeight(here);
			if( here > 0.6 ) return;
			//here - fromHere 
			//var here = (here) * (here);
			//var resistence = _here;//( 10 + (here - fromValue ) );
			//var resistence = Math.abs( here - fromValue ) * 100;
			//if( newg > minPath.len ) return;

			var resistence = 20*(_here - fromValue + fix);

			//var resistence = 20*(_here);

			resistence *= 1.5;
			if( resistence < 0 ) 
			{
				fix -= resistence/15;
				resistence = 0;
			}
			//console.log( "--- ", resistence, _here, fromValue, _here - fromValue, fix );
			//resistence = resistence*(1+here);//*resistence*resistence*resistence;
			var newdelg = 0//dist( check.node, neighbor )
			         + ( resistence );
			var newg = newdelg
			         + check.g;
			if( newdelg > maxH ) {
				maxH = newdelg;
				console.log( "Rnage:", minH, maxH, resistence, here, here-fromValue) ;
			}
			if( newdelg < minH ) {
				minH = newdelg;
				console.log( "Rnage:", minH, maxH, resistence, here, here-fromValue) ;
			}


			if( find = closedSet.find( neighbor = {x:testX,y:testY,z:0} ) ) {
				var node = find.node;
				if( newg < node.g ) {
					node.f = ( newg + h1( neighbor ) )
					node.g = newg;
					node.h = newdelg
					if( find.prior ) {
						find.prior.next = find.next;  // unlink this
						closedSet.length--;
						openSet.link( node ); // relink into list
					} else {
						closedSet.first = find.next;
						closedSet.length--;
						openSet.link( node ); // relink into list
					}
					//console.log( "node:", node.g, newdelg );
					node.parent = check;
					{
						var path = paths.findIndex( p=>p === check );
						
						if( path >= 0 ) 
							paths[path] = node;
						else
							paths.push( node );
					}
					_node = node;
				} else {
					{
						var path = paths.findIndex( p=>p === node );
						if( path >= 0 ) 
							paths.splice( path, 1 );
					}
				}
				
				 return;
			}
				
			if( find = openSet.find( neighbor ) || ( __openSet && __openSet.find( neighbor ) ) ) {
				node = find.node;
				if( newg < find.node.g ) {
					node.f = ( newg + h1( neighbor ) )
					node.g = newg;
					node.h = newdelg
					if( find.prior ) {	
						if( __openSet ) {
							__openSet.length--;
							openSet.length++;
						}
						find.prior.next = find.next;  // unlink this
						openSet.link( node ); // relink into list
					} else {
						// it was already the first, and it's closer this way, so.... 
						// and sorted by distance
					}
					//console.log( "node:", node.g, newdelg );
					node.parent = check;
					{
						var path = paths.findIndex( p=>p === check );
						
						if( path >= 0 ) 
							paths[path] = node;
						else
							paths.push( node );
					}
					_node = node;
				} else {
					{
						var path = paths.findIndex( p=>p === node );
						if( path >= 0 ) 
							paths.splice( path, 1 );
					}
				}
			} else {
				node = openSet.add( neighbor, newg, newdelg );
				//	console.log( "node:", node.g, newdelg );
				node.parent = check;
				_node = node;
				{
					var path = paths.findIndex( p=>p === check );
					
					if( path >= 0 ) 
						paths[path] = node;
					else
						paths.push( node );
				}
			}
		} );
		
	}
	
	console.log( "closed length:", closedSet.length, openSet.length );

	if( minPath.node ) {
		nodes.push( minPath.node.node );
	
		var spot = minPath.node;
		while( spot ) {
			came_from.push( spot.node );
			spot = spot.parent;
		}

		if( logFind ) console.log( ("Completed find.") );
	}

	return 	() => { 
		var check 
		if( __openSet && __openSet.length )
			check = __openSet.pop();
		if( !check ) {
			if( __openSet && openSet.length ) {
				__openSet = openSet;
				openSet = makeOpenSet();
				check = __openSet.pop(); 
			}
			else
				check = openSet.pop(); 
		}
		if( check )
			aTick( check ); 
	}


	//return nodes; // returns a list really.
}




// ------------- Vector Math Utilities -----------------------------

function scale(v,s) {
	v['x'] *= s;
	v['y'] *= s;
	v['z'] *= s;
}
function sub2(r,a,b) {
	r.x = a['x']-b['x'];
	r.y = a['y']-b['y'];
	r.z = a['z']-b['z'];
}
function add2(r,a,b) {
	r.x = a['x']+b['x'];
	r.y = a['y']+b['y'];
	r.z = a['z']+b['z'];
}
function sub(a,b) {
	return {x:a['x']-b['x'],y:a['y']-b['y'],z:a['z']-b['z']};
}
function add(a,b) {
	return {x:a['x']+b['x'],y:a['y']+b['y'],z:a['z']+b['z']};
}

function len(v) {
	return Math.sqrt( v['x']*v['x']+v['y']*v['y']+v['z']*v['z'] );
}

const e1 = (0.00001);
function NearZero( n ) { return Math.abs(n)<e1 }

function crossproduct(pv1,pv2 )
{
   // this must be limited to 3D only, huh???
   // what if we are 4D?  how does this change??
  // evalutation of 4d matrix is 3 cross products of sub matriccii...
  return {x: pv2['z'] * pv1['y'] - pv2['y'] * pv1['z'], //b2c1-c2b1
	y:pv2['x'] * pv1['z'] - pv2['z'] * pv1['x'], //a2c1-c2a1 ( - determinaent )
	z:pv2['y'] * pv1['x'] - pv2['x'] * pv1['y'] }; //b2a1-a2b1
}
function dotproduct (  pv1, pv2 )
{
  return pv2['x'] * pv1['x'] +
  		   pv2['y'] * pv1['y'] +
  		   pv2['z'] * pv1['z'] ;
}

