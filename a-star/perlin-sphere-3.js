import {SaltyRNG} from "./salty_random_generator.js"
import {SpacialCache} from "./space_cache.js"
const CUBE_ELEMENT_BITS = 6
const CUBE_ELEMENT_SIZE = 1 << CUBE_ELEMENT_BITS
const _validate_unlink = false;

function noise( s, opts ) {
	const  _2d = !!( opts && opts["2D"] );
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
	const gens = opts.generations || 6;
	const cache = new SpacialCache( CUBE_ELEMENT_BITS );
	if( cache._2d ) cache.cache_size = 50;cache.cache_low = 40;
	//opts.cache;
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


	function myRandom(node) {
		RNG.reset();
		if(  _2d ) {
			var n = 0;
			const arr = [];
			data = `${node.sx} ${node.sy} ${opts.seed}`
			const arrb = RNG.getBuffer( 8*CUBE_ELEMENT_SIZE*CUBE_ELEMENT_SIZE );
			const buf = new Uint8Array( arrb );
			
			//for( var nz = 0; nz< CUBE_ELEMENT_SIZE; nz++ ) 
				for( var ny = 0; ny < CUBE_ELEMENT_SIZE; ny++ ) 
					for( var nx = 0; nx < CUBE_ELEMENT_SIZE; nx++ )  {
						var val = buf[n++] / 255; // 0 < 1 
						arr.push(val);
						//arr.push( Math.random() );
					}
			return arr;

		}
		else {
			let n = 0;
			const arr = [];
			data = `${node.sx} ${node.sy} ${node.sz} ${opts.seed}`
			const arrb = RNG.getBuffer( 8*CUBE_ELEMENT_SIZE*CUBE_ELEMENT_SIZE*CUBE_ELEMENT_SIZE );
			const buf = new Uint8Array( arrb );
			
			for( var nz = 0; nz< CUBE_ELEMENT_SIZE; nz++ ) 
				for( var ny = 0; ny < CUBE_ELEMENT_SIZE; ny++ ) 
					for( var nx = 0; nx < CUBE_ELEMENT_SIZE; nx++ )  {
						var val = buf[n++] / 255; // 0 < 1 
						arr.push(val);
						//arr.push( Math.random() );
					}
			return arr;
		}
	}

	function getRandom( x, y, z ) {
		return cache.findOrAdd( x, y, z, myRandom );
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
					let	noise5 = null;
					let	noise6 = null;
					let	noise7 = null;
					let	noise8 = null;

					if( ! _2d ) {
						noise5 = getRandom( nx   , ny , (npz) );
						noise6 = getRandom( (npx), ny , (npz) );
						noise7 = getRandom( nx   , npy, (npz) );
						noise8 = getRandom( (npx), npy, (npz) );
					}

					gen.ix = nx % CUBE_ELEMENT_SIZE;
					if( gen.ix < 0 ) gen.ix += CUBE_ELEMENT_SIZE;
					gen.jx = (gen.ix+gen.pitch)%CUBE_ELEMENT_SIZE;

					gen.iy = ny % CUBE_ELEMENT_SIZE;
					if( gen.iy < 0 ) gen.iy += CUBE_ELEMENT_SIZE;
					gen.jy = (gen.iy+gen.pitch)%CUBE_ELEMENT_SIZE;

					if( ! _2d ) {
						gen.iz = nz % CUBE_ELEMENT_SIZE;
						if( gen.iz < 0 ) gen.iz += CUBE_ELEMENT_SIZE;
						gen.jz = (gen.iz+gen.pitch)%CUBE_ELEMENT_SIZE;
					}else
						gen.iz = 0;

	if(  _2d ) {
					gen.corn[0] = noise1[   (gen.iy) * CUBE_ELEMENT_SIZE + gen.ix ];
					gen.corn[1] = noise2[   (gen.iy) * CUBE_ELEMENT_SIZE + (gen.jx) ];

					gen.corn[2] = noise3[   (gen.jy) * CUBE_ELEMENT_SIZE + gen.ix ];
					gen.corn[3] = noise4[   (gen.jy) * CUBE_ELEMENT_SIZE + (gen.jx) ];
	}
					if( ! _2d ) {
					gen.corn[0] = noise1[ (gen.iz) * (CUBE_ELEMENT_SIZE*CUBE_ELEMENT_SIZE) +  (gen.iy) * CUBE_ELEMENT_SIZE + gen.ix ];
					gen.corn[1] = noise2[ (gen.iz) * (CUBE_ELEMENT_SIZE*CUBE_ELEMENT_SIZE) +  (gen.iy) * CUBE_ELEMENT_SIZE + (gen.jx) ];

					gen.corn[2] = noise3[ (gen.iz) * (CUBE_ELEMENT_SIZE*CUBE_ELEMENT_SIZE) +  (gen.jy) * CUBE_ELEMENT_SIZE + gen.ix ];
					gen.corn[3] = noise4[ (gen.iz) * (CUBE_ELEMENT_SIZE*CUBE_ELEMENT_SIZE) +  (gen.jy) * CUBE_ELEMENT_SIZE + (gen.jx) ];
						gen.corn[4] = noise5[ (gen.jz) * (CUBE_ELEMENT_SIZE*CUBE_ELEMENT_SIZE) + gen.iy * CUBE_ELEMENT_SIZE + gen.ix ];
						gen.corn[5] = noise6[ (gen.jz) * (CUBE_ELEMENT_SIZE*CUBE_ELEMENT_SIZE) + (gen.iy) * CUBE_ELEMENT_SIZE + (gen.jx) ];

						gen.corn[6] = noise7[ (gen.jz) * (CUBE_ELEMENT_SIZE*CUBE_ELEMENT_SIZE) + (gen.jy) * CUBE_ELEMENT_SIZE + gen.ix ];
						gen.corn[7] = noise8[ (gen.jz) * (CUBE_ELEMENT_SIZE*CUBE_ELEMENT_SIZE) + (gen.jy) * CUBE_ELEMENT_SIZE + (gen.jx) ];
					}
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
