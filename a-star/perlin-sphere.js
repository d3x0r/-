import {SaltyRNG} from "./salty_random_generator.js"

var config = {
	patchSize : 128,
	seed_noise : null,
	gen_noise : null,
	nodes : [],  // trace of A*Path
	base : 0,
	generations : 6,
}

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
	//config.canvas = document.getElementById( "testSurface" );
        config.ctx = config.canvas.map( (c)=>c.getContext("2d") );
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


function noise( s, opts ) {
	function NoiseGeneration(n,s) {
		return { 
			steps : n,
			scalar : s||(1/n),
			corn:[0,0,0,0],
			dx : 0,
			dy : 0,
			cx : 0,
			cy : 0,
			ix : 0,
			iy : 0,
			dx1 : 0,
			dx2 : 0,
			dx3 : 0,
			dx4 : 0,
			dy1 : 0,
			dy2 : 0,
			ox:0,oy:0,oz:0,
			pitch : opts.patchSize / n,
			dx : 1/(config.patchSize/n),
			dy : 1/(config.patchSize/n),
			
		};
	}
	const gens = opts.generations || 8;
	var noiseGen = [];
	var maxtot = 0;
	for( var i = 1; i < gens; i++ ) {
		var gen;
		noiseGen.push( gen = NoiseGeneration( 1 << i, 1/((1<<i)) ) );
		if( i == 6 ) gen.scalar *= 2;
		//if( i == 4 ) gen.scalar *= 2;
		if( i == 1 ) gen.scalar /= 3;
		if( i == 2 ) gen.scalar /= 2;

		//if( i > 4 ) gen.scalar *= 2;
		//if( i > 6 ) gen.scalar *= 3;
		//gen.scalar *= 1;
		maxtot += gen.scalar;
	}
	console.log( "tot:", maxtot );
	var seeds = [];

	const seed = Date.now().toString();
	var data;
	var RNG = SaltyRNG( arr=>arr.push( data ), {mode:1} );


	function myRandom() {
		RNG.reset();
	
		//console.log( "Data wil lbe:", data );
		var n = 0;
		const arr = [];
		const arrb = RNG.getBuffer( 8*CUBE_ELEMENT_SIZE*CUBE_ELEMENT_SIZE );
		const buf = new Uint8Array( arrb );
		
		//for( var nz = 0; nz< CUBE_ELEMENT_SIZE; nz++ ) 
		for( var ny = 0; ny < CUBE_ELEMENT_SIZE; ny++ ) 
		for( var nx = 0; nx < CUBE_ELEMENT_SIZE; nx++ )  {
			var val = buf[n++] / 255; // 0 < 1 
			arr.push( val );
		}
		return { id:data, when : 0, next : null, arr: arr, sx:0, sy:0, sz:0 };
	}

	var cache = [];
	var last_used;
	var most_used;
	var cacheLen = 0;

	function ageCache() {
		var patch = last_used;
		
	}
	function heatCache( patch ) {
		var p1 = most_used;
		var _p1 = null;
		if( p1 ) {
			for( ; p1; (_p1 = p1),p1 = p1.next ) {
				if( patch === p1 )
					break;
			}
			if( p1 && p1 != most_used ) {
				cacheLen--;
				if( !_p1 )
					most_used = most_used.next;
				else {
					_p1.next = p1.next;
				}
			}
		}
		patch.when = Date.now();
		if( cacheLen > 500 ) {
			var counter = 0;
			for( p1 = most_used; p1; (_p1 = p1),p1 = p1.next ) {
				counter++;
				if( counter === 400 ) {
					cacheLen = counter;
					p1.next = null; // trim tail of cached values... recompute later.
					break;
				}
			}
			
		}
		if( most_used ) {
			if( most_used !== patch ) {
				patch.next = most_used;
				most_used = patch;
				cacheLen++;
			}
		} else {
			last_used = most_used = patch;
			cacheLen = 1;
		}
		if( counter++ == 1000 ) {
			counter = 0;
		console.log( "length?", cacheLen, patch );
		}
		//patch.next = null;
	}

	function getRandom( x, y, z ) {
		//var fx = (x=x||0) &  0xF:
		//var fy = (y=x||0) &  0xF:
		//var fz = (z=z||0) &  0xF:
		var sx, sy;

			var c_lv1 = cache[sx = (x/CUBE_ELEMENT_SIZE)|0];
			if( !c_lv1 ) ( c_lv1 = cache[sx] = [] );
	        
			var c_lv2 = c_lv1[sy=(y/CUBE_ELEMENT_SIZE)|0];				
			if( !c_lv2 ) {
				data = seed+[ sx, sy, sz ].join( " " );
				c_lv2 = c_lv1[sy] = myRandom();
				c_lv2.sx = sx;
				c_lv2.sy = sy;
				c_lv2.sz = sz;
				//console.log( "clv:", c_lv3 )
			}
			heatCache( c_lv2 );
			return c_lv2;
	}

	

	return {
		setGenOffset( g, ox, oy, oz ) {
			noiseGen[g].ox = ox||0;
			noiseGen[g].oy = oy||0;
			noiseGen[g].oz = oz||0;
		}, 
		get(x,y,z,s) {
			z = z || 0;
			var side = (x > y);
			var ox = x;
			var oy = y;
			var oz = z;

			var minX = 0;
			var maxX = config.patchSize;
			if( s >= 6 && s <= 6 ) {
				if( ox > oy ) {		
					x =  (ox+ ox-oy) * (config.patchSize)/(ox+1);
				        y = ox-config.patchSize;
				} else {
					x =  (x) * (config.patchSize)/(y+1);
					y = ( y - config.patchSize );
				} 
			}
			if( s >= 7 && s <= 7 ) {
				if( ox > oy ) {			
					x = (ox*3+ox-oy) * (config.patchSize)/(ox+1);
				        y = ox-config.patchSize;

				} else {
					x =  (y*2+(x)) * (config.patchSize)/(y+1);
					y = ( y - config.patchSize );
				} 
			}
			if( s >= 8 && s <= 8 ) {
				if( ox > oy ) {			
					x =  (ox*5+ox-oy) * (config.patchSize)/(ox+1);
				        y = ox-config.patchSize;
				} else {
					x =  ((y*4+x)) * (config.patchSize)/(y+1);
					y = ( y - config.patchSize );
				} 
			}


			if( s >= 9 && s <= 9 ) {
				oy = y = config.patchSize - y;
				if( ox > oy ) {		
					x =  (ox+ ox-oy) * (config.patchSize)/(ox+1);
				        y = ox-config.patchSize;
				} else {
					x =  (x) * (config.patchSize)/(y+1);
					y = ( y - config.patchSize );
				} 
				y = config.patchSize-y;
			}
			if( s >= 10 && s <= 10 ) {
				oy = y = config.patchSize - y;
				if( ox > oy ) {			
					x = (ox*3+ox-oy) * (config.patchSize)/(ox+1);
				        y = ox-config.patchSize;

				} else {
					x =  (y*2+(x)) * (config.patchSize)/(y+1);
					y = ( y - config.patchSize );
				} 
				y = config.patchSize-y;
			}
			if( s >= 11 && s <= 11 ) {
				oy = y = config.patchSize - y;
				if( ox > oy ) {			
					x =  (ox*5+ox-oy) * (config.patchSize)/(ox+1);
				        y = ox-config.patchSize;
				} else {
					x =  ((y*4+x)) * (config.patchSize)/(y+1);
					y = ( y - config.patchSize );
				} 
				y = config.patchSize-y;
			}
			
			minX = 0; maxX = config.patchSize*6;
			//return x/(6*config.patchSize);
			//return 0.5+(y)/(4*config.patchSize);

			var dolog = false;

//	        	x += config.patchSize;        
	        	y += 3*config.patchSize;        

			var _x;
			// Y will be 0 at the same time this changes...  which will update all anyway
			for( var n = 0; n < noiseGen.length; n++ ) {
				var gen = noiseGen[n];

				var offset = noiseGen.length-n;//config.base % CUBE_ELEMENT_SIZE;
				var mod = Infinity;
				var nx;
				var ny;
				var nz;
				var npx, npy, npz;
				switch(s) {
				case 0:
				case 1:
				case 2:
				case 3:
				case 4:
					//break; // no remaps needed.
				case 5:
				//case 6:
				//case 7:
					nx = Math.floor(( (x-gen.ox+s*config.patchSize) / gen.pitch ) )*gen.pitch;
					ny = Math.floor(( (y-gen.oy) / gen.pitch ) )*gen.pitch;
					nz = Math.floor(( (z-gen.oz) / gen.pitch ) )*gen.pitch;
					npx = nx + gen.pitch;
					npy = ny + gen.pitch;
					npz = nz+ gen.pitch;
					if( nx < gen.ox ) {
						nx += 6*config.patchSize;
						npx = nx + gen.pitch;
					}
					if( npx >= (gen.ox + 6*config.patchSize ) )
						npx -= 6*config.patchSize;
					//mod = 6*config.patchSize;
					//nx += s*config.patchSize;
					gen.cx = ((x - gen.ox + s * config.patchSize)/gen.pitch) % 1;
					while( gen.cx < 0 ) { gen.cx += 1; /*nx -=1*/ }
					gen.cy = ((y - gen.oy)/gen.pitch) % 1;
					while( gen.cy < 0 ) { gen.cy += 1; /*ny -= 1*/ }
					gen.cz = ((z - gen.oz)/gen.pitch) % 1;
					while( gen.cz < 0 ) gen.cz += 1;
					break;
				case 6:
				case 7:
				case 8:

				case 9:
				case 10:
				case 11:
				//case 11:
	//	if( dolog )                     
						nx = Math.floor(( (x-gen.ox) / gen.pitch ) )*gen.pitch;
						ny = Math.floor(( (y-gen.oy) / gen.pitch ) )*gen.pitch;
						nz = Math.floor(( (z-gen.oz) / gen.pitch ) )*gen.pitch;
						if( nx < minX ) {
							npx = nx;
							return 0.9;
						} 
						else if( /*s == 8 && */ (nx + gen.pitch )>  maxX ) {
							
							npx = Math.floor(( (minX) / gen.pitch ) )*gen.pitch;
							npy = ny + gen.pitch;
							return 0.9;
							npz = nz + gen.pitch;
						} else {
							npx = nx + gen.pitch;
							npy = ny + gen.pitch;
							npz = nz + gen.pitch;
						}

						if( /*s == 8 && */ (npx)>  maxX ) {
							npx = nx;
							//npx = Math.floor(( (minX) / gen.pitch ) )*gen.pitch;
						}

					if( npx >= (gen.ox + 6*config.patchSize ) ) {
						//console.log( "Wrap success?" );
						npx -= 6*config.patchSize;
					}

//				if ( ( s == 6 &&  ox == 0 )  || ( s == 8  && oy == 0 ) )
//					console.log( "s:", s, "p:", gen.pitch, "mm:", minX, maxX, "result on xy:", ox, oy, "xy:", x, y, "nxy:", nx, ny, "npxy:", npx, npy );

						//if( s == 8 && n == 0 )                     
						//	console.log( "so...", ox, oy, "xy:", x, y, "nxy:", nx, ny, npx, npy );
		        
						gen.cx = ((x - gen.ox)/gen.pitch) % 1;
						while( gen.cx < 0 ) { gen.cx += 1; /*nx -=1*/ }
						gen.cy = ((y - gen.oy)/gen.pitch) % 1;
						while( gen.cy < 0 ) { gen.cy += 1; /*ny -= 1*/ }
						gen.cz = ((z - gen.oz)/gen.pitch) % 1;
						while( gen.cz < 0 ) gen.cz += 1;

					break;
				}
				if( ny != gen.ny  ) { 
					gen.dirty = true; 
					//console.log( "using", offset + (ny) * config.patchSize + (nx ),offset + ( (ny) %config.patchSize ) * config.patchSize + (nx) );
				}
				if( nx != gen.nx ) { 
					gen.dirty = true; 
				}
				if( nz != gen.nz ) { 
					gen.dirty = true; 
				}
				//if( ( s == 6 && gen.steps == 4) ||
				//    ( s == 0 && gen.steps == 4) )
				//	console.log( "COORDS:", s, "XY:", x, y, "NXY:", nx, ny, "NPXY:",npx, npy );
				if( nx == npx ) {
					gen.cx = gen.cy = gen.cz = 0;
					gen.dx1 = gen.dx2 = gen.dx3 = gen.dx4 = 0;
					gen.corn = [ 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5 ]; 
				} else 

				if( gen.dirty ) {
					gen.dirty = false;
					//console.log( "noise is...", n, x, y, z, nx, ny, nz, gen.cx, gen.cy, gen.cz );
					gen.nx = nx; gen.ny =ny; gen.nz = nz;

					var noise1;
					var noise2;
					var noise3;
					var noise4;
		
					//var noise5;
					//var noise6;
					//var noise7;
					//var noise8;
						noise1 = getRandom( nx   , ny          , nz ).arr;
						noise2 = getRandom( (npx), ny          , nz ).arr;
						noise3 = getRandom( nx   , (npy), nz ).arr;
						noise4 = getRandom( (npx), (npy), nz ).arr;
		                        
					//	noise5 = getRandom( nx   , ny          , (nz+gen.pitch) ).arr;
					//	noise6 = getRandom( (npx), ny          , (nz+gen.pitch) ).arr;
					//	noise7 = getRandom( nx   , npy, (nz+gen.pitch) ).arr;
					//	noise8 = getRandom( (npx), npy, (nz+gen.pitch) ).arr;

					gen.ix = nx % CUBE_ELEMENT_SIZE;
					while( gen.ix < 0 ) gen.ix += CUBE_ELEMENT_SIZE;
					gen.jx = (gen.ix+gen.pitch)%CUBE_ELEMENT_SIZE;

					gen.iy = ny % CUBE_ELEMENT_SIZE;
					while( gen.iy < 0 ) gen.iy += CUBE_ELEMENT_SIZE;
					gen.jy = (gen.iy+gen.pitch)%CUBE_ELEMENT_SIZE;

					//gen.iz = nz % CUBE_ELEMENT_SIZE;
					//while( gen.iz < 0 ) gen.iz += CUBE_ELEMENT_SIZE;
					//gen.jz = (gen.iz+gen.pitch)%CUBE_ELEMENT_SIZE;
				
					gen.corn[0] = noise1[  (gen.iy) * CUBE_ELEMENT_SIZE + gen.ix ];
					gen.corn[1] = noise2[  (gen.iy) * CUBE_ELEMENT_SIZE + (gen.jx) ];

					gen.corn[2] = noise3[  (gen.jy) * CUBE_ELEMENT_SIZE + gen.ix ];
					gen.corn[3] = noise4[  (gen.jy) * CUBE_ELEMENT_SIZE + (gen.jx) ];


					//gen.corn[4] = noise5[ (gen.jz) * (CUBE_ELEMENT_SIZE*CUBE_ELEMENT_SIZE) + gen.iy * CUBE_ELEMENT_SIZE + gen.ix ];
					//gen.corn[5] = noise6[ (gen.jz) * (CUBE_ELEMENT_SIZE*CUBE_ELEMENT_SIZE) + (gen.iy) * CUBE_ELEMENT_SIZE + (gen.jx) ];

					//gen.corn[6] = noise7[ (gen.jz) * (CUBE_ELEMENT_SIZE*CUBE_ELEMENT_SIZE) + (gen.jy) * CUBE_ELEMENT_SIZE + gen.ix ];
					//gen.corn[7] = noise8[ (gen.jz) * (CUBE_ELEMENT_SIZE*CUBE_ELEMENT_SIZE) + (gen.jy) * CUBE_ELEMENT_SIZE + (gen.jx) ];

					gen.dx1 = gen.corn[1] - gen.corn[0];
					gen.dx2 = gen.corn[3] - gen.corn[2];

					//gen.dx3 = gen.corn[5] - gen.corn[4];
					//gen.dx4 = gen.corn[7] - gen.corn[6];

				}
			}
		
		
			var tot = 0;
			for( var n = 0; n < noiseGen.length; n++ ) {
				var gen = noiseGen[n];
				// ((((c1)*(max-(d))) + ((c2)*(d)))/max)				
				//console.log( "gen.cx:", gen.cx );
				var tx = (1-Math.cos( gen.cx *Math.PI) )/2;
				var ty =  (1-Math.cos( gen.cy *Math.PI) )/2;

				var value1 = gen.dx1 * ( tx ) + gen.corn[0];
				var value2 = gen.dx2 * ( tx ) + gen.corn[2];
		
				var dy1 = value2 - value1; // /1
				var value12 = value1 + ty * dy1;

		        	//var value3 = gen.dx3 * ( tx ) + gen.corn[4];
				//var value4 = gen.dx4 * ( tx ) + gen.corn[6];
		
				//var dy2 = value4 - value3; // /1     7
				//var value34 = value3 + ty * dy2;

				//var dz = value34 - value12;
				//var value = value12 + tz * dz;
				tot += (value12 * gen.scalar) ;				
			}
			tot /= maxtot;
			//console.log( "value: ", tot );
			//outNoise.push( noiseGen[3].corn[0] );
			//	if( maxVal < tot ) maxVal = tot;
				//if( minVal > tot ) minVal = tot;
			
			return tot;
		}
	};
	
}

