

const setup = require( "./three.setup.js" );
const web = require( './webcore.js' );

//--------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------
// BEGIN TEST PROGRAM STUB
//--------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------


var test = {
	 web : web.web,
	 scale : 0,
     origin : {x:0,y:0,z:0},
	 control : null,
     nodes:[],
	 tester:null,
	file:null,
	x:0, y:0,
	 root:0,
	 pRoot:null,
	 paint:0,
	space:null,
	pointMesh : null,
	lineMesh : null,
} ;

if(0){
c.onmousedown = (evt)=>{  var rect = c.getBoundingClientRect(); mouse(evt.clientX-rect.left,evt.clientY-rect.top,evt.buttons);} 
c.onmouseup = (evt)=>{ var rect = c.getBoundingClientRect(); mouse(evt.clientX-rect.left,evt.clientY-rect.top,evt.buttons);  }
c.onmousemove = (evt)=>{ var rect = c.getBoundingClientRect(); mouse(evt.clientX-rect.left,evt.clientY-rect.top,evt.buttons); }
}

var _b;
const MK_LBUTTON = 1
function mouse( x, y, b )
{
	if( ( b & MK_LBUTTON ) && !( _b & MK_LBUTTON ) )
	{
		// it's an array in some context, and a pointer in most...
		// the size is the sizeof [nDimensions] but address of that is not PVECTOR
        var v = [x,0,y];
		console.log( ("----------------- NEW NODE -----------------------") );
		//fprintf( test.file, ("%d,%d\n"), x, y );
		//fflush( test.file );
		localStorage.setItem( "Node" + test.nodes.length, JSON.stringify( v ) );
		test.nodes.push( test.web.insert( v, 0 ) );
		//SmudgeCommon( pc );
        doDraw();
	}
	if( ( test.x != x ) || ( test.y != y ) )
	{
		//console.log( ("...") );
		test.x = x;
		test.y = y;
		//SmudgeCommon( pc );
        doDraw();
	}
	_b = b;
	return 1;
}


function  drawdata() {return {
	 icon : null,
     path : [],
	 pathway : [],
	 checked : [],
	 prior : null,
	 step : 0,
	 paint : 0,
}};


const BASE_COLOR_RED=[127,0,0];
const BASE_COLOR_GREEN=[0,127,0];
const BASE_COLOR_YELLOW=[255,255,0];
const BASE_COLOR_MAGENTA=[255,0,255];
const vRight = 'x';
const vUp = 'y';
const vForward = 'z';
var had_lines = 0;

function ColorAverage( a, b, i,m) {

    var c = [ (((b[0]-a[0])*i/m) + a[0])|0,
        (((b[1]-a[1])*i/m) + a[1])|0,
        (((b[2]-a[2])*i/m) + a[2])|0
             ]
    //console.log( "color: ", a, b, c, i, ((b[1]-a[1])*i/m)|0, a[1], ((b[1]-a[1])*i/m) + a[1] )
    return `#${(c[0]<16?"0":"")+c[0].toString(16)}${(c[1]<16?"0":"")+c[1].toString(16)}${(c[2]<16?"0":"")+c[2].toString(16)}`
}

var n = [0,0,0,0];
function drawData( node, data, v )
{
	var c, c2;

	if( !node.mesh ) {
		node.mesh = test.pointMesh.clone();
		node.mesh.position.set( node.point[vRight], node.point[vUp], node.point[vForward] );
	}
	test.space.scene.add( node.mesh );

	if( !node.flags.bLinked )
		return 0;

	if( data ) {
		c = ColorAverage( BASE_COLOR_RED, BASE_COLOR_YELLOW, data.step, 32 );
		c2 = ColorAverage( BASE_COLOR_GREEN, BASE_COLOR_MAGENTA, data.step, 32 );
		data.step++;
		if( data.step > 32 )
			data.step = 0;
	}

	{
		var lines = 0;
		var idx;
		var dest;
		var link;
		//console.log( "--- Draw from node ", NodeIndex( node ) );
		node.links.forEach( (link)=>{
			n[0]++;
			if( !link ) return;
				lines++;

			if( link.data.paint == data.paint ) {
				// already painted
				return;
			}
			//console.log( "links")
			link.data.paint = data.paint;

			if( !link.lineMesh ) {
				link.lineMesh = test.lineMesh.clone();
				link.data.lineMesh = link.lineMesh;
				
			}
				var dest = (link.invert?link.data.from:link.data.to).node;
			
				link.lineMesh.position.set( ( node.point[vRight] + dest.point[vRight] ) / 2
					, ( node.point[vUp] + dest.point[vUp] ) / 2
					, ( node.point[vForward] + dest.point[vForward] ) / 2
				);
				var a = ( node.point[vRight] - dest.point[vRight] );
				var b = ( node.point[vUp] - dest.point[vUp] );
				var c = ( node.point[vForward] - dest.point[vForward] );
				link.lineMesh.scale.set( 1, 1, Math.sqrt( (a*a)+(b*b)+(c*c) ) / meterScalar - 10*meterScalar );
				link.lineMesh.lookAt( new THREE.Vector3( dest.point[vRight]
						, dest.point[vUp]
						, dest.point[vForward]
					) 
				);
			
			test.space.scene.add( link.lineMesh );
		} );

		
		if( !lines )
		{
			//console.log( ("a point has no lines from it!") );
			if( had_lines ) {
			//	DebugBreak();
            		}
		}
		else
			had_lines = 1;
	}
	//console.log( "drew:", n );

	if( data.prior )
	{
		//do_line( data.surface, data.prior.point[vRight], data.prior.point[vForward]
		//     , node.point[vRight], node.point[vForward], BASE_COLOR_WHITE );
	}
	data.prior = node;

	return 0; // don't end scan.... foreach can be used for searching too.
}



