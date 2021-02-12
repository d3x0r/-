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
		else if( i == 2 ) gen.scalar /= 2;
		else if( i == 6 ) gen.scalar *= 2;
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
					arr.push(val);
					//arr.push( Math.random() );
				}
		return { id:data, when : 0, next : null, arr: arr
					, sx:0, sy:0, sz:0
					, nx:null, ny:null, nz:null 
					, px:null, py:null, pz:null 
				};
	}

	var last_used;
	var most_used;
	var cacheLen = 0;

const _debug_drop = false;

	function findInCache( patch ) {
			let count = 0;
			const sx = patch.sx;
			const sy = patch.sy;
			const sz = patch.sz;
//debugger;
			let p = cache[0];
			//let finds = [];
			let _p = null;
			let __p = null;
			let inY = null;
			let inZ = null;
			while( p ) {
				__p = _p;
				_p = p;
			//		finds.push( `compare to ${p.sx} ${p.sy} ${p.sz}  ${!!p.px}  ${!!p.nx}    ${!!p.py}  ${!!p.ny}     ${!!p.pz}  ${!!p.nz} ` );
				if( inY ) if( p.nx || p.px ) debugger;
				if( inZ ) if( p.nx || p.px || p.ny || p.py ) debugger;

				count++; if( count > 100 ) debugger;
				if( sx > p.sx ) {
					if( p.nx && p.nx != __p ) p = p.nx;
					else break;
				} else if( sx < p.sx ) {
					if( p.px && p.px != __p ) p = p.px;
					else break;
				} else { // sx == p.sx
					if( sy > p.sy ) {
						if( p.ny && p.ny != __p ) p = p.ny;
						else break;
					} else if( sy < p.sy ) {
						if( p.py && p.py != __p ) p = p.py;
						else break;
					} else {
						if( sz > p.sz ) {
							if( p.nz && p.nz != __p ) p = p.nz;
							else break;
						}else if( sz < p.sz ) {
							if( p.pz && p.pz != __p ) p = p.pz;
							else break;
						} else {
							// sx, sy, sz == here.
							//console.log( "Return", p.sx, p.sy, p.sz, sx, sy, sz );
							//heatCache( p );
							return true;
						}						
					}
				}
			}
			//console.log( "Failed to locate patch", patch );
			//debugger;
			return false;
	}

	var deleted = false;
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
		if( cacheLen > 50 ) {
			let counter = 0;
			for( p1 = most_used; p1; (_p1 = p1),p1 = p1.next ) {
				counter++;
				if( counter === 40 ) {
					_debug_drop && console.log( "Trimming some cache...", p1 );
					cacheLen = counter;
					const dropList = p1.next;
					p1.next = null;
					for( let p2 =dropList; p2; p2 = p2.next ) {
						console.log( "Drop block:", p2.sx, p2.sy, p2.sz );
						//if( p2.sx === -16 && p2.sy === -16 && p2.sz === 0 ) debugger;
						//if( p2.sx === -8 && p2.sy === -8 && p2.sz === 0 ) debugger;
						//if( p2.sx === -6 && p2.sy === -6 && p2.sz === 0 ) debugger;
						//if( p2.sx === -4 && p2.sy === -4 && p2.sz === 0 ) debugger;
						//if( p2.id === "-8 0 4 ") debugger;
						//if( p2.id === "0 -4 2 ") debugger;
						//if( p2.id === "1 -3 0 ") debugger;
						if( p2.sx === 18 && p2.sy === 0 && p2.sz === 0 ) debugger;


						if( p2.nz ) {
							_debug_drop && console.log( "Node has NY&NZ - swap Z chain into X" );
							if( p2.nz.pz = p2.pz ) {
								p2.pz.nz = p2.nz;
							}

							if( p2.nx ) {
								p2.nx.px = p2.nz;
								p2.nz.nx = p2.nx;
							}
							if( p2.px ) {
								p2.px.nx = p2.nz;
								p2.nz.px = p2.px;
							}
							if( p2.ny ) {
								p2.ny.py = p2.nz;
								p2.nz.ny = p2.ny;
							}
							if( p2.py ) {
								p2.py.ny = p2.nz;
								p2.nz.py = p2.py;
							}
							if( p2 === cache[0] ) cache[0] = p2.nz;
						} else if( p2.pz ) {
							p2.pz.nz = null;
							
							_debug_drop && console.log( "Node has NY&PZ - swap Z chain into X" );
							if( p2.nx ) {
								p2.nx.px = p2.pz;
								p2.pz.nx = p2.nx;
							}
							if( p2.px ) {
								p2.px.nx = p2.pz;
								p2.pz.px = p2.px;
							}
							if( p2.ny ) {
								p2.ny.py = p2.pz;
								p2.pz.ny = p2.ny;
							}
							if( p2.py ) {
								p2.pz.py = p2.py;
								p2.py.ny = p2.pz;
							}
							if( p2 === cache[0] ) cache[0] = p2.pz;
						} else {

							if( p2.ny ) {
								if( p2.ny.py = p2.py )
									p2.py.ny = p2.ny;

								_debug_drop && console.log( "Node has NY - swap Y chain into X" );
								if( p2.nx ) {
									p2.nx.px = p2.ny;
									p2.ny.nx = p2.nx;
								}
								if( p2.px ) {
									p2.px.nx = p2.ny;
									p2.ny.px = p2.px;
								}
								
								
								if( p2 === cache[0] ) cache[0] = p2.ny;
							} else if( p2.py ) {
								_debug_drop && console.log( "Node has PY - swap Y chain into X" );
								p2.py.ny = null;

								if( p2.nx ) {
									p2.nx.px = p2.py;
									p2.py.nx = p2.nx;
								}
								if( p2.px ) {
									p2.px.nx = p2.py;
									p2.py.px = p2.px;
								}
								if( p2.ny ){
									p2.py.ny = p2.ny;
								}
								if( p2 === cache[0] ) cache[0] = p2.py;
							} else {
								_debug_drop && console.log( "must be part of x chain" );
								if( p2.nx ) {
									// this is part of the X chain.
									_debug_drop && console.log( "cut X chain node" );
									if( p2.nx.px = p2.px ) p2.px.nx = p2.nx;
									if( p2 === cache[0] ) cache[0] = p2.nx;
								} else if( p2.px ) { // not first, no cache change (is last actually)
									p2.px.nx = null;
									if( p2 === cache[0] ) cache[0] = p2.px;
								} else {
									console.log( "block wasn't linked into the space at all??");
									debugger;
								}
							}
						}
						// p2 should be unlinked.
						if( findInCache( p2 ) )debugger;
						if( cache[0].sx === -4 && cache[0].sy === -3 && cache[0].sz === 0 ) debugger;
						let px;
						for( px = cache[0]; px; px = px.nx ){
							let spy = px.ny;
							while( spy && spy.py ) spy = spy.py;
							let py;
							for( py = spy; py; py = py.ny ) {
								let spz = py.nz;
								if( py.sx != spy.sx ) debugger;
								if( py != px ) {
									if( py.nx || py.px ) debugger;
								}
								while( spz && spz.pz ) spz = spz.pz;
								let pz;
								for( pz = spz; pz; pz = pz.nz ) {
									let p3, p4;
									if( pz.sy != spz.sy ) debugger;
									if( pz.sx != spy.sx ) debugger;
									if( pz != py ) {
										if( pz.nx || pz.px ) debugger;
										if( pz.ny || pz.py ) debugger;
									}
									if( pz.nx ) if( pz.nx.px != pz ) debugger;
									if( pz.px ) if( pz.px.nx != pz ) debugger;
									if( pz.ny ) if( pz.ny.py != pz ) debugger;
									if( pz.py ) if( pz.py.ny != pz ) debugger;
									if( pz.nz ) if( pz.nz.pz != pz ) debugger;
									if( pz.pz ) if( pz.pz.nz != pz ) debugger;
									if( pz.nx && pz.nx.id === "-4 -3 0 " ) debugger;
									for( p3 = most_used; p3; p3 = p3.next ) {
										if( pz === p3 ) break;
									}
									for( p4 = p2.next; p4; p4 = p4.next ) {
										if( pz === p4 ) break;
									}
									if( !p3 && !p4 ) debugger;
									if( p3 ) break;
								}					
								if( pz ) break;			
							}
							if( py ) break;
						}
						if( cache[0].nx.id === "-4 -3 0 ")debugger;
						//if( !px ) debugger;
            			for( let p3 = p2.next; p3; p3 = p3.next ) {
							if( !findInCache( p3 ) )debugger;
							if( p3.nx && p3.nx.id === "-4 -3 0 " ) debugger;
							if( p3.nx ) if( p3.nx.px != p3 ) debugger;
							if( p3.px ) if( p3.px.nx != p3 ) debugger;
							if( p3.ny ) if( p3.ny.py != p3 ) debugger;
							if( p3.py ) if( p3.py.ny != p3 ) debugger;
							if( p3.nz ) if( p3.nz.pz != p3 ) debugger;
							if( p3.pz ) if( p3.pz.nz != p3 ) debugger;
					}
            			for( let p3 = most_used; p3; p3 = p3.next ) {
								if( !findInCache( p3 ) )debugger;
								if( !p3.nz 
								   && !p3.ny
								   && !p3.nx
								   && !p3.pz
								   && !p3.py
								   && !p3.px ){
									console.log( "This block has (recently?) become orphaned" );
									debugger;
								}
								if( p3.nx && p3.nx.id === "-4 -3 0 " ) debugger;
								if( p3.nx ) if( p3.nx.px != p3 ) debugger;
								if( p3.px ) if( p3.px.nx != p3 ) debugger;
								if( p3.ny ) if( p3.ny.py != p3 ) debugger;
								if( p3.py ) if( p3.py.ny != p3 ) debugger;
								if( p3.nz ) if( p3.nz.pz != p3 ) debugger;
								if( p3.pz ) if( p3.pz.nz != p3 ) debugger;
							}
						
						//opts.cache[p2.sx][p2.sy][p2.sz] = null;
					}
					/*
					for( let x = 0; x < opts.cache.length; x++ ) {
						for( let y = 0; y < opts.cache.length; y++ ) {
							for( let z = 0; z < opts.cache.length; z++ ) {
							}
						}
					}
					*/
					p1.next = null; // trim tail of cached values... recompute later.
	
					break;
				}
			}
			
		}else {
			for( let p3 = most_used; p3; p3 = p3.next ) {
				if( !findInCache( p3 ) ) {
					debugger;
					findInCache( p3 );
				}
				if( !p3.nz 
				   && !p3.ny
				   && !p3.nx
				   && !p3.pz
				   && !p3.py
				   && !p3.px ){
					console.log( "This block has (recently?) become orphaned" );
					debugger;
				}
				if( p3.nx && p3.nx.id === "-4 -3 0 " ) debugger;
				if( p3.nx ) if( p3.nx.px != p3 ) debugger;
				if( p3.px ) if( p3.px.nx != p3 ) debugger;
				if( p3.ny ) if( p3.ny.py != p3 ) debugger;
				if( p3.py ) if( p3.py.ny != p3 ) debugger;
				if( p3.nz ) if( p3.nz.pz != p3 ) debugger;
				if( p3.pz ) if( p3.pz.nz != p3 ) debugger;
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
		{
			let count = 0;
			let _p = null;
			let __p = null;
//debugger;
			let p = cache[0];
			//let finds = [];
			//if( sx == 0 && sy == 0 && sz == 2 ) debugger;
			while( p ) {
				__p = _p;
				_p = p;
			//		finds.push( `compare to ${p.sx} ${p.sy} ${p.sz}  ${!!p.px}  ${!!p.nx}    ${!!p.py}  ${!!p.ny}     ${!!p.pz}  ${!!p.nz} ` );
			count++; if( count > 100 ) debugger;
				if( sx > p.sx ) {
					if( p.nx && ( p.nx != __p ) ) p = p.nx;
				   	else {
						data = [ sx, sy, sz, opts.seed ].join( " " );
						const b = myRandom();
						if( p.nx ) {
							b.nx = p.nx 
							p.nx.px = b;
						}
						// there will not be a p.nx.
						b.px = p;
						p.nx = b;
						p = b;
						break;
					}
				} else if( sx < p.sx ) {
					if( p.px && (p.py !== __p )) p = p.px;
					else {
						data = [ sx, sy, sz, opts.seed ].join( " " );
						const b = myRandom();

						if( p.px ) {
							b.px = p.px;
							p.px.nx = b;
						}
						b.nx = p;
						p.px = b;
						p = b;
						break;
					}
				} else { // sx == p.sx
					if( sy > p.sy ) {
						if( p.ny && ( p.ny != __p ) ) p = p.ny;
						else {
							data = [ sx, sy, sz, opts.seed ].join( " " );
							const b = myRandom();
							if( p.ny ) {
								b.ny = p.ny;
								p.ny.py = b;
							}
							b.py = p;
							p.ny = b;
							p = p.ny;
							break;
						}
					} else if( sy < p.sy ) {
						if( p.py && ( p.py != __p ) ) {
							p = p.py;
						} else {
							data = [ sx, sy, sz, opts.seed ].join( " " );
							const b = myRandom();
							if( b.py = p.py ) {
								b.py = p.py;
								p.py.ny = b;
							}
							p.py = b;
							b.ny = p;
							p = b;
							break;
						}
					} else {
						if( sz > p.sz ) {
							if( p.nz && ( p.nz != __p ) ) p = p.nz;
							else {
								data = [ sx, sy, sz, opts.seed ].join( " " );
								const b = myRandom();
								if( p.nz ) {
									b.nz = p.nz;
									p.nz.pz = b;
								}
								p.nz = b;
								b.pz = p;

								p = b;
								break;
							}
						}else if( sz < p.sz ) {
							if( p.pz && ( p.pz != __p ) ) p = p.pz;
							else 
							{
								data = [ sx, sy, sz, opts.seed ].join( " " );
								const b = myRandom();
								if( b.pz = p.pz )
									p.pz.nz = b;
								p.pz = b;
								b.nz = p;

								p = b;
								break;
							}
						} else {
							// sx, sy, sz == here.
							//console.log( "Return", p.sx, p.sy, p.sz, sx, sy, sz );
							heatCache( p );
							return p.arr;
						}						
					}
				}
			}
			if( !p ) {
				data = [ sx, sy, sz, opts.seed ].join( " " );
				cache[0] = p = myRandom();
			}
//		 if( sx ==22 && sy == 1&& sz == 0 ) debugger;
			//if( sx == -4 && sy == -4 && sz == 0 ) debugger;
			console.log( "Cached ", sx, sy, sz, "on",_p&& _p.sx, _p&&_p.sy, _p&&_p.sz, "on",__p&& __p.sx, __p&&__p.sy, __p&&__p.sz,  );//, finds.join("\n" ) );
			p.sx = sx;
			p.sy = sy;
			p.sz = sz;
			heatCache( p );
			return p.arr;
		}
			
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
		get(x,y,z,s) {
			return this.get2(x,y,z,s);
		},

		get2(x,y,z,s) {
			z = z || 0;

			// Y will be 0 at the same time this changes...  which will update all anyway
			for( var n = 0; n < noiseGen.length; n++ ) {
				var gen = noiseGen[n];

				var nx;
				var ny;
				var nz;
				var npx, npy, npz;
				
				nx = Math.floor(( (x-gen.ox) / gen.pitch ) )*gen.pitch;
				ny = Math.floor(( (y-gen.oy) / gen.pitch ) )*gen.pitch;
				nz = Math.floor(( (z-gen.oz) / gen.pitch ) )*gen.pitch;
				npx = nx + gen.pitch;
				npy = ny + gen.pitch;
				npz = nz + gen.pitch;

				//mod = 6*opts.patchSize;
				//nx += s*opts.patchSize;
				gen.cx = ((x - gen.ox)/gen.pitch) % 1;
				if( gen.cx < 0 ) { gen.cx += 1; /*nx -=1*/ }

				gen.cy = ((y - gen.oy)/gen.pitch) % 1;
				if( gen.cy < 0 ) { gen.cy += 1; /*ny -= 1*/ }

				gen.cz = ((z - gen.oz)/gen.pitch) % 1;
				if( gen.cz < 0 ) { gen.cz += 1; }

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

					const	noise1 = getRandom( nx   , ny   , nz );
					const	noise2 = getRandom( (npx), ny   , nz );
					const	noise3 = getRandom( nx   , (npy), nz );
					const	noise4 = getRandom( (npx), (npy), nz );
					const	noise5 = getRandom( nx   , ny , (npz) );
					const	noise6 = getRandom( (npx), ny , (npz) );
					const	noise7 = getRandom( nx   , npy, (npz) );
					const	noise8 = getRandom( (npx), npy, (npz) );

					gen.ix = nx % CUBE_ELEMENT_SIZE;
					if( gen.ix < 0 ) gen.ix += CUBE_ELEMENT_SIZE;
					gen.jx = (gen.ix+gen.pitch)%CUBE_ELEMENT_SIZE;

					gen.iy = ny % CUBE_ELEMENT_SIZE;
					if( gen.iy < 0 ) gen.iy += CUBE_ELEMENT_SIZE;
					gen.jy = (gen.iy+gen.pitch)%CUBE_ELEMENT_SIZE;

					gen.iz = nz % CUBE_ELEMENT_SIZE;
					if( gen.iz < 0 ) gen.iz += CUBE_ELEMENT_SIZE;
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

			for( var n = 0; n < noiseGen.length; n++ ) {
				var gen = noiseGen[n];
				// ((((c1)*(max-(d))) + ((c2)*(d)))/max)				
				//console.log( "gen.cx:", gen.cx );
				const tx = gen.cx;//(1-Math.cos( gen.cx *Math.PI) )/2;
				const ty = gen.cy;//(1-Math.cos( gen.cy *Math.PI) )/2;
				const tz = gen.cz;//(1-Math.cos( gen.cz *Math.PI) )/2;

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
