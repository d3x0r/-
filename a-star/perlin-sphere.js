import {SaltyRNG} from "./salty_random_generator.js"

const CUBE_ELEMENT_SIZE = 8

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
		//RNG.reset();
	
		//console.log( "Data wil lbe:", data );
		var n = 0;
		const arr = [];
		//const arrb = RNG.getBuffer( 8*CUBE_ELEMENT_SIZE*CUBE_ELEMENT_SIZE*CUBE_ELEMENT_SIZE );
		//const buf = new Uint8Array( arrb );
		
		for( var nz = 0; nz< CUBE_ELEMENT_SIZE; nz++ ) 
			for( var ny = 0; ny < CUBE_ELEMENT_SIZE; ny++ ) 
				for( var nx = 0; nx < CUBE_ELEMENT_SIZE; nx++ )  {
					//var val = buf[n++] / 255; // 0 < 1 
					arr.push( Math.random() );
				}
		return { id:data, when : 0, next : null, arr: arr, sx:0, sy:0, sz:0 };
	}

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
			let counter = 0;
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
		//if( counter++ == 1000 ) {
		//	counter = 0;
		//}
		//patch.next = null;
	}

	function getRandom( x, y, z ) {
		//var fx = (x=x||0) &  0xF:
		//var fy = (y=x||0) &  0xF:
		//var fz = (z=z||0) &  0xF:
		const sx= (x/CUBE_ELEMENT_SIZE)|0
		const sy= (y/CUBE_ELEMENT_SIZE)|0;
		const sz= (z/CUBE_ELEMENT_SIZE)|0;

			var c_lv1 = cache[sx ];
			if( !c_lv1 ) ( c_lv1 = cache[sx] = [] );
	        
			var c_lv2 = c_lv1[sy];				
			if( !c_lv2 ) 
				c_lv2 = c_lv1[sy] = [];

			let c_lv3 = c_lv2[sz];

			if( !c_lv3 ) {
				data = [ sx, sy, sz, opts.seed ].join( " " );
				c_lv3 = c_lv2[sz] = myRandom();
				c_lv3.sx = sx;
				c_lv3.sy = sy;
				c_lv3.sz = sz;
				//console.log( "clv:", c_lv3 )
			}
			heatCache( c_lv3 );
			return c_lv3.arr;
	}

	

	return {
		setGenOffset( g, ox, oy, oz ) {
			noiseGen[g].ox = ox||0;
			noiseGen[g].oy = oy||0;
			noiseGen[g].oz = oz||0;
		}, 


		get2(x,y,z,s) {
			z = z || 0;
			var side = (x > y);
			var ox = x;
			var oy = y;
			var oz = z;

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

					nx = Math.floor(( (x-gen.ox) / gen.pitch ) )*gen.pitch;
					ny = Math.floor(( (y-gen.oy) / gen.pitch ) )*gen.pitch;
					nz = Math.floor(( (z-gen.oz) / gen.pitch ) )*gen.pitch;
					npx = nx + gen.pitch;
					npy = ny + gen.pitch;
					npz = nz + gen.pitch;

					//mod = 6*opts.patchSize;
					//nx += s*opts.patchSize;
					gen.cx = ((x - gen.ox)/gen.pitch) % 1;
					while( gen.cx < 0 ) { gen.cx += 1; /*nx -=1*/ }

					gen.cy = ((y - gen.oy)/gen.pitch) % 1;
					while( gen.cy < 0 ) { gen.cy += 1; /*ny -= 1*/ }

					gen.cz = ((z - gen.oz)/gen.pitch) % 1;
					while( gen.cz < 0 ) { gen.cz += 1; }

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
				if( gen.dirty ) {
					gen.dirty = false;
					//console.log( "noise is...", n, x, y, z, nx, ny, nz, gen.cx, gen.cy, gen.cz );
					gen.nx = nx; gen.ny =ny; gen.nz = nz;

					let noise1, noise2,noise3, noise4;
					let noise5, noise6,noise7, noise8;

					//const	noise1 = getRandom( nx   , ny   , nz );
					{
						//var fx = (x=x||0) &  0xF:
						//var fy = (y=x||0) &  0xF:
						//var fz = (z=z||0) &  0xF:
						const sx= (nx/CUBE_ELEMENT_SIZE)|0
						const sy= (ny/CUBE_ELEMENT_SIZE)|0;
						const sz= (nz/CUBE_ELEMENT_SIZE)|0;
				
							var c_lv1 = cache[sx ];
							if( !c_lv1 ) ( c_lv1 = cache[sx] = [] );
							
							var c_lv2 = c_lv1[sy];				
							if( !c_lv2 ) 
								c_lv2 = c_lv1[sy] = [];
							let c_lv3 = c_lv2[sz];
				
							if( !c_lv3 ) {
								data = [ sx, sy, sz, opts.seed ].join( " " );
								c_lv3 = c_lv2[sz] = myRandom();
								c_lv3.sx = sx;
								c_lv3.sy = sy;
								c_lv3.sz = sz;
								//console.log( "clv:", c_lv3 )
							}
							
							{
								const patch = c_lv3;
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
								//patch.next = null;
							}
						

							//heatCache( c_lv3 );
							noise1 = c_lv3.arr;
					}
				
					//const	noise2 = getRandom( (npx), ny   , nz );
					{
						//var fx = (x=x||0) &  0xF:
						//var fy = (y=x||0) &  0xF:
						//var fz = (z=z||0) &  0xF:
						const sx= (npx/CUBE_ELEMENT_SIZE)|0
						const sy= (ny/CUBE_ELEMENT_SIZE)|0;
						const sz= (nz/CUBE_ELEMENT_SIZE)|0;
				
							var c_lv1 = cache[sx ];
							if( !c_lv1 ) ( c_lv1 = cache[sx] = [] );
							
							var c_lv2 = c_lv1[sy];				
							if( !c_lv2 ) 
								c_lv2 = c_lv1[sy] = [];
				
							let c_lv3 = c_lv2[sz];
							const patch = c_lv3;
					
							if( !c_lv3 ) {
								data = [ sx, sy, sz, opts.seed ].join( " " );
								c_lv3 = c_lv2[sz] = myRandom();
								c_lv3.sx = sx;
								c_lv3.sy = sy;
								c_lv3.sz = sz;
								//console.log( "clv:", c_lv3 )
							}
							{
								const patch = c_lv3;
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
								//patch.next = null;
							}
							noise2 = c_lv3.arr;
					}
					//const	noise3 = getRandom( nx   , (npy), nz );
					{
						//var fx = (x=x||0) &  0xF:
						//var fy = (y=x||0) &  0xF:
						//var fz = (z=z||0) &  0xF:
						const sx= (nx/CUBE_ELEMENT_SIZE)|0
						const sy= (npy/CUBE_ELEMENT_SIZE)|0;
						const sz= (nz/CUBE_ELEMENT_SIZE)|0;
				
							var c_lv1 = cache[sx ];
							if( !c_lv1 ) ( c_lv1 = cache[sx] = [] );
							
							var c_lv2 = c_lv1[sy];				
							if( !c_lv2 ) 
								c_lv2 = c_lv1[sy] = [];
				
							let c_lv3 = c_lv2[sz];
							const patch = c_lv3;
					
							if( !c_lv3 ) {
								data = [ sx, sy, sz, opts.seed ].join( " " );
								c_lv3 = c_lv2[sz] = myRandom();
								c_lv3.sx = sx;
								c_lv3.sy = sy;
								c_lv3.sz = sz;
								//console.log( "clv:", c_lv3 )
							}
							{
								const patch = c_lv3;
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
								//patch.next = null;
							}
							noise3 = c_lv3.arr;
					}
					//const	noise4 = getRandom( (npx), (npy), nz );
					{
						//var fx = (x=x||0) &  0xF:
						//var fy = (y=x||0) &  0xF:
						//var fz = (z=z||0) &  0xF:
						const sx= (npx/CUBE_ELEMENT_SIZE)|0
						const sy= (npy/CUBE_ELEMENT_SIZE)|0;
						const sz= (nz/CUBE_ELEMENT_SIZE)|0;
				
							var c_lv1 = cache[sx ];
							if( !c_lv1 ) ( c_lv1 = cache[sx] = [] );
							
							var c_lv2 = c_lv1[sy];				
							if( !c_lv2 ) 
								c_lv2 = c_lv1[sy] = [];
				
							let c_lv3 = c_lv2[sz];
							const patch = c_lv3;
					
							if( !c_lv3 ) {
								data = [ sx, sy, sz, opts.seed ].join( " " );
								c_lv3 = c_lv2[sz] = myRandom();
								c_lv3.sx = sx;
								c_lv3.sy = sy;
								c_lv3.sz = sz;
								//console.log( "clv:", c_lv3 )
							}
							//heatCache( c_lv3 );
							{
								const patch = c_lv3;
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
								//patch.next = null;
							}
							noise4 = c_lv3.arr;
					}



					//const	noise1 = getRandom( nx   , ny   , nz );
					//const	noise2 = getRandom( (npx), ny   , nz );
					//const	noise3 = getRandom( nx   , (npy), nz );
					//const	noise4 = getRandom( (npx), (npy), nz );
		                        
					//const	noise5 = getRandom( nx   , ny , (npz) );
					{
						//var fx = (x=x||0) &  0xF:
						//var fy = (y=x||0) &  0xF:
						//var fz = (z=z||0) &  0xF:
						const sx= (nx/CUBE_ELEMENT_SIZE)|0
						const sy= (ny/CUBE_ELEMENT_SIZE)|0;
						const sz= (npz/CUBE_ELEMENT_SIZE)|0;
				
							var c_lv1 = cache[sx ];
							if( !c_lv1 ) ( c_lv1 = cache[sx] = [] );
							
							var c_lv2 = c_lv1[sy];				
							if( !c_lv2 ) 
								c_lv2 = c_lv1[sy] = [];
				
							let c_lv3 = c_lv2[sz];
							const patch = c_lv3;
					
							if( !c_lv3 ) {
								data = [ sx, sy, sz, opts.seed ].join( " " );
								c_lv3 = c_lv2[sz] = myRandom();
								c_lv3.sx = sx;
								c_lv3.sy = sy;
								c_lv3.sz = sz;
								//console.log( "clv:", c_lv3 )
							}
							//heatCache( c_lv3 );
							{
								const patch = c_lv3;
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
								//patch.next = null;
							}
							noise5 = c_lv3.arr;
					}
					//const	noise6 = getRandom( (npx), ny , (npz) );
					{
						//var fx = (x=x||0) &  0xF:
						//var fy = (y=x||0) &  0xF:
						//var fz = (z=z||0) &  0xF:
						const sx= (npx/CUBE_ELEMENT_SIZE)|0
						const sy= (ny/CUBE_ELEMENT_SIZE)|0;
						const sz= (npz/CUBE_ELEMENT_SIZE)|0;
				
							var c_lv1 = cache[sx ];
							if( !c_lv1 ) ( c_lv1 = cache[sx] = [] );
							
							var c_lv2 = c_lv1[sy];				
							if( !c_lv2 ) 
								c_lv2 = c_lv1[sy] = [];
				
							let c_lv3 = c_lv2[sz];
							const patch = c_lv3;
					
							if( !c_lv3 ) {
								data = [ sx, sy, sz, opts.seed ].join( " " );
								c_lv3 = c_lv2[sz] = myRandom();
								c_lv3.sx = sx;
								c_lv3.sy = sy;
								c_lv3.sz = sz;
								//console.log( "clv:", c_lv3 )
							}
							//heatCache( c_lv3 );
							{
								const patch = c_lv3;
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
								//patch.next = null;
							}
							noise6 = c_lv3.arr;
					}
					//const	noise7 = getRandom( nx   , npy, (npz) );
					{
						//var fx = (x=x||0) &  0xF:
						//var fy = (y=x||0) &  0xF:
						//var fz = (z=z||0) &  0xF:
						const sx= (nx/CUBE_ELEMENT_SIZE)|0
						const sy= (npy/CUBE_ELEMENT_SIZE)|0;
						const sz= (npz/CUBE_ELEMENT_SIZE)|0;
				
							var c_lv1 = cache[sx ];
							if( !c_lv1 ) ( c_lv1 = cache[sx] = [] );
							
							var c_lv2 = c_lv1[sy];				
							if( !c_lv2 ) 
								c_lv2 = c_lv1[sy] = [];
				
							let c_lv3 = c_lv2[sz];
							const patch = c_lv3;
					
							if( !c_lv3 ) {
								data = [ sx, sy, sz, opts.seed ].join( " " );
								c_lv3 = c_lv2[sz] = myRandom();
								c_lv3.sx = sx;
								c_lv3.sy = sy;
								c_lv3.sz = sz;
								//console.log( "clv:", c_lv3 )
							}
							//heatCache( c_lv3 );
							{
								const patch = c_lv3;
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
								//patch.next = null;
							}
							noise7 = c_lv3.arr;
					}
					//const	noise8 = getRandom( (npx), npy, (npz) );
					{
						//var fx = (x=x||0) &  0xF:
						//var fy = (y=x||0) &  0xF:
						//var fz = (z=z||0) &  0xF:
						const sx= (npx/CUBE_ELEMENT_SIZE)|0
						const sy= (npy/CUBE_ELEMENT_SIZE)|0;
						const sz= (npz/CUBE_ELEMENT_SIZE)|0;
				
							var c_lv1 = cache[sx ];
							if( !c_lv1 ) ( c_lv1 = cache[sx] = [] );
							
							var c_lv2 = c_lv1[sy];				
							if( !c_lv2 ) 
								c_lv2 = c_lv1[sy] = [];
				
							let c_lv3 = c_lv2[sz];
							const patch = c_lv3;
					
							if( !c_lv3 ) {
								data = [ sx, sy, sz, opts.seed ].join( " " );
								c_lv3 = c_lv2[sz] = myRandom();
								c_lv3.sx = sx;
								c_lv3.sy = sy;
								c_lv3.sz = sz;
								//console.log( "clv:", c_lv3 )
							}
							//heatCache( c_lv3 );
							{
								const patch = c_lv3;
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
								//patch.next = null;
							}
							noise8 = c_lv3.arr;
					}

					gen.ix = nx % CUBE_ELEMENT_SIZE;
					while( gen.ix < 0 ) gen.ix += CUBE_ELEMENT_SIZE;
					gen.jx = (gen.ix+gen.pitch)%CUBE_ELEMENT_SIZE;

					gen.iy = ny % CUBE_ELEMENT_SIZE;
					while( gen.iy < 0 ) gen.iy += CUBE_ELEMENT_SIZE;
					gen.jy = (gen.iy+gen.pitch)%CUBE_ELEMENT_SIZE;

					gen.iz = nz % CUBE_ELEMENT_SIZE;
					while( gen.iz < 0 ) gen.iz += CUBE_ELEMENT_SIZE;
					gen.jz = (gen.iz+gen.pitch)%CUBE_ELEMENT_SIZE;
				
					gen.corn[0] = noise1[ (gen.iz) * (CUBE_ELEMENT_SIZE*CUBE_ELEMENT_SIZE) +  (gen.iy) * CUBE_ELEMENT_SIZE + gen.ix ];
					gen.corn[1] = noise2[ (gen.iz) * (CUBE_ELEMENT_SIZE*CUBE_ELEMENT_SIZE) +  (gen.iy) * CUBE_ELEMENT_SIZE + (gen.jx) ];

					gen.corn[2] = noise3[ (gen.iz) * (CUBE_ELEMENT_SIZE*CUBE_ELEMENT_SIZE) +  (gen.jy) * CUBE_ELEMENT_SIZE + gen.ix ];
					gen.corn[3] = noise4[ (gen.iz) * (CUBE_ELEMENT_SIZE*CUBE_ELEMENT_SIZE) +  (gen.jy) * CUBE_ELEMENT_SIZE + (gen.jx) ];

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