function doDraw( )
{
	//ClearImageTo( surface, SetAlpha( BASE_COLOR_BLUE, 32 ) );
	if( test.web )
	{
		// for each node in web, draw it.
	while(test.space.scene.children.length > 0){ test.space.scene.remove(test.space.scene.children[0]); }
		data = drawdata();
		data.step = 0;
		data.prior = null;
		data.paint = ++test.paint;
		data.path = [];
		data.pathway = [];
		data.bounds = [];
		data.checked = [];
		console.log( "something..." );

		if( !test.pRoot )
			test.pRoot = test.web.nodes[test.root];
		{
			var v = [test.x,0,test.y];
			if( test.web.root ) {
				console.log( "begin finding..." );
				web.FindNearest( data.path, data.pathway, data.bounds, data.checked
							, test.pRoot
							, v, 0 );
				console.log( "end finding..." );
			}
			//console.log( ("Draw.") );
		}

		console.log( "------------- drawing a set of points -----------------");
		n = [0,0,0,0];

		test.web.nodes.forEach( (node)=>{
			drawData( node, data, v );
			
		})
	}
}

//document.body.onkeypress =
var update_pause = true;
document.body.onkeydown = (key )=>
{
	if( key.code == "KeyM" )
		update_pause = !update_pause;

	if( key.code == "KeyI" )
	{
		var v = [];
		v[vRight] = (Math.random()*2);
		v[vForward] = (Math.random()*2);
		v[vUp] = (Math.random()*2);// (Math.random()*13)-6;
		//node.point = add( v, node.point );
		test.nodes.push( test.web.insert( v, 0 ) );
		localStorage.setItem( "Node" + test.nodes.length, JSON.stringify( v ) );
		doDraw();
	}

	if( key.code == "KeyN" )
	{
		test.root++;
		test.pRoot = test.web.nodes[test.root];
		if( !test.pRoot )
		{
			test.root = 0;
			test.pRoot = test.web.nodes[test.root];
		}
		doDraw();
	}
	return 0;
}

var cycle = 0;
function MoveWeb( )
{
	var node;
	var v = [0,0,0];
	var idx;
	if( update_pause ) {
		setTimeout( MoveWeb, 250 )
		return;
	}
	//return;
	/*
	update_pause -= 50;
	if( update_pause < 0 )
		update_pause = 0;
	if( update_pause > 0 )
		return;
*/
	// 500 has some issues.
	//	if( cycle >= 500 )
	//if( cycle > 300 )
//		update_pause = 150000;
	//else
	//   update_pause = 1000;
	cycle++;
	console.log( ("cycle %d"), cycle );
	var tick = Date.now();
	test.nodes.forEach( (node,idx)=>{
		v[vRight] = ( (Math.random()*13)-6.5 ) * 0.1 *meterScalar;
		v[vForward] = ( (Math.random()*13)-6.5 ) * 0.1 *meterScalar;
		v[vUp] = ( (Math.random()*13)-6.5 ) * 0.1 * meterScalar;
		node.point = web.add( v, node.point );
		localStorage.setItem( "Node" + idx, JSON.stringify( node.point ) );
	} );
	var tick2 = Date.now();
	console.log( "took some time to move all those.... ", tick2-tick, " per-node", (tick2 - tick)/test.nodes.length );
	tick = tick2;
	test.nodes.forEach( (node,idx)=>{
		node.move( node.point );
		node.mesh.position.set( node.point[vRight], node.point[vUp], node.point[vForward] );
	})
	var tick2 = Date.now();
	console.log( "took some time to link all those.... ", test.nodes.length, " in ", tick2-tick, " per-node=", (tick2 - tick)/test.nodes.length );
    	doDraw();
	setTimeout( MoveWeb, 250 )
}


setTimeout( MoveWeb, 250 )

function Shape(name) {
	return {
		verts: [], norms:[], pairs:[], faces:[],
		size : { width:0, height:0, depth:consts.peice_depth },
		label: { pos:new THREE.Vector3(), size:{ width:0, height:0 } },
		resize : null,
		scaledVert(n,scale) { return this.verts[n]; }
	};
}
      


