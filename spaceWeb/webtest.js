
//import THREE from "../three.js/three.js/build/three.js";
import {NodeIndex,Web,FindNearest} from "./webcore.js";
const Vector = Web.Vector;

const DEBUG_ALL=false;
//<SCRIPT src="../three.js/three.js/build/three.js"></script>
//<SCRIPT src="webcore.js"></script>


var c = document.getElementById( "testSurface");
var ctx = c.getContext("2d");

//--------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------
// BEGIN TEST PROGRAM STUB
//--------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------

let update_pause  = true;
const BASE_COLOR_RED=[127,0,0];
const BASE_COLOR_GREEN=[0,127,0];
const BASE_COLOR_YELLOW=[255,255,0];
const BASE_COLOR_MAGENTA=[255,0,255];
const vRight = 'x';
const vUp = 'y';
const vForward = 'z';
var had_lines = 0;

var test = {
	 web : null,
	 scale : 0,
     origin : new Vector(),
	 control : null,
     nodes:[],
	 tester:null,
	file:null,
	x:0, y:0,
	 root:0,
	 pRoot:null,
	 paint:0,
	 findData : null,
	 cycle : 0,
	} ;

var resetButton = document.getElementById( "clearStorage");
if( resetButton )
	resetButton.addEventListener( "click", ()=>{
		localStorage.clear();
		location.href = location.href;
	})


c.onmousedown = (evt)=>{  var rect = c.getBoundingClientRect(); mouse(evt.clientX-rect.left,evt.clientY-rect.top,evt.buttons);} 
c.onmouseup = (evt)=>{ var rect = c.getBoundingClientRect(); mouse(evt.clientX-rect.left,evt.clientY-rect.top,evt.buttons);  }
c.onmousemove = (evt)=>{ var rect = c.getBoundingClientRect(); mouse(evt.clientX-rect.left,evt.clientY-rect.top,evt.buttons); }