var h = 0;
var h2 = 0;
var h2Target = 20;
var wO = 0;
var hO = 0;

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
	console.log( "FILL IS:", Date.now() - start );
	//genData( myNoise, config );
	if( config.canvas ) {
		for( n = 0; n < 12; n++ )
			setTimeout( ((n)=>{
				drawData( n, myNoise[n], config );
			}).bind(this,n), n * 100 );
	}

	console.log( "FILL IS:", Date.now() - start );
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
	var start = Date.now();
	//if
	output_offset = 0;//config.patchSize *h;
	for( var h = 0; h < _output.height; h++ )
	{
		//output_offset =  + ( surface.height - h - 1 ) * surface.width;
		for( var w = 0; w < _output.width; w++ )
		{
			var here = noise.get( (w+wO), (h+hO), h2, s );
			//var here1 = noise.get( w+wO+1000, h+hO, h2, s );
			//var here2 = noise.get( w+wO, h+hO+1000, h2, s );
			var c1,c2,c3;
const c1r1 = 0.10;
const c1r2 = 0.36;
const c1r3 = 0.50;
const c1r4 = 0.63;
const c1r5 = 0.90;


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

if (false) {
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


// find nearest does a recusive search and finds nodes
// which may qualify for linking to the new node (to).
// from is some source point, in a well linked web, should be irrelavent which to start from
// paint is passed to show nodes touched during the (last)search.