function createMesh( geometry, color ) {
	//MeshStandardMaterial
	// MeshBasicMaterial
       	let defaultMaterial = new THREE.MeshStandardMaterial( { color: color, roughness:0.17, metalness:0.24, side : THREE.DoubleSide  } );
	var mesh = new THREE.Mesh( geometry, defaultMaterial );
	return mesh;
}

const meterScalar = 0.02;//0.02;
const pointShape = {
verts : [ { x:-0.5        , y:0.5, z:0 }, { x:0.5, y:0.5, z:0 }
	, { x:-0.5        , y:-0.5, z:0 }, { x:0.5, y:-0.5, z:0 }
	, { x:-0.5        , z:0.5, y:0 }, { x:0.5, z:0.5, y:0 }
	, { x:-0.5        , z:-0.5, y:0 }, { x:0.5, z:-0.5, y:0 }
	, { z:-0.5        , y:0.5, x:0 }, { z:0.5, y:0.5, x:0 }
	, { z:-0.5        , y:-0.5, x:0 }, { z:0.5, y:-0.5, x:0 }
        ],
norms : [ { x:0, y : 0, z: 1 }
	, { x:0, y : 1, z: 0 }
	, { x:1, y : 0, z: 0 }
        ],
pairs : [ [0,0], [1,0]
	, [2,0], [3,0]
	, [4,1], [5,1]
	, [6,1], [7,1]
	, [8,2], [9,2]
	, [10,2], [11,2]
        ],
faces : [ [ 0, 2,1 ], [2, 3, 1] 
	, [ 4, 6,5 ], [6, 7, 5] 
	, [ 8, 10,9 ], [10, 11, 9] 
	],
        scaledVert(n,scale) { return this.verts[n]; }

};


const lineShape = {
verts : [ { z:-0.5        , y:0.25, x:0 }, { z:0.5, y:0.25, x:0 }
	, { z:-0.5        , y:-0.25, x:0 }, { z:0.5, y:-0.25, x:0 }
	, { z:-0.5        , x:0.25, y:0 }, { z:0.5, x:0.25, y:0 }
	, { z:-0.5        , x:-0.25, y:0 }, { z:0.5, x:-0.25, y:0 }
        ],
norms : [ { x:0, y : 0, z: 1 }
	, { x:0, y : 1, z: 0 }
        ],
pairs : [ [0,0], [1,0]
	, [2,0], [3,0]
	, [4,1], [5,1]
	, [6,1], [7,1]
        ],
faces : [ [ 0, 2,1 ], [2, 3, 1] 
	, [ 4, 6,5 ], [6, 7, 5] 
	],
        scaledVert(n,scale) { return this.verts[n]; }

};


function createGeometry( shape, color ) {

	//var materialIndex = 0; //optional

	var geometry = new THREE.Geometry();

	var n;
	for( n = 0; n < shape.verts.length; n++ ) {
		geometry.vertices.push( 
			new THREE.Vector3().copy( { x : shape.verts[n].x * meterScalar
				, y : shape.verts[n].y * meterScalar 
				, z : shape.verts[n].z * meterScalar } )  
		);
	}

	//create a new face using vertices 0, 1, 2
	var pairs = shape.pairs;
	for( n = 0; n < shape.faces.length; n++ ) {
		var faces = shape.faces[n];
		//console.log( "face:" + face );		
		var face = new THREE.Face3( pairs[faces[0]][0], pairs[faces[1]][0], pairs[faces[2]][0]
				, [new THREE.Vector3().copy( shape.norms[pairs[faces[0]][1]] )
				, new THREE.Vector3().copy( shape.norms[pairs[faces[1]][1]] )
				, new THREE.Vector3().copy( shape.norms[pairs[faces[2]][1]] )
				 ], color );
		geometry.faces.push( face );
	}

	geometry.computeBoundingSphere();
	geometry.shape = shape;
	return geometry;
}


function initShapes() {
	
	var geometry = createGeometry( pointShape, new THREE.Color( 0xaa0000 ) ); //optional
	test.pointMesh = createMesh( geometry, 0xaa0000 ); //optional

	var geometry = createGeometry( lineShape, new THREE.Color( 0x009999 ) ); //optional
	test.lineMesh = createMesh( geometry, 0x009999 ); //optional

}

function windowLoaded()
{	
	localStorage.clear();
	initShapes();
	test.web = web.Web();

	test.space = setup( (navigator.getVRDisplays !== undefined) ); 
	test.space.camera.matrix.rotateRelative( 0, - Math.PI*3/4, Math.PI/2  );

	var n;
	var start;
	for( n = 0; ; n++ ) {
		var node = localStorage.getItem( "Node"+n );
		if( !node ) break;
		test.nodes.push( test.web.insert( JSON.parse( node ), 0  ) );
	}
	doDraw();

}