var _b;
const MK_LBUTTON = 1
function mouse( x, y, b )
{
	if( ( b & MK_LBUTTON ) && !( _b & MK_LBUTTON ) )
	{
		// it's an array in some context, and a pointer in most...
		// the size is the sizeof [nDimensions] but address of that is not PVECTOR
	        var v = new Vector().set(x,0,y);

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

function DrawLine(  a, b, c )
{
    ctx.strokeStyle = c;
	ctx.beginPath();
    ctx.moveTo(a.x,a.z);
    ctx.lineTo(b.x,b.z);
    ctx.stroke();
	//console.trace( "did line.");
}


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

	{
		var c = 0;
		c = node.countNear();

		ctx.font = "12px Comic Sans MS";
		ctx.fillStyle = "white";
		//ctx.textAlign = "center";
		//console.log( "output a point?")
		ctx.fillText(`${node.paint}[${NodeIndex(node)}]`,node.point.x,node.point.z) ;
	}
	ctx.fillStyle = "green";
	ctx.fillRect(node.point[vRight], node.point[vForward], 1, 1 );

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
		ctx.lineWidth = 3;


		node.links.forEach( (link)=>{
			n[0]++;
			if( !link ) return;
				lines++;

			if( link.data.paint == data.paint ) {
				// already painted
				return;
			}

			var o = new Vector().addscaled( link.data.plane.o, link.data.plane.t.x, 0.1 );

			var oo = new Vector().addscaled( link.data.plane.o, link.data.plane.t, 0.5 );
			DrawLine( oo, o, "#000000" );

			var o = new Vector().addscaled( link.data.plane.o,  link.data.plane.t , link.data.plane.ends.to );
			var oo = new Vector().addscaled( link.data.plane.o,  link.data.plane.t, link.data.plane.ends.from );

			DrawLine( oo, o, "#FFFFFF" );


			//console.log( "links")
			link.data.paint = data.paint;
			dest = (link.invert?link.data.from:link.data.to).node;
			//console.log( ("a near node!"), NodeIndex( dest ), c, c2 );
			if ( DEBUG_ALL )
			        console.log( ("a near node! %d %d %d %d")
					     ,node.point[vRight], node.point[vForward]
					    , dest.point[vRight], dest.point[ vForward ] );
        
			/*
			var a = [0,0,0];
			var b = [0,0,0];
			addscaled( a, link.data.plane.o, link.data.plane.t, link.data.plane.ends[0] )
			addscaled( b, link.data.plane.o, link.data.plane.t, link.data.plane.ends[1] )
			DrawLine( a, b, c );
			*/

			DrawLine( node.point, dest.point, c );
		
			// draw the perpendicular lines at caps ( 2d perp only)
			{
				var m = new Vector();
				var tmp;
				var p1=new Vector(), p2=new Vector();
				// get the slop...
				m.sub( node.point, dest.point );
				// inverse it (sorta)
				m[vRight] = -m[vRight];
				// and swap x/y
				tmp = m[vForward];
				m[vForward] = m[vRight];
				m[vRight] = tmp;
				ctx.lineWidth = 1;
				p1.addscaled( node.point, m, 0.125 );
				p2.addscaled( node.point, m, -0.125 );
				DrawLine( p1, p2, c2  );
				p1.addscaled( dest.point, m, 0.125 );
				p2.addscaled( dest.point, m, -0.125 );
				DrawLine( p1, p2, c2  );
			}

			// perpendicular line at these points?

		})
		//console.log( "found path:", data.path )

		// these are the possible nearest nodes found.
		if( data )
		data.path.forEach( (is_path)=>{
			n[1]++;

			var p1 = new Vector(), p2 = new Vector();
			p1 = new Vector().set( is_path.point );
			const AAA = 8;
			p1[vRight] -= AAA;
			p1[vForward] -= AAA;
			p2.set( p1 );
			p2[vRight] += AAA;
			p2[vForward] += AAA;
			//console.log( p1, p2 )
			DrawLine( p1, p2, "white" );
			var x = p1[vRight];
			p1[vRight] = p2[vRight];
			p2[vRight] = x;
			DrawLine( p1, p2, "white" );
			var x = p1[vRight];
			p1[vRight] = p2[vRight];
			p2[vRight] = x;

			ctx.lineWidth = 1;
			DrawLine( v, is_path.point, "green" ); 
		})

		if( data )
		{

			var first = true;
			data.pathway.forEach( (is_path)=>{
                                n[2]++;
				var p1, p2;
				p1.set( is_path.point );
				p1[vRight] -= 9;
				p1[vForward] -= 10;
				p2.set( p1 );
				p2[vRight] += 9;
				p2[vForward] += 10;
				//console.log( ("path %d,%d"), is_path.point[vRight], is_path.point[vForward] );
	        
	                        DrawLine( p1, p2, first?"magenta":"cyan" );
        		        var x = p1[vRight];
                        	p1[vRight] = p2[vRight];
	                        p2[vRight] = x;
        		        DrawLine( p1, p2, first?"magenta":"cyan" );
                        	var x = p1[vRight];
	                        p1[vRight] = p2[vRight];
        		        p2[vRight] = x;
				first = false;
	        
			})

		}
		if( data )
		{
			data.bounds.forEach( (bound)=>{
				n[3]++;
				var p1, p2;
				p1 .set( bound.node.point );
				p1[vRight] -= 3;
				p1[vForward] -= 4;
				p2.set( (bound.invert?bound.data.from:bound.data.to).node.point );
				p2[vRight] += 3;
				p2[vForward] += 4;
				//console.log( ("path %d,%d"), is_path.point[vRight], is_path.point[vForward] );
		        
				ctx.lineWidth = 1;
				DrawLine( p1, p2, "#4cd2ff" );
				
			})
		}
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
    ctx.fillStyle = "#404080"
    ctx.fillRect( 0, 0, 1000, 1000 );
	//ClearImageTo( surface, SetAlpha( BASE_COLOR_BLUE, 32 ) );
	if( test.web )
	{
		// for each node in web, draw it.
		var data = drawdata();
		data.step = 0;
		data.prior = null;
		data.paint = ++test.paint;
		data.path = [];
		data.pathway = [];
		data.bounds = [];
		data.checked = [];
		//console.log( "something..." );
		      //if(0)
		test.web.extents.forEach( ext=>{
				var p1 = new Vector(), p2 = new Vector();
				p1.set( ext.point );
				p2.set( ext.point );
				p1[vRight] -= 9;
				p1[vForward] -= 9;
				p2[vRight] += 9;
				p2[vForward] -= 9;
				//console.log( ("path %d,%d"), is_path.point[vRight], is_path.point[vForward] );
	        
	                        DrawLine( p1, p2, "lightblue" );
				//p1[vRight] += 9;
				p1[vForward] += 18;
				//p2[vRight] += 9;
				p2[vForward] += 18;
				//console.log( ("path %d,%d"), is_path.point[vRight], is_path.point[vForward] );
	        
	                        DrawLine( p1, p2, "lightblue" );
				//p1[vRight] -= 9;
				p1[vForward] -= 18;
				p2[vRight] -= 18;
				//p2[vForward] += 10;
				//console.log( ("path %d,%d"), is_path.point[vRight], is_path.point[vForward] );
	        
	                        DrawLine( p1, p2, "lightblue" );
				p1[vRight] += 18;
				//p1[vForward] -= 10;
				p2[vRight] += 18;
				//p2[vForward] += 10;
				//console.log( ("path %d,%d"), is_path.point[vRight], is_path.point[vForward] );
	        
	                        DrawLine( p1, p2, "lightblue" );

		} );


		[test.pRoot].forEach( ext=>{     if( !ext ) return;
				var p1 = new Vector(), p2 = new Vector();
				const R=11;
				p1.set( ext.point );
				p2.set( ext.point );
				p1[vRight] -= R;
				p1[vForward] -= R;
				p2[vRight] += R;
				p2[vForward] -= R;
				//console.log( ("path %d,%d"), is_path.point[vRight], is_path.point[vForward] );
	        
	                        DrawLine( p1, p2, "#E44" );
				//p1[vRight] += R;
				p1[vForward] += 2*R;
				//p2[vRight] += R;
				p2[vForward] += 2*R;
				//console.log( ("path %d,%d"), is_path.point[vRight], is_path.point[vForward] );
	        
	                        DrawLine( p1, p2, "#E44" );
				//p1[vRight] -= R;
				p1[vForward] -= 2*R;
				p2[vRight] -= 2*R;
				//p2[vForward] += 10;
				//console.log( ("path %d,%d"), is_path.point[vRight], is_path.point[vForward] );
	        
	                        DrawLine( p1, p2, "#E44" );
				p1[vRight] += 2*R;
				//p1[vForward] -= 10;
				p2[vRight] += 2*R;
				//p2[vForward] += 10;
				//console.log( ("path %d,%d"), is_path.point[vRight], is_path.point[vForward] );
	        
	                        DrawLine( p1, p2, "#E44" );

		} );


		if( !test.pRoot ) 
			test.pRoot = test.web.nodes[test.root];



		if( test.web.root ) {
			{
				var v = new Vector().set(test.x,0,test.y);
				//console.log( "begin finding..." );
				FindNearest( data.path, data.pathway, data.bounds, null /*data.checked*/
							, test.web.extents
							, v, 0 );
				//console.log( "end finding..." );
			}
			//console.log( ("Draw.") );
		}

		//console.log( "------------- drawing a set of points -----------------", data );
		n = [0,0,0,0];

		test.findData = data;
		//drawData( test.pRoot, data, v );

		test.web.nodes.forEach( (node)=>{
			drawData( node, data, v );
			
		})
	}
}

//document.body.onkeypress =
document.body.onkeydown = (key )=>
{
	if( key.code == "Space" )
		update_pause = !update_pause;

	if( key.code == "KeyA" )
	{
		var v = [];
		v[vRight] = (Math.random()*c.width);
		v[vForward] = (Math.random()*c.height);
		v[vUp] = 0;// (Math.random()*13)-6;
		//node.point = add( v, node.point );
		test.nodes.push( test.web.insert( v, 0 ) );
		localStorage.setItem( "Node" + test.nodes.length, JSON.stringify( v ) );
		doDraw();
	}

	if( key.code == "KeyS" )
	{
		if( test.findData )
			test.pRoot = test.findData.path[0];
		test.root = test.web.nodes.find( node=>node==test.pRoot );
		test.root++;
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

function MoveWeb( )
{
	var node;
	var v = new Vector();
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
	test.cycle++;
	//console.log( ("cycle %d"), test.cycle );
	var tick = Date.now();
	test.nodes.forEach( (node,idx)=>{
		//if( idx %10 == 0 )
		{
			v[vRight] = (Math.random()*13)-6.5;
			v[vForward] = (Math.random()*13)-6.5;
			v[vUp] = 0;// (Math.random()*13)-6;
			node.point.add( v, node.point );
			localStorage.setItem( "Node" + idx, JSON.stringify( node.point ) );
		}
	} );
	var tick2 = Date.now();
	console.log( "took some time to move all those.... ", tick2-tick, " per-node", (tick2 - tick)/test.nodes.length );
	tick = tick2;
    test.nodes.forEach( (node,idx)=>{
		//if( idx %10 == 0 )
		{
			//console.log( "move ...", v )
			node.move( node.point );
		}
		//break;
    })
	var tick2 = Date.now();
	console.log( "took some time to link all those.... ", tick2-tick, " per-node", (tick2 - tick)/test.nodes.length );
    doDraw();
	setTimeout( MoveWeb, 250 )
}

function animate() {

}

function loadOneNode(n) {
	var node = localStorage.getItem( "Node"+n );
		if( !node ) { doDraw(); return; }
		let start = Date.now();
		console.log( "adding ", n );
		test.nodes.push( test.web.insert( JSON.parse( node ), 0  ) );
		console.log( "added ", n, Date.now() - start );
		//setTimeout( ()=>{loadOneNode(n+1)}, 1000 );
		return loadOneNode(n+1);
	doDraw();
}


function main()
{
	test.web = Web();

	loadOneNode( 0 );
	setTimeout( MoveWeb, 250 )
}

main();

