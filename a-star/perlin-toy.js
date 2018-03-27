
var config = {
	patchSize : 512, // repeat frequency of noise generation (kernel is only 16(x16(x16)) (32x16=512)
	seed_noise : null,
	gen_noise : null,
	left : 32,    // default left side (entry)
	right : 96,   // default right side (exit)
	nodes : [],  // trace of A*Path
	base : 0,
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
const BASE_COLOR_RED = [127,0,0,255];
const BASE_COLOR_LIGHTBLUE = [0,0,255,255];
const BASE_COLOR_LIGHTRED = [255,0,0,255];
const BASE_COLOR_LIGHTGREEN = [0,255,0,255];

var data;
var RNG = exports.SaltyRNG( arr=>arr.push( data ) );


function myRandom() {
	var arr = [];
	//data = [ x>>3, y >> 3, z>>3 ].join( " " );
	RNG.reset();
	for( var nz = 0; nz< 16; nz++ ) 
	for( var ny = 0; ny < 16; ny++ ) 
	for( var nx = 0; nx < 16; nx++ )  {
		var val = RNG.getBits( 16, false ) / 65536; // 0 < 1 
		arr.push( val );
	}
	return { id:data, arr: arr };
}

var cache = [];

function getRandom( x, y, z ) {
	var start = Date.now();
	data = [ x>>4, y >> 4, z>>4 ].join( " " );
	for( var n = 0; n < cache.length; n++ ) {
		if( cache[n].id === data )
			return cache[n].arr;
	}
	var c;
	cache.push( c = myRandom() );
	console.log( "Made Random in:", Date.now() - start );
	return c.arr;
}


	var noiseGen = [
		//{ steps : 2, scalar : 0.5, corn: [0,0,0,0], dx : 0, dy : 0, cx : 0, cy : 0, dx1 : 0, dx2 : 0  },
		{ steps : 4, scalar : 0.25, corn: [0,0,0,0], dx : 0, dy : 0, cx : 0, cy : 0, dx1 : 0, dx2 : 0, ox:0,oy:0 },
		{ steps : 8, scalar : 0.125, corn: [0,0,0,0], dx : 0, dy : 0, cx : 0, cy : 0, dx1 : 0, dx2 : 0, ox:0,oy:0  },
		{ steps : 16, scalar : 0.0625, corn: [0,0,0,0], dx : 0, dy : 0, cx : 0, cy : 0, dx1 : 0, dx2 : 0, ox:0,oy:0  },
		{ steps : 32, scalar : 0.03125, corn: [0,0,0,0], dx : 0, dy : 0, cx : 0, cy : 0, dx1 : 0, dx2 : 0, ox:0,oy:0  },
		{ steps : 64, scalar : 0.015625, corn: [0,0,0,0], dx : 0, dy : 0, cx : 0, cy : 0, dx1 : 0, dx2 : 0, ox:0,oy:0  },
		{ steps : 128, scalar : 1/128, corn: [0,0,0,0], dx : 0, dy : 0, cx : 0, cy : 0, dx1 : 0, dx2 : 0, ox:0,oy:0  },
		{ steps : 256, scalar : 1/256, corn: [0,0,0,0], dx : 0, dy : 0, cx : 0, cy : 0, dx1 : 0, dx2 : 0, ox:0,oy:0  },
	];
	var noiseInit = false;


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
	//tickStar(step);

	function stepPlasma() {
		config.base += 0.1;
		genData( config );
		if( config.canvas ) {
			drawData( config );
		}
		setTimeout( stepPlasma, 90 );
	}
	stepPlasma();


}




function fillData( config ) {
	var start = Date.now();
	var noise = [];
	for( var n = 0; n < config.patchSize; n++ ) 
		for( m = 0; m < config.patchSize; m++ ) {
			noise.push( Math.random() );
		}
	config.seed_noise = noise;
	console.log( "Made Random in:", Date.now() - start );
}



