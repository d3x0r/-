/*
 * This is a x/y/z zone cache... it caches on a mod 16 fixed size...
 *

import {SpacialCache} from "space_cache.js"

 const cache = new SpacialCache( )

 // cache finds and adds.
 const cachedVal = cache.findOrAdd( x, y, z, ()=>{
	 return value_if_not_found
 } );

// find only.
 const inCache = cache.findInCache();


*/


export {SpacialCache}
//const CUBE_ELEMENT_SIZE = 16;

class SpacialCacheEntry {
	sx = 0;
	sy = 0;
	sz = 0;

	nx = null;
	ny = null;
	nz = null;

	px = null;
	py = null;
	pz = null;

	next = null;
	prev = null;

	arr = null;
	//created = new Date();
	//heated = new Date();
	constructor( x, y, z, cb ){
		this.sx = x; this.sy = y; this.sz = z;
		this.arr = cb(this);
	}

	makeEntry(x,y,z ) {
		return 
	}
}

class SpacialCache {

	most_used = null; // linear list of cache.

	cache_size = 500;
	cache_low = 400;
	cacheLen = 0;
	cache = null; // 3D root sorted by X/Y/Z
	CUBE_ELEMENT_SIZE = 1;
	counters = [0,0,0,0,0,0,0,0,0,0];
	start = Date.now();

	constructor( cubeSize )
	{
		this.CUBE_ELEMENT_SIZE = cubeSize;
	}
	makeEntry(x,y,z ) {
		return new SpacialCacheEntry( x, y, z || 0 )
	}

