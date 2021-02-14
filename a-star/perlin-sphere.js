import {SaltyRNG} from "./salty_random_generator.js"

const CUBE_ELEMENT_SIZE = 16


function noise( s, opts ) {
	function NoiseGeneration(n,s) {
		return { 
			steps : n,
			scalar : s||(1/n),
			corn:[0,0,0,0,0,0,0,0],
			cx : 0,
			cy : 0,
			cz : 0,
			ix : 0,
			iy : 0,
			iz : 0,
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
			dz : 1/(opts.patchSize/n),
			
		};
	}
	const gens = opts.generations || 8;
	const cache = opts.cache;
	var noiseGen = [];
	var maxtot = 0;
	for( var i = 1; i < gens; i++ ) {
		var gen;
		noiseGen.push( gen = NoiseGeneration( 1 << i, 1/((1<<i)) ) );
		//if( i == 4 ) gen.scalar *= 2;
		if( i == 1 ) gen.scalar /= 3;
		if( i == 2 ) gen.scalar /= 2;
		if( i == 6 ) gen.scalar *= 2;
		//gen.scalar *= 1;
		maxtot += gen.scalar;
	}
	console.log( "tot:", maxtot );

	var data;
	var RNG = SaltyRNG( arr=>arr.push( data ), {mode:1} );


	function myRandom() {
		RNG.reset();
	
		//console.log( "Data wil lbe:", data );
		var n = 0;
		const arr = [];
		const arrb = RNG.getBuffer( 8*CUBE_ELEMENT_SIZE*CUBE_ELEMENT_SIZE*CUBE_ELEMENT_SIZE );
		const buf = new Uint8Array( arrb );
		
		for( var nz = 0; nz< CUBE_ELEMENT_SIZE; nz++ ) 
			for( var ny = 0; ny < CUBE_ELEMENT_SIZE; ny++ ) 
				for( var nx = 0; nx < CUBE_ELEMENT_SIZE; nx++ )  {
					var val = buf[n++] / 255; // 0 < 1 
					arr.push( val );
				}
		return { id:data, when : 0, next : null, arr: arr, sx:0, sy:0, sz:0 };
	}

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
		var sx, sy, sz;

			var c_lv1 = cache[sx = (x/CUBE_ELEMENT_SIZE)|0];
			if( !c_lv1 ) ( c_lv1 = cache[sx] = [] );
	        
			var c_lv2 = c_lv1[sy=(y/CUBE_ELEMENT_SIZE)|0];				
			if( !c_lv2 ) 
				c_lv2 = c_lv1[sy] = [];

			var c_lv3 = c_lv2[sz=(z/CUBE_ELEMENT_SIZE)|0];

			if( !c_lv3 ) {
				data = [ sx, sy, sz, opts.seed ].join( " " );
				c_lv3 = c_lv2[sz] = myRandom();
				c_lv3.sx = sx;
				c_lv3.sy = sy;
				c_lv3.sz = sz;
				//console.log( "clv:", c_lv3 )
			}
			heatCache( c_lv3 );
			return c_lv3;
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
			var maxX = opts.patchSize;
			if( s >= 6 && s <= 6 ) {
				if( ox > oy ) {		
					x =  (ox+ ox-oy) * (opts.patchSize)/(ox+1);
					y = ox-opts.patchSize;
				} else {
					x =  (x) * (opts.patchSize)/(y+1);
					y = ( y - opts.patchSize );
				} 
			}
			if( s >= 7 && s <= 7 ) {
				if( ox > oy ) {			
					x = (ox*3+ox-oy) * (opts.patchSize)/(ox+1);
					y = ox-opts.patchSize;

				} else {
					x =  (y*2+(x+2)) * (opts.patchSize)/(y+1);
					y = ( y - opts.patchSize );
				} 
			}
			if( s >= 8 && s <= 8 ) {
				if( ox > oy ) {			
					x =  (ox*5+ox-oy) * (opts.patchSize)/(ox+1);
					y = ox-opts.patchSize;
				} else {
					x =  ((y*4+(x+4))) * (opts.patchSize)/(y+1);
					y = ( y - opts.patchSize );
				} 
			}


			if( s >= 9 && s <= 9 ) {
				oy = y = opts.patchSize - y;
				if( ox > oy ) {		
					x =  (ox+ ox-oy) * (opts.patchSize)/(ox+1);
				        y = ox-opts.patchSize;
				} else {
					x =  (x) * (opts.patchSize)/(y+1);
					y = ( y - opts.patchSize );
				} 
				y = opts.patchSize-y;
			}
			if( s >= 10 && s <= 10 ) {
				oy = y = opts.patchSize - y;
				if( ox > oy ) {			
					x = (ox*3+ox-oy) * (opts.patchSize)/(ox+1);
				        y = ox-opts.patchSize;

				} else {
					x =  (y*2+(x+2)) * (opts.patchSize)/(y+1);
					y = ( y - opts.patchSize );
				} 
				y = opts.patchSize-y;
			}
			if( s >= 11 && s <= 11 ) {
				oy = y = opts.patchSize - y;
				if( ox > oy ) {			
					x =  (ox*5+ox-oy) * (opts.patchSize)/(ox+1);
					y = ox-opts.patchSize;
				} else {
					x =  ((y*4+(x+4))) * (opts.patchSize)/(y+1);
					y = ( y - opts.patchSize );
				} 
				y = opts.patchSize-y;
			}
			
			minX = 0; maxX = opts.patchSize*6;
			//return x/(6*opts.patchSize);
			//return 0.5+(y)/(4*opts.patchSize);

			var dolog = false;

//	        	x += opts.patchSize;        
	        	y += 3*opts.patchSize;        

			var _x;
			// Y will be 0 at the same time this changes...  which will update all anyway
			for( var n = 0; n < noiseGen.length; n++ ) {
				var gen = noiseGen[n];

				var offset = noiseGen.length-n;//opts.base % CUBE_ELEMENT_SIZE;
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
					nx = Math.floor(( (x-gen.ox+s*opts.patchSize) / gen.pitch ) )*gen.pitch;
					ny = Math.floor(( (y-gen.oy) / gen.pitch ) )*gen.pitch;
					nz = Math.floor(( (z-gen.oz) / gen.pitch ) )*gen.pitch;
					npx = nx + gen.pitch;
					npy = ny + gen.pitch;
					npz = nz+ gen.pitch;
					if( nx < gen.ox ) {
						nx += 6*opts.patchSize;
						npx = nx + gen.pitch;
					}
					if( npx >= (gen.ox + 6*opts.patchSize ) )
						npx -= 6*opts.patchSize;
					//mod = 6*opts.patchSize;
					//nx += s*opts.patchSize;
					gen.cx = ((x - gen.ox + s * opts.patchSize)/gen.pitch) % 1;
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

					if( npx >= (gen.ox + 6*opts.patchSize ) ) {
						//console.log( "Wrap success?" );
						npx -= 6*opts.patchSize;
					}

//				if ( ( s == 6 &&  ox == 0 )  || ( s == 8  && oy == 0 ) )
//					console.log( "s:", s, "p:", gen.pitch, "mm:", minX, maxX, "result on xy:", ox, oy, "xy:", x, y, "nxy:", nx, ny, "npxy:", npx, npy );

						//if( s == 8 && n == 0 )                     
						//	console.log( "so...", ox, oy, "xy:", x, y, "nxy:", nx, ny, npx, npy );
		        
						gen.cx = ((x - gen.ox)/gen.pitch) % 1;
						while( gen.cx < 0 ) {
						return 0.9;
							 gen.cx += 1; /*nx -=1*/ 
						}
						gen.cy = ((y - gen.oy)/gen.pitch) % 1;
						while( gen.cy < 0 ) { gen.cy += 1; /*ny -= 1*/ }
						gen.cz = ((z - gen.oz)/gen.pitch) % 1;
						while( gen.cz < 0 ) gen.cz += 1;

					break;
				}
				if( ny != gen.ny  ) { 
					gen.dirty = true; 
					//console.log( "using", offset + (ny) * opts.patchSize + (nx ),offset + ( (ny) %opts.patchSize ) * opts.patchSize + (nx) );
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

				tot += (value12 * gen.scalar) ;				
			}

			tot /= maxtot;
			//console.log( "value: ", tot );
			//outNoise.push( noiseGen[3].corn[0] );
			//	if( maxVal < tot ) maxVal = tot;
				//if( minVal > tot ) minVal = tot;
			
			return tot;
		},

		get2(x,y,z,s) {
			z = z || 0;
			var side = (x > y);
			var ox = x;
			var oy = y;
			var oz = z;

			var minX = 0;
			var maxX = opts.patchSize;

			minX = 0; maxX = opts.patchSize*6;
			//return x/(6*opts.patchSize);
			//return 0.5+(y)/(4*opts.patchSize);

			var dolog = false;

//	        	x += opts.patchSize;        
	        	y += 3*opts.patchSize;        

			var _x;
			// Y will be 0 at the same time this changes...  which will update all anyway
			for( var n = 0; n < noiseGen.length; n++ ) {
				var gen = noiseGen[n];

				var offset = noiseGen.length-n;//opts.base % CUBE_ELEMENT_SIZE;
				var mod = Infinity;
				var nx;
				var ny;
				var nz;
				var npx, npy, npz;
				//const oldOffset = s*opts.patchSize;
				const oldOffset = 0;

					nx = Math.floor(( (x-gen.ox+oldOffset) / gen.pitch ) )*gen.pitch;
					ny = Math.floor(( (y-gen.oy) / gen.pitch ) )*gen.pitch;
					nz = Math.floor(( (z-gen.oz) / gen.pitch ) )*gen.pitch;
					npx = nx + gen.pitch;
					npy = ny + gen.pitch;
					npz = nz + gen.pitch;
					if( nx < gen.ox ) {
						nx += 6*opts.patchSize;
						npx = nx + gen.pitch;
					}
					if( npx >= (gen.ox + 6*opts.patchSize ) )
						npx -= 6*opts.patchSize;
					//mod = 6*opts.patchSize;
					//nx += s*opts.patchSize;
					gen.cx = ((x - gen.ox + oldOffset)/gen.pitch) % 1;
					while( gen.cx < 0 ) { gen.cx += 1; /*nx -=1*/ }
					gen.cy = ((y - gen.oy)/gen.pitch) % 1;
					while( gen.cy < 0 ) { gen.cy += 1; /*ny -= 1*/ }
					gen.cz = ((z - gen.oz)/gen.pitch) % 1;
					while( gen.cz < 0 ) gen.cz += 1;

				if( ny != gen.ny  ) { 
					gen.dirty = true; 
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
		
					var noise5;
					var noise6;
					var noise7;
					var noise8;
						noise1 = getRandom( nx   , ny          , nz ).arr;
						noise2 = getRandom( (npx), ny          , nz ).arr;
						noise3 = getRandom( nx   , (npy), nz ).arr;
						noise4 = getRandom( (npx), (npy), nz ).arr;
		                        
						noise5 = getRandom( nx   , ny          , (npz) ).arr;
						noise6 = getRandom( (npx), ny          , (npz) ).arr;
						noise7 = getRandom( nx   , npy, (npz) ).arr;
						noise8 = getRandom( (npx), npy, (npz) ).arr;

					gen.ix = nx % CUBE_ELEMENT_SIZE;
					while( gen.ix < 0 ) gen.ix += CUBE_ELEMENT_SIZE;
					gen.jx = (gen.ix+gen.pitch)%CUBE_ELEMENT_SIZE;

					gen.iy = ny % CUBE_ELEMENT_SIZE;
					while( gen.iy < 0 ) gen.iy += CUBE_ELEMENT_SIZE;
					gen.jy = (gen.iy+gen.pitch)%CUBE_ELEMENT_SIZE;

					gen.iz = nz % CUBE_ELEMENT_SIZE;
					while( gen.iz < 0 ) gen.iz += CUBE_ELEMENT_SIZE;
					gen.jz = (gen.iz+gen.pitch)%CUBE_ELEMENT_SIZE;
				
					gen.corn[0] = noise1[  (gen.iy) * CUBE_ELEMENT_SIZE + gen.ix ];
					gen.corn[1] = noise2[  (gen.iy) * CUBE_ELEMENT_SIZE + (gen.jx) ];

					gen.corn[2] = noise3[  (gen.jy) * CUBE_ELEMENT_SIZE + gen.ix ];
					gen.corn[3] = noise4[  (gen.jy) * CUBE_ELEMENT_SIZE + (gen.jx) ];

					gen.corn[4] = noise5[ (gen.jz) * (CUBE_ELEMENT_SIZE*CUBE_ELEMENT_SIZE) + gen.iy * CUBE_ELEMENT_SIZE + gen.ix ];
					gen.corn[5] = noise6[ (gen.jz) * (CUBE_ELEMENT_SIZE*CUBE_ELEMENT_SIZE) + (gen.iy) * CUBE_ELEMENT_SIZE + (gen.jx) ];

					gen.corn[6] = noise7[ (gen.jz) * (CUBE_ELEMENT_SIZE*CUBE_ELEMENT_SIZE) + (gen.jy) * CUBE_ELEMENT_SIZE + gen.ix ];
					gen.corn[7] = noise8[ (gen.jz) * (CUBE_ELEMENT_SIZE*CUBE_ELEMENT_SIZE) + (gen.jy) * CUBE_ELEMENT_SIZE + (gen.jx) ];

					gen.dx1 = gen.corn[1] - gen.corn[0];
					gen.dx2 = gen.corn[3] - gen.corn[2];

					gen.dx3 = gen.corn[5] - gen.corn[4];
					gen.dx4 = gen.corn[7] - gen.corn[6];

				}
			}
		
		
			var tot = 0;
//		      console.log( "corn:", gen.corn, gen.cx, gen.cy, gen.cy );
//debugger;

			for( var n = 0; n < noiseGen.length; n++ ) {
				var gen = noiseGen[n];
				// ((((c1)*(max-(d))) + ((c2)*(d)))/max)				
				//console.log( "gen.cx:", gen.cx );
				const tx = (1-Math.cos( gen.cx *Math.PI) )/2;
				const ty = (1-Math.cos( gen.cy *Math.PI) )/2;
				const tz = (1-Math.cos( gen.cz *Math.PI) )/2;

				const value1 = gen.dx1 * ( tx ) + gen.corn[0];
				const value2 = gen.dx2 * ( tx ) + gen.corn[2];

				const value3 = gen.dx3 * ( tx ) + gen.corn[4];
				const value4 = gen.dx4 * ( tx ) + gen.corn[6];

				const dy1 = value2 - value1; // /1
				const dy2 = value4 - value3; // /1
				const value12 = value1 + ty * dy1;
				const value34 = value3 + ty * dy2;
				const value1234 = value12 + tz * (value34-value12);

				tot += (value1234 * gen.scalar) ;				
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