function genData( config ) {
	var start = Date.now();
	var noise = config.seed_noise;
	var outNoise = config.gen_noise || [];
	outNoise.length = 0;
	

	var maxtot = 0;
	var minVal = Infinity;
	var maxVal = 0;
	if( !noiseInit ) {
		for( var n = 0; n < noiseGen.length; n++ ) {
			var gen = noiseGen[n];
			//gen.scalar *= 2 ;
			//gen.scalar *= 7;
			gen.nx = 0;
			gen.ny = 0;
		}
		noiseInit = true;
	}

	for( var n = 0; n < noiseGen.length; n++ ) {
		var gen = noiseGen[n];
		//gen.scalar *= 2 ;
		gen.dirty = true;
		if( n == 0 ) {
			gen.oy = 0.02 * config.base;//(1+Math.sin( config.base ));
			gen.ox = 0.08 * config.base;//(1+Math.sin( config.base ));
		}
			
		if( n == 1 )
			gen.oy = 0.2 * (1+Math.sin( config.base ));
		if( n == 2 ) {
			gen.ox = 0.3 * (1+Math.sin( config.base/3 ));
			gen.oy = 0.3 * (1+Math.sin( config.base/5 ));
		}
		if( n == 4 ) {
			gen.ox = -0.05 * (1+Math.sin( config.base/1.6 ));
			gen.oy = -0.02 * (1+Math.sin( config.base/3.221 ));
		}
		
		gen.pitch = config.patchSize / gen.steps;
		gen.dx = gen.dy = 1/(config.patchSize/gen.steps);
		maxtot += gen.scalar;
	}
	gen.maxtot = maxtot;

	for( y = 0; y < config.patchSize; y++ ) {
			// Y will be 0 at the same time this changes...  which will update all anyway
	
		for( var n = 0; n < noiseGen.length; 
			n++ ) {
				var gen = noiseGen[n];
				
				var oy = gen.oy * config.patchSize;// / gen.pitch
				var _y = (y - oy)%config.patchSize;
				if( _y < 0 ) _y += config.patchSize;

				gen.cy = ( _y % gen.pitch ) / gen.pitch;
				while( gen.cy < 0 ) gen.cy += 1;
				//if( n == 0 )
				//console.log( "cy is: ", n, y, gen.oy, oy, _y, gen.cy );
			}

		for( var x = 0; x < config.patchSize; x++ ) {

			for( var n = 0; n < noiseGen.length; 
					n++ ) {
				var gen = noiseGen[n];
				var offset = 0;//config.base % 16;

				var ox = gen.ox * config.patchSize;// / gen.pitch
				var _x = (x - ox)%config.patchSize;
				if( _x < 0 ) _x += config.patchSize;
	
				gen.cx = ( _x % gen.pitch ) / gen.pitch;
				while( gen.cx < 0 ) gen.cx += 1;

				var oy = gen.oy * config.patchSize;// / gen.pitch
				var _y = (y - oy)%config.patchSize;
				if( _y < 0 ) _y += config.patchSize;

				{
					var nx = (( _x / gen.pitch ) |0)*gen.pitch;
					var ny = (( _y / gen.pitch ) |0)*gen.pitch;
					while( nx < 0 ) nx += config.patchSize;
					while( ny < 0 ) ny += config.patchSize;
					if( ny != gen.ny  ) { 
						gen.dirty = true; 
						//console.log( "using", offset + (ny) * config.patchSize + (nx ),offset + ( (ny) %config.patchSize ) * config.patchSize + (nx) );
					}
					if( nx != gen.nx ) { 
						gen.dirty = true; 
					}
					if( gen.dirty ) {
						//if( n == 0 )
						//	console.log( "switch ", gen.nx, gen.ny, _x, _y )

						gen.dirty = false;
						//if( n < 6 ) offset = 0;
						gen.corn[0] = noise[ offset 
							+ (ny) * config.patchSize 
							+ (nx ) ];
						gen.corn[2] = noise[ offset 
							+ ( (ny+gen.pitch) %config.patchSize ) * config.patchSize 
							+ (nx) ];
						//gen.corn[0] = noise[ offset + (gen.pitch * ((_y / gen.pitch)|0)) * config.patchSize + (gen.pitch * ((_x / gen.pitch)|0)) ];
						gen.corn[1] = noise[ offset 
							+ (ny) * config.patchSize 
							+ (nx + gen.pitch)%config.patchSize ];
						//gen.corn[2] = noise[ offset + (gen.pitch * ((((_y+gen.pitch) / gen.pitch)|0)%gen.steps)) * config.patchSize + (gen.pitch * ((_x / gen.pitch)|0)) ];
						gen.corn[3] = noise[ offset 
							+ ( (ny+gen.pitch) %config.patchSize ) * config.patchSize 
							+ (nx + gen.pitch)%config.patchSize ];
						//console.log( "Should be : ", offset, nx, (nx+gen.pitch)%config.patchSize, ny, (ny+gen.pitch)%config.patchSize )
						//if( n == 0 )
						//  console.log( "using", nx, ny, gen.pitch );
							//, offset + (ny) * config.patchSize + (nx )
							//,offset + ( (ny) %config.patchSize ) * config.patchSize + (nx) );

						gen.nx = nx;
						gen.ny = ny;
						
						gen.dx1 = gen.corn[1] - gen.corn[0]; // /1
						gen.dx2 = gen.corn[3] - gen.corn[2]; // /1
					}
				}

			}
	
			var tot = 0;
			for( var n = 0; n < noiseGen.length
				; n++ ) {
				var gen = noiseGen[n];
				// ((((c1)*(max-(d))) + ((c2)*(d)))/max)				
				var tx = (1-Math.cos(gen.cx*Math.PI) )/2;
				var ty =  (1-Math.cos(gen.cy*Math.PI) )/2;
				//console.log( "gen.cx:", tx, ty, "xy:", x, y,  "Genxy:", gen.cx, gen.cy  );
				var value1 = gen.dx1 * tx + gen.corn[0];
				var value2 = gen.dx2 * tx + gen.corn[2];
				var dy = value2 - value1; // /1
				var value = value1 + ty * dy;
				tot += (value * gen.scalar) / maxtot;
			}
			if( maxVal < tot ) maxVal = tot;
			if( minVal > tot ) minVal = tot;
			outNoise.push( tot );

		}
	}
	//console.log( "Crunched Random in:", Date.now() - start, minVal, maxVal );
	start = Date.now();	
	for( var n = 0; n < outNoise.length; n++ ) {
		//outNoise[n] = ( ( outNoise[n] ) - minVal ) / ( maxVal-minVal);
	}
	//console.log( "corrrected Random in:", Date.now() - start );
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
			var here = config.gen_noise[ h * config.patchSize + w ];
/*
			var here2 = config.gen_noise[ h * config.patchSize + (w+1)%_output.width ];
			here3 = ( here2 M:\javascript\a-star\perlin-toy.js- here ) * 10 ;
			here2 = config.gen_noise[ ((h+1)%_output.height) * config.patchSize + (w+1)%_output.width ];
			here3 += ( here2 - here ) * 10 ;
			here2 = config.gen_noise[ h * config.patchSize + (w-1)%_output.width ];
			here3 = ( here2 - here ) * 10 ;
			here2 = config.gen_noise[ ((h-1)%_output.height) * config.patchSize + (w+1)%_output.width ];
			here3 += ( here2 - here ) * 10 ;
			here = here3;			
*/
if (true) {
			if( here <= 0.01 )
				plot( w, h, ColorAverage( BASE_COLOR_WHITE,
												 BASE_COLOR_BLACK, (here)/(0.01) * 1000, 1000 ) );
			else if( here <= 0.25 )
				plot( w, h, ColorAverage( BASE_COLOR_BLACK,
												 BASE_COLOR_LIGHTBLUE, (here-0.01)/(0.25-0.01) * 1000, 1000 ) );
			else if( here <= 0.5 )
				plot( w, h, ColorAverage( BASE_COLOR_LIGHTBLUE,
												 BASE_COLOR_LIGHTGREEN, (here-0.25)/(0.5-0.25) * 1000, 1000 ) );
			else if( here <= 0.75 )
				plot( w, h, ColorAverage( BASE_COLOR_LIGHTGREEN,
												 BASE_COLOR_LIGHTRED, (here-0.5)/(0.75-0.5) * 1000, 1000 ) );
			else if( here <= 0.99 )
				plot( w, h, ColorAverage( BASE_COLOR_LIGHTRED,
												 BASE_COLOR_WHITE, (here-0.75)/(0.99-0.75) * 1000, 1000 ) );
			else //if( here <= 4.0 / 4 )
				plot( w, h, ColorAverage( BASE_COLOR_WHITE,
												 BASE_COLOR_BLACK, (here-0.99)/(1.0-0.99) * 10000, 10000 ) );
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

var __clearTick = 0;
function drawAStar( config, path, minpath, minH, maxH ) {
	maxH -= minH;
	if( __clearTick++ > 400 )  {
		config.ctx2.clearRect( 0, 0, config.patchSize, config.patchSize );
		__clearTick = 0;
	}
	//config.ctx2.fillStyle = "white";
	path.forEach( node => {
		var z = `#${ ( (255*(node.h-minH)/maxH)|0 ).toString(16)}${ ( (255*(node.h-minH)/maxH)|0 ).toString(16)}${ ( (255*(node.h-minH)/maxH)|0 ).toString(16)}`;
		config.ctx2.fillStyle = z;
		//console.log( "fill:", ( (255*(node.h-minH)/maxH)|0 ).toString(16) );
		node = node.node;
		config.ctx2.fillRect( node.x, node.y, 1, 1 );
	} );
	config.ctx2.fillStyle = "blue";
	if( minpath )
	minpath.forEach( node => {
		node = node.node;
		config.ctx2.fillRect( node.x, node.y, 1, 1 );
	} );
}

function doAStar( nodes, came_from, targetNode, from,  to )
{
	function dist( a, b ) {
		var x = {};
		sub2( x, a, b );
		return len(x);
	}
	function h1( here ) {
		//return dist( here, to ) * maxH;//( ( minH + maxH ) / 2);
		return dist( here, to ) * maxH/2;//18;// *( ( minH + maxH ) / 2);
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
				var c;
				for( c = this.first; c && ( c.node.x != n.x || c.node.y != n.y); c = c.next );
				return c;
			}
		};
//debugger;
	openSet.add( from, 0, 0 );
	var check;
	var longest = [];
	function min(a,b,c) {
		var r;
		longest.push( r= { dist: a, len : b, node : c } );
		return r;
	}
	var minPath = min(Infinity,Infinity,null);
	var finalNode = null;
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
		return here * 3;
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
			//here - fromHere 
			//var here = (here) * (here);
			//var resistence = _here;//( 10 + (here - fromValue ) );
			var resistence = 50*(_here - fromValue + fix);
			resistence *= 5;
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
				if( newg < find.g ) {
					find.f = ( newg + h1( neighbor ) )
					find.g = newg;
					find.h = newdelg
					if( find.prior ) {
						find.prior.next = find.next;  // unlink this
						openSet.link( node ); // relink into list
					}
					//console.log( "node:", node.g, newdelg );
					find.parent = check;
					//_node = node;
				}
				
				 return;
			}
			//var resistence = Math.abs( here - fromValue );
			//if( newg > minPath.len ) return;
				
			if( find = openSet.find( neighbor ) ) {
				node = find.node;
				if( newg < find.node.g ) {
					node.f = ( newg + h1( neighbor ) )
					node.g = newg;
					node.h = newdelg
					if( find.prior ) {
						find.prior.next = node.next;  // unlink this
						openSet.link( node ); // relink into list
					} else {
						// it was already the first, and it's closer this way, so.... 
						// and sorted by distance
					}
					//console.log( "node:", node.g, newdelg );
					node.parent = check;
					_node = node;
				}
			} else {
				node = openSet.add( neighbor, newg, newdelg );
				//	console.log( "node:", node.g, newdelg );
				node.parent = check;
				_node = node;
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
		else {
			if( __openSet ) {
				__openSet = openSet;
				openSet = makeOpenSet();
				check = openSet.pop(); 
			}
			else
				check = openSet.pop(); 
		}
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