	findInCache( patch ) {
		//let count = 0;
		const sx = patch.sx;
		const sy = patch.sy;
		const sz = patch.sz;
		let p = this.cache;
		let _p = null;
		let __p = null;

		while( p ) {
			__p = _p;
			_p = p;

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
						this.heatCache( p );
						return this.arr;
					}						
				}
			}
		}
		return null;
	}

	heatCache( patch ) {
		var p1 = this.most_used;
		var _p1 = null;
		if( patch && (patch.next || patch.prev) ) {
			if( patch.prev ) patch.prev.next = patch.next;
			else this.most_used = patch.next;
			if( patch.next ) patch.next.prev = patch.prev;
			patch.next = null;
			patch.prev = null;
			this.cacheLen--;
		}
		if( this.cacheLen > this.cache_size ) {
			let counter = 0;
			for( p1 = this.most_used; p1; (_p1 = p1),p1 = p1.next ) {
				counter++;
				if( counter === this.cache_low ) {
					this.cacheLen = counter;
					const dropList = p1.next;
					p1.next = null;
					if( dropList ) dropList.prev = null;
					
					for( let p2 =dropList; p2; p2 = p2.next ) {
						p2.arr = null;
						//console.log( "drop:", p2 );
						if( p2.nz ) {
							const rep = p2.nz; // the replacement for me.
							if( rep.pz = p2.pz ) // removed from z list
								p2.pz.nz = rep;
							if( p2.nx ) // if I was part of the x list...
							if( rep.nx = p2.nx ) 
								p2.nx.px = rep;
							if( p2.px )// if I was part of the x list...
							if( rep.px = p2.px ) 
								p2.px.nx = rep;
							if( p2.ny )// if this was part of the y list...
							if( rep.ny = p2.ny )
								p2.ny.py = rep;
							if( p2.py )// if this was part of the y list...
							if( rep.py = p2.py ) 
								p2.py.ny = rep;
							if( p2 === this.cache ) this.cache = rep;
						} else if( p2.pz ) {
							// .nz IS null.. so only do the first assign.
							p2.pz.nz = null;
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
								p2.py.ny = p2.pz;
								p2.pz.py = p2.py;
							}
							if( p2 === this.cache ) this.cache = p2.pz;
						} else {
							if( p2.ny ) {
								if( p2.ny.py = p2.py )
									p2.py.ny = p2.ny;

								if( p2.nx ) {
									p2.nx.px = p2.ny;
									p2.ny.nx = p2.nx;
								}
								if( p2.px ) {
									p2.px.nx = p2.ny;
									p2.ny.px = p2.px;
								}
								if( p2 === this.cache ) this.cache = p2.ny;
							} else if( p2.py ) {
								// .ny IS null
								p2.py.ny = null;

								if( p2.nx ) {
									p2.nx.px = p2.py;
									p2.py.nx = p2.nx;
								}
								if( p2.px ) {
									p2.px.nx = p2.py;
									p2.py.px = p2.px;
								}
								if( p2 === this.cache ) this.cache = p2.py;
							} else {
								if( p2.nx ) {
									// this is part of the X chain.
									if( p2.nx.px = p2.px )
										p2.px.nx = p2.nx;
									if( p2 === this.cache ) this.cache = p2.nx;
								} else if( p2.px ) { // not first, no cache change (is last actually)
									p2.px.nx = null;
									if( p2 === this.cache ) this.cache = p2.px;
								} else {
									console.log( "block wasn't linked into the space at all??", p2 );
									debugger;
								}
							}
						}
						p2.px =p2.nx =p2.py =p2.ny =p2.pz =p2.nz = null;
					}
					break;
				}
			}
		}
		//patch.heated = new Date();
		if( this.most_used ) {
			this.most_used.prev = patch;
			patch.next = this.most_used;
			this.most_used = patch;
			this.cacheLen++;
		} else {
			this.most_used = patch;
			this.cacheLen = 1;
		}
	}

	
	findOrAdd( x, y, z, cb ) {
		const sx= (x>>this.CUBE_ELEMENT_SIZE)
		const sy= (y>>this.CUBE_ELEMENT_SIZE);
		const sz= (z>>this.CUBE_ELEMENT_SIZE);
		if(0) {
			this.counters[0]++;
			const now = Date.now();
			const span = (now - this.start)>0?(now-this.start):1;
			this.start = now;
			
			if( this.counters[0] > 10000 ){
				console.log( "counters:", this.counters.map( val=>(val/this.counters[0])/span));
				for( let n = 0; n < this.counters.length; n++ ) {
					this.counters[n] = 0;
				}
			}
		}
		{
			//let count = 0;
			let p = this.cache;
			let _p = null;
			let __p = null;
			while( p ) {
				__p = _p;
				_p = p;
				//count++; if( count > 100 ) debugger;
				if( sx > p.sx ) {
					if(0)this.counters[1]++;
					if( p.nx && ( p.nx != __p ) ) p = p.nx;
					else {
						const b = new SpacialCacheEntry( sx, sy, sz, cb );
						if( b.nx = p.nx ) {
							p.nx.px = b;
						}
						// there will not be a p.nx.
						b.px = p;
						p.nx = b;
						p = b;
						break;
					}
				} else if( sx < p.sx ) {
					if(0)this.counters[2]++;
					if( p.px && (p.px !== __p )) p = p.px;
					else {
						const b = new SpacialCacheEntry( sx, sy, sz, cb );
						if( b.px = p.px ) {
							p.px.nx = b;
						}
						b.nx = p;
						p.px = b;
						p = b;
						break;
					}
				} else { // sx == p.sx
					if( sy > p.sy ) {
						if(0)this.counters[3]++;
						if( p.ny && ( p.ny != __p ) ) p = p.ny;
						else {
							const b = new SpacialCacheEntry( sx, sy, sz, cb );
							if( b.ny = p.ny ) {
								p.ny.py = b;
							}
							b.py = p;
							p.ny = b;
							p = p.ny;
							break;
						}
					} else if( sy < p.sy ) {
						if(0)this.counters[4]++;
						if( p.py && ( p.py != __p ) ) p = p.py;
						else {
							const b = new SpacialCacheEntry( sx, sy, sz, cb );
							if( b.py = p.py ) {
								p.py.ny = b;
							}
							p.py = b;
							b.ny = p;
							p = b;
							break;
						}
					} else {
						if( sz > p.sz ) {
							if(0)this.counters[5]++;
							if( p.nz && ( p.nz != __p ) ) p = p.nz;
							else {
								const b = new SpacialCacheEntry( sx, sy, sz, cb );
								if( b.nz = p.nz ) {
									p.nz.pz = b;
								}
								p.nz = b;
								b.pz = p;
								p = b;
								break;
							}
						}else if( sz < p.sz ) {
							if(0)this.counters[6]++;
							if( p.pz && ( p.pz != __p ) ) p = p.pz;
							else {
								const b = new SpacialCacheEntry( sx, sy, sz, cb );
								if( b.pz = p.pz ) {
									p.pz.nz = b;
								}
								p.pz = b;
								b.nz = p;
								p = b;
								break;
							}
						} else {
							if(0)this.counters[7]++;
							// sx, sy, sz == here.
							//console.log( "Return", p.sx, p.sy, p.sz, sx, sy, sz );
							this.heatCache( p );
							return p.arr;
						}
					}
				}
			}
			if( !p ) {
				this.cache = p = new SpacialCacheEntry( sx, sy, sz, cb );
			}
			//console.log( "New cached value:", p );
			this.heatCache( p );
			return p.arr;
		}
	}

}