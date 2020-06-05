
import {SaltyRNG} from "./salty_random_generator.js"

const generate_3D = true;
//-------------------------
// Usage : import {noise} from "./perlin-min.js"
//  var noise = new noise( config )
//
//  where config is an option block like the following.
// noise.get( x, y, z ) floating point elements. returns floating point element at that point.
// 

var example_config = {
	patchSize : 128,
	seed_noise : null,
	repeat_modulo : 0,
	//base : 0,
}

const CUBE_ELEMENT_SIZE = 32 // x by y plane if not _3D else also by z



function noise( opts ) {
	function NoiseGeneration(n,s) {
		//console.log( "generation....", n, s );

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
			dx : 1/(opts.patchSize/n),
			dy : 1/(opts.patchSize/n),
			
		};
	}
	var noiseGen = [];
	var maxtot = 0;
	for( var i = 1; i < 8; i++ ) {
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

	var data;
	const RNG = SaltyRNG( arr=>arr.push( data ), {mode:0} );

	function myRandom() {
		var arr = [];
		RNG.reset();
		if( opts.seed_noise ) {
			RNG.feed( opts.seed_noise );
		}
		//console.log( "Data wil lbe:", data );
		for( var nz = 0; nz< (generate_3D?CUBE_ELEMENT_SIZE:1); nz++ ) 
		for( var ny = 0; ny < CUBE_ELEMENT_SIZE; ny++ ) 
		for( var nx = 0; nx < CUBE_ELEMENT_SIZE; nx++ )  {
			var val = RNG.getBits( 8, false ) / 255; // 0 < 1 
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
	var counter = 0;
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
		var sx, sy, sz;

		if( generate_3D ){
			var c_lv1 = cache[sx = (x/CUBE_ELEMENT_SIZE)|0];
			if( !c_lv1 ) ( c_lv1 = cache[sx] = [] );
	        
			var c_lv2 = c_lv1[sy=(y/CUBE_ELEMENT_SIZE)|0];				
			if( !c_lv2 ) ( c_lv2 = c_lv1[sy] = [] );
			
			var c_lv3 = c_lv2[sz = (z/CUBE_ELEMENT_SIZE)|0];				
			if( !c_lv3 ) {
				data = [ sx, sy, sz ].join( " " );
				c_lv3 = c_lv2[sz] = myRandom();
				c_lv3.sx = sx;
				c_lv3.sy = sy;
				c_lv3.sz = sz;
				//console.log( "clv:", c_lv3 )
			}
			heatCache( c_lv3 );
			return c_lv3;
		}else {
			var c_lv1 = cache[sx = (x/CUBE_ELEMENT_SIZE)|0];
			if( !c_lv1 ) ( c_lv1 = cache[sx] = [] );
	        
			var c_lv2 = c_lv1[sy=(y/CUBE_ELEMENT_SIZE)|0];				
			if( !c_lv2 ) {
				data = [ sx, sy, sz ].join( " " );
				c_lv2 = c_lv1[sy] = myRandom();
				c_lv2.sx = sx;
				c_lv2.sy = sy;
				c_lv2.sz = sz;
				//console.log( "clv:", c_lv3 )
			}
			heatCache( c_lv2 );
			return c_lv2;
		}
	}

	

	return {
		setGenOffset( g, ox, oy, oz ) {
			noiseGen[g].ox = ox||0;
			noiseGen[g].oy = oy||0;
			noiseGen[g].oz = oz||0;
		}, 
		get(x,y,z,xTo,yTo,zTo) {
			z = z || 0;
			
			//var noise1 = getRandom( x, y, z ).arr;
			//var noise2 = getRandom( xTo, y, z ).arr;
			//var noise3 = getRandom( x, yTo, z ).arr;
			//var noise4 = getRandom( xTo, yTo, z ).arr;

			//var noise5 = getRandom( x, y, zTo ).arr;
			//var noise6 = getRandom( xTo, y, zTo ).arr;
			//var noise7 = getRandom( x, yTo, zTo ).arr;
			//var noise8 = getRandom( xTo, yTo, zTo ).arr;

			var _x;
			// Y will be 0 at the same time this changes...  which will update all anyway
			for( var n = 0; n < noiseGen.length; n++ ) {
				var gen = noiseGen[n];

				var offset = noiseGen.length-n;//opts.base % CUBE_ELEMENT_SIZE;

				var nx = Math.floor(( (x-gen.ox) / gen.pitch ) )*gen.pitch;
				var ny = Math.floor(( (y-gen.oy) / gen.pitch ) )*gen.pitch;
			if( generate_3D ) {
				var nz = Math.floor(( (z-gen.oz) / gen.pitch ) )*gen.pitch;
			}
				if( ny != gen.ny  ) { 
					gen.dirty = true; 
					//console.log( "using", offset + (ny) * opts.patchSize + (nx ),offset + ( (ny) %opts.patchSize ) * opts.patchSize + (nx) );
				}
				if( nx != gen.nx ) { 
					gen.dirty = true; 
				}
			if( generate_3D ) {
				if( nz != gen.nz ) { 
					gen.dirty = true; 
				}
			}

				gen.cx = ((x - gen.ox)/gen.pitch) % 1; // range scalar on top of nx
				while( gen.cx < 0 ) { gen.cx += 1; /*nx -=1*/ } // always apply forward
				gen.cy = ((y - gen.oy)/gen.pitch) % 1;
				while( gen.cy < 0 ) { gen.cy += 1; /*ny -= 1*/ }// always apply forward

			if( generate_3D ) {
				gen.cz = ((z - gen.oz)/gen.pitch) % 1;
				while( gen.cz < 0 ) gen.cz += 1;
			}

				if( gen.dirty ) {
					gen.dirty = false;
					//console.log( "noise is...", n, x, y, z, nx, ny, nz, gen.cx, gen.cy, gen.cz );
					gen.nx = nx; gen.ny =ny; 


                        if( !generate_3D ) {
					
					var noise1 = getRandom( nx          , ny          , nz ).arr;
					var noise2 = getRandom( nx+gen.pitch, ny          , nz ).arr;
					var noise3 = getRandom( nx          , ny+gen.pitch, nz ).arr;
					var noise4 = getRandom( nx+gen.pitch, ny+gen.pitch, nz ).arr;
										
					if( opts.repeat_modulo ) {
						noise1 = getRandom( (nx          ) % opts.repeat_modulo, (ny          ) % opts.repeat_modulo, nz ).arr;
						noise2 = getRandom( (nx+gen.pitch) % opts.repeat_modulo, (ny          ) % opts.repeat_modulo, nz ).arr;
						noise3 = getRandom( (nx          ) % opts.repeat_modulo, (ny+gen.pitch) % opts.repeat_modulo, nz ).arr;
						noise4 = getRandom( (nx+gen.pitch) % opts.repeat_modulo, (ny+gen.pitch) % opts.repeat_modulo, nz ).arr;
					} else {
						noise1 = getRandom( nx          , ny          , nz ).arr;
						noise2 = getRandom( nx+gen.pitch, ny          , nz ).arr;
						noise3 = getRandom( nx          , ny+gen.pitch, nz ).arr;
						noise4 = getRandom( nx+gen.pitch, ny+gen.pitch, nz ).arr;
					}


					gen.ix = ( (Math.floor((x-gen.ox) / gen.pitch ))*gen.pitch) % CUBE_ELEMENT_SIZE;
					while( gen.ix < 0 ) gen.ix += CUBE_ELEMENT_SIZE;
					gen.jx = (gen.ix+gen.pitch)%CUBE_ELEMENT_SIZE;

					gen.iy = ( (Math.floor((y-gen.oy) / gen.pitch))*gen.pitch) % CUBE_ELEMENT_SIZE;
					while( gen.iy < 0 ) gen.iy += CUBE_ELEMENT_SIZE;
					gen.jy = (gen.iy+gen.pitch)%CUBE_ELEMENT_SIZE;

					var r = (gen.iy) * CUBE_ELEMENT_SIZE + gen.ix;
					if( r % 1 ) {
						var a = noise1[ Math.floor(r) ];
						var b = noise1[ Math.ceil(r) ];
						gen.corn[0] = b * (1- r%1) + a * (r%1);
					} else {
						gen.corn[0] = noise1[ gen.iy * CUBE_ELEMENT_SIZE + gen.ix ];
					}
					var r = (gen.iy) * CUBE_ELEMENT_SIZE + gen.jx;
					if( r % 1 ) {
						var a = noise2[ Math.floor(r) ];
						var b = noise2[ Math.ceil(r) ];
						gen.corn[1] = b * (1- r%1) + a * (r%1);
					} else {
						gen.corn[1] = noise2[ (gen.iy) * CUBE_ELEMENT_SIZE + (gen.jx) ];
					}

					var r = (gen.jy) * CUBE_ELEMENT_SIZE + gen.ix;
					if( r % 1 ) {
						var a = noise3[ Math.floor(r) ];
						var b = noise3[ Math.ceil(r) ];
						gen.corn[2] = b * (1- r%1) + a * (r%1);
					}else {
						gen.corn[2] = noise3[ (gen.jy) * CUBE_ELEMENT_SIZE + gen.ix ];
					}
					var r = (gen.jy) * CUBE_ELEMENT_SIZE + gen.jx;
					if( r % 1 ) {
						var a = noise4[ Math.floor(r) ];
						var b = noise4[ Math.ceil(r) ];
						gen.corn[3] = b * (1- r%1) + a * (r%1);
					} else {
						gen.corn[3] = noise4[ (gen.jy) * CUBE_ELEMENT_SIZE + (gen.jx) ];
					}

					gen.dx1 = gen.corn[1] - gen.corn[0];
					gen.dx2 = gen.corn[3] - gen.corn[2];
			}

			if( generate_3D ) {
					gen.nz = nz;
					var noise1 = getRandom( nx          , ny          , nz ).arr;
					var noise2 = getRandom( nx+gen.pitch, ny          , nz ).arr;
					var noise3 = getRandom( nx          , ny+gen.pitch, nz ).arr;
					var noise4 = getRandom( nx+gen.pitch, ny+gen.pitch, nz ).arr;
		
					var noise5 = getRandom( nx          , ny          , nz+gen.pitch ).arr;
					var noise6 = getRandom( nx+gen.pitch, ny          , nz+gen.pitch ).arr;
					var noise7 = getRandom( nx          , ny+gen.pitch, nz+gen.pitch ).arr;
					var noise8 = getRandom( nx+gen.pitch, ny+gen.pitch, nz+gen.pitch ).arr;

					gen.ix = ( (Math.floor((x-gen.ox) / gen.pitch ))*gen.pitch) % CUBE_ELEMENT_SIZE;
					while( gen.ix < 0 ) gen.ix += CUBE_ELEMENT_SIZE;
					gen.jx = (gen.ix+gen.pitch)%CUBE_ELEMENT_SIZE;

					gen.iy = ( (Math.floor((y-gen.oy) / gen.pitch))*gen.pitch) % CUBE_ELEMENT_SIZE;
					while( gen.iy < 0 ) gen.iy += CUBE_ELEMENT_SIZE;
					gen.jy = (gen.iy+gen.pitch)%CUBE_ELEMENT_SIZE;

					gen.iz = ( (Math.floor((z-gen.oz) / gen.pitch))*gen.pitch) % CUBE_ELEMENT_SIZE;
					while( gen.iz < 0 ) gen.iz += CUBE_ELEMENT_SIZE;
					gen.jz = (gen.iz+gen.pitch)%CUBE_ELEMENT_SIZE;

					gen.corn[0] = noise1[ gen.iz * (CUBE_ELEMENT_SIZE*CUBE_ELEMENT_SIZE) + gen.iy * CUBE_ELEMENT_SIZE + gen.ix ];
					gen.corn[1] = noise2[ gen.iz * (CUBE_ELEMENT_SIZE*CUBE_ELEMENT_SIZE) + (gen.iy) * CUBE_ELEMENT_SIZE + (gen.jx) ];

					gen.corn[2] = noise3[ gen.iz * (CUBE_ELEMENT_SIZE*CUBE_ELEMENT_SIZE) + (gen.jy) * CUBE_ELEMENT_SIZE + gen.ix ];
					gen.corn[3] = noise4[ gen.iz * (CUBE_ELEMENT_SIZE*CUBE_ELEMENT_SIZE) + (gen.jy) * CUBE_ELEMENT_SIZE + (gen.jx) ];

					gen.corn[4] = noise5[ (gen.jz) * (CUBE_ELEMENT_SIZE*CUBE_ELEMENT_SIZE) + gen.iy * CUBE_ELEMENT_SIZE + gen.ix ];
					gen.corn[5] = noise6[ (gen.jz) * (CUBE_ELEMENT_SIZE*CUBE_ELEMENT_SIZE) + (gen.iy) * CUBE_ELEMENT_SIZE + (gen.jx) ];

					gen.corn[6] = noise7[ (gen.jz) * (CUBE_ELEMENT_SIZE*CUBE_ELEMENT_SIZE) + (gen.jy) * CUBE_ELEMENT_SIZE + gen.ix ];
					gen.corn[7] = noise8[ (gen.jz) * (CUBE_ELEMENT_SIZE*CUBE_ELEMENT_SIZE) + (gen.jy) * CUBE_ELEMENT_SIZE + (gen.jx) ];

					gen.dx1 = gen.corn[1] - gen.corn[0];
					gen.dx2 = gen.corn[3] - gen.corn[2];

					gen.dx3 = gen.corn[5] - gen.corn[4];
					gen.dx4 = gen.corn[7] - gen.corn[6]
			}
				}
	        }
		
		
			var tot = 0;
			for( var n = 0; n < noiseGen.length; n++ ) {
				var gen = noiseGen[n];
				// ((((c1)*(max-(d))) + ((c2)*(d)))/max)				
				//console.log( "gen.cx:", gen.cx );
			if( !generate_3D ) {
				var tx = (1-Math.cos( gen.cx *Math.PI) )/2;
				var ty =  (1-Math.cos( gen.cy *Math.PI) )/2;



				// ((((c1)*(max-(d))) + ((c2)*(d)))/max)				
				var tx = (1-Math.cos( gen.cx *Math.PI) )/2;
				var ty =  (1-Math.cos( gen.cy *Math.PI) )/2;
				//var tx = gen.cx;
				//var ty =  gen.cy;
				//console.log( "gen.cx:", tx, ty, "xy:", x, y,  "Genxy:", gen.cx, gen.cy  );
				var value1 = gen.dx1 * tx + gen.corn[0];
				var value2 = gen.dx2 * tx + gen.corn[2];
				var dy = value2 - value1; // /1
				var value = value1 + ty * dy;
				tot += (value * gen.scalar);

			}

			if( generate_3D ) {
				var tx = (1-Math.cos( gen.cx *Math.PI) )/2;
				var ty =  (1-Math.cos( gen.cy *Math.PI) )/2;
				var tz =  (1-Math.cos( gen.cz *Math.PI) )/2;
				//var tx = gen.cx;
				//var ty =  gen.cy;

		        	var value1 = gen.dx1 * ( tx ) + gen.corn[0];
				var value2 = gen.dx2 * ( tx ) + gen.corn[2];
		
				var dy1 = value2 - value1; // /1
				var value12 = value1 + ty * dy1;

	        		var value3 = gen.dx3 * ( tx ) + gen.corn[4];
				var value4 = gen.dx4 * ( tx ) + gen.corn[6];
		
				var dy2 = value4 - value3; // /1
				var value34 = value3 + ty * dy2;

				var dz = value34 - value12;
				var value = value12 + tz * dz;
				tot += (value * gen.scalar) ;				
			}
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


export {noise}

// find nearest does a recusive search and finds nodes
// which may qualify for linking to the new node (to).
// from is some source point, in a well linked web, should be irrelavent which to start from
// paint is passed to show nodes touched during the (last)search.
