
var config = {
	patchSize : 512,
	seed_noise : null,
	gen_noise : null,
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
const BASE_COLOR_RED = [127,0,0,255];
const BASE_COLOR_LIGHTBLUE = [0,0,255,255];
const BASE_COLOR_LIGHTRED = [255,0,0,255];
const BASE_COLOR_LIGHTGREEN = [0,255,0,255];


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

function genData( config ) {
	var noise = config.seed_noise;
	var outNoise = [];
	var noiseGen = [
		//{ steps : 2, scalar : 0.5, corn: [0,0,0,0], dx : 0, dy : 0, cx : 0, cy : 0 },
		{ steps : 4, scalar : 0.25, corn: [0,0,0,0], dx : 0, dy : 0, cx : 0, cy : 0 },
		{ steps : 8, scalar : 0.125, corn: [0,0,0,0], dx : 0, dy : 0, cx : 0, cy : 0 },
		{ steps : 16, scalar : 0.0625, corn: [0,0,0,0], dx : 0, dy : 0, cx : 0, cy : 0 },
		{ steps : 32, scalar : 0.03125, corn: [0,0,0,0], dx : 0, dy : 0, cx : 0, cy : 0 },
		{ steps : 64, scalar : 0.015625, corn: [0,0,0,0], dx : 0, dy : 0, cx : 0, cy : 0 },
	];
	

	var maxtot = 0;
	var minVal = Infinity;
	var maxVal = 0;
	for( var n = 0; n < noiseGen.length; n++ ) {
		var gen = noiseGen[n];
		gen.scalar *= 2 ;
		gen.dirty = true;
		gen.pitch = config.patchSize / gen.steps;
		gen.dx = gen.dy = 1/(config.patchSize/gen.steps);
		maxtot += gen.scalar;
	}
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
					gen.corn[0] = noise[ (gen.pitch * ((y / gen.pitch)|0)) * config.patchSize + (gen.pitch * ((x / gen.pitch)|0)) ];
					gen.corn[1] = noise[ (gen.pitch * ((y / gen.pitch)|0)) * config.patchSize + (gen.pitch * ((((x+gen.pitch) / gen.pitch)|0)%gen.steps)) ];
					gen.corn[2] = noise[ (gen.pitch * ((((y+gen.pitch) / gen.pitch)|0)%gen.steps)) * config.patchSize + (gen.pitch * ((x / gen.pitch)|0)) ];
					gen.corn[3] = noise[ (gen.pitch * ((((y+gen.pitch) / gen.pitch)|0)%gen.steps)) * config.patchSize + (gen.pitch * ((((x+gen.pitch) / gen.pitch)|0)%gen.steps)) ];

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
			var here = config.gen_noise[ h * config.patchSize + w ];
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
		//config.ctx2.clearRect( 0, 0, config.patchSize, config.patchSize );
		__clearTick = 0;
	}
	config.ctx2.fillStyle = "white";
	path.forEach( node => {
		config.ctx2.fillStyle = `#${ ( (255*(node.h-minH)/maxH)|0 ).toString(16)}${ ( (255*(node.h-minH)/maxH)|0 ).toString(16)}${ ( (255*(node.h-minH)/maxH)|0 ).toString(16)}`;
		node = node.node;
		config.ctx2.fillRect( node.x, node.y, 1, 1 );
	} );
	config.ctx2.fillStyle = "blue";
	//minpath.forEach( node => {
	//	node = node.node;
	//	config.ctx2.fillRect( node.x, node.y, 1, 1 );
	//} );
}

function doAStar( nodes, came_from, targetNode, from,  to )
{
	function dist( a, b ) {
		var x = {};
		sub2( x, a, b );
		return len(x);
	}
	function h1( here ) {
		return dist( here, to ) * maxH;//( ( minH + maxH ) / 2);
	}


	var openSet = {
			first : null,
			length : 0,
			add(n, g, h) {
				var newNode = { 
					node: n, 
					checked : false, 
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
	//var min_dist = Infinity;
	//var min_len = Infinity;
	//var min_node = null;
	var _node;
	var maxH = 0;
	var minH = Infinity;
	//while( check = openSet.pop() ) 
	//	tick( check );
	function scaleHeight(here) {
		return ( (1+here) * 1000 ); 
		if( here > 0.9 ) here = 90 + ( here - 0.9 ) * 10;
		else if( here > 0.75 ) here = 70 + ( here - 0.75 ) * 7;
		else if( here > 0.50 ) here = 50 + ( here - 0.50 ) * 5;
		else if( here > 0.25 ) here = 25 + ( here - 0.25 ) * 5;
		else here = 25 + ( here - 0.25 ) * 2.5;
		return here;
	}
	function aTick( check ) 
	{
		if( !check ) return;
		if( check.node.x === to.x && check.node.y == to.y ) {
			minPath.node = check;
			minPath.dist = 0;
			openSet.first = null;
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
			for( var back = minPath.node; back; back = back.parent ) {
				minpath.push( back );
			}
			drawAStar( config, path, minpath, minH, maxH );
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
			if( closedSet.find( neighbor = {x:testX,y:testY,z:0} ) ) return;
			var here = config.gen_noise[testY*config.patchSize+testX];
			here = scaleHeight(here);
			//here - fromHere 
			//var here = (here) * (here);
			//var resistence = ( 1 + (here - fromValue ) );
			var resistence = Math.abs( here - fromValue );

			//resistence = resistence*(1+here);//*resistence*resistence*resistence;
			var newdelg = dist( check.node, neighbor )
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
					node.parent = check;
					_node = node;
				}
			} else {
				node = openSet.add( neighbor, newg, newdelg );
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
		var check = openSet.pop() ; 
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

