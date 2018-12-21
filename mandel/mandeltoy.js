



//var glow = require( './glow.renderer.js' );

var l = 0;

//var words1 = voxelUniverse.createTextCluster( "Hello World" );

var controlNatural;
var controlOrbit;
var controls;
	var scene;
	var scene2;
	var scene3;
	var camera, renderer;
	var light;
	var geometry, material, mesh = [];
	var frame_target = [];
	var slow_animate = false;
	var frame = 0;

	var tests = [];

var mx = 0;
var my = 0;
var xorg = -0.5 + ( -0.5/16 ) + ( 0.5 / 3200 );
var yorg = 0.5;
var display_scale = 1.0/3200000.0;

var ofsx, ofsy;
var dx, dy;

function Color(r,g,b) { return [r,g,b,255]; }


const BASE_COLOR_WHITE = [255,255,255,255];
const BASE_COLOR_BLACK = [0,0,0,255];
const BASE_COLOR_RED = [127,0,0,255];
const BASE_COLOR_LIGHTBLUE = [0,0,255,255];
const BASE_COLOR_LIGHTRED = [255,0,0,255];
const BASE_COLOR_LIGHTGREEN = [0,255,0,255];
const BASE_COLOR_BLUE = [0,0,127,255];
const BASE_COLOR_GREEN = [0,127,0,255];
const BASE_COLOR_MAGENTA = [127,0,127,255];
const BASE_COLOR_BROWN = [127,92,0,255];


const BASE_COLOR_DARK_BLUE = [0,0,132,255];
const BASE_COLOR_MID_BLUE = [0x2A,0x4F,0xA8,255];
const BASE_COLOR_YELLOW = [255,255,0,255];
const BASE_COLOR_LIGHTCYAN = [0,192,192,255];
const BASE_COLOR_DARK_BLUEGREEN = [0x06, 0x51, 0x42,255];
const BASE_COLOR_DARK_GREEN = [0,93,0,255];
const BASE_COLOR_DARK_BROWN = [0x54,0x33,0x1c,255];  //54331C
const BASE_COLOR_LIGHT_TAN = [0xE2,0xB5,0x71,255];    //E2B571

const BASE_COLOR_ORANGE = [150,128,0,255];



var mandelSurface = document.createElement( "canvas" );
mandelSurface.width = 512;
mandelSurface.height = 512;
mandelSurface.style.width = 512;
mandelSurface.style.height = 512;
var mandelCtx = mandelSurface.getContext( '2d' );
var mandelData = mandelCtx.getImageData(0,0,512,512);

mandelCtx.fillStyle = "red" ;
mandelCtx.fillRect( 0, 0, 50, 50 );

var mandelTexture = new THREE.Texture(mandelSurface);
    var mandelMaterial = new THREE.MeshBasicMaterial({ map: mandelTexture });

//document.body.appendChild( mandelSurface );

var screen = { width:window.innerWidth, height:window.innerHeight };

	//const totalUnit = Math.PI/(2*60);
	//const unit = totalUnit;
	var delay_counter = 60*3;
	//const pause_counter = delay_counter + 120;
	var single_counter = 60;
	var totalUnit = Math.PI/2;
	var unit = totalUnit / single_counter;
	var pause_counter = 120;

	var counter= 0;

	var clock = new THREE.Clock()

function plot( mandelData, x, y, c ) {
	mandelData[((x+(y*512))*4)+0] = c[0];
	mandelData[((x+(y*512))*4)+1] = c[1];
	mandelData[((x+(y*512))*4)+2] = c[2];
	mandelData[((x+(y*512))*4)+3] = c[3];
}

function setMode1(){
}


function setMode2() {
}


function setMode3() {
}

function setControls1() {
	controls.disable();
	camera.matrixAutoUpdate = false;
	controls = controlNatural;
	controls.enable();
}
function setControls2() {
	controls.disable();
	camera.matrixAutoUpdate = false;  // current mode doesn't auto update
	controls = controlOrbit;
	controls.enable();
}


var status_line;
	function init() {
	if( document.getElementById( "controls1") ) {
		document.getElementById( "controls1").onclick = setControls1;
		document.getElementById( "controls2").onclick = setControls2;
	}
		scene = new THREE.Scene();
		scene2 = new THREE.Scene();
		scene3 = new THREE.Scene();


		camera = new THREE.PerspectiveCamera( 90, window.innerWidth / window.innerHeight, 0.001, 10000 );


		camera.matrixAutoUpdate = false;
		camera.position.z = 150;
		camera.matrix.origin.z = 150;
		camera.matrixWorldNeedsUpdate = true;

		camera.matrixAutoUpdate = false;

		 // for phong hello world test....
 		var light = new THREE.PointLight( 0xffFFFF, 1, 10000 );
 		light.position.set( 0, 0, 1000 );
 		scene.add( light );


		 //initVoxelarium();


		renderer = new THREE.WebGLRenderer();
		renderer.setSize( window.innerWidth, window.innerHeight );

		document.body.appendChild( renderer.domElement );

		controlNatural = new THREE.NaturalControls( camera, renderer.domElement );
		controlNatural.enable();

		//controlOrbit = new THREE.OrbitControls( camera, renderer.domElement );
		//controlOrbit.enable();

		controls = controlNatural;



var     geometry = new THREE.BoxGeometry( 200, 200, 200 );
var     mesh = new THREE.Mesh( geometry, mandelMaterial );
    scene.add( mesh );


		//	CubeTest().init( scene );

	}

function slowanim() {
	setTimeout( animate, 256 );
}


function render() {
	renderer.clear();
	
	//DrawInfinite2( mandelData, 0, 0, 

	var ofsx = (512/2);
	var ofsy = (512/2);
	var dx = display_scale*4.0 / 512;
	var dy = display_scale*4.0 / 512;
	{
		var da, db;
		var r, g, bl  = 0;
		var iter;
		var da = ( mx - ofsx ) * dx + xorg;
		var db = ( my - ofsy ) * dy + yorg;
// this is the line for the mouse... need a line object or something for this.
		//iter = GLDrawInfinite2( mandelData, 0, 0, da, db, dx, dy, ofsx, ofsy );
	}

	Render( mandelData.data )

	mandelTexture.needsUpdate = true;
	
	renderer.render( scene, camera );

	//glow.render();
}

var nFrame = 0;
var nTarget = 60;
var nTarget2 = 120;

function animate() {
	var delta = clock.getDelta();

	controls.update(delta);

	render();

		if( slow_animate )
			requestAnimationFrame( slowanim );
		else
			requestAnimationFrame( animate );
}





function IsInfinite2(  _x0,  _y0,  a,  b, result_direction, subN )
{
	var x, x0, y, y0;
	var iteration = 0;
	var  max_iteration = (display_scale < 0.000001 )? 600:(display_scale < 0.001 )? 400:200;
	var xtemp;
	var direction = 1;
	var direction2 = 1;
	var _delta;
	var delta;
	var _y;

	x = _x0;
	y = _y0;
	x0 = a;
	y0 = b;

	while ( x*x + y*y <= (2*2)  &&  iteration < max_iteration )
	{
		subN[0]++;
		xtemp = x*x - y*y + x0;
		_y = y;
		y = 2*x*y + y0;

		delta = (xtemp - x)*(xtemp-x) + (y-_y) * (y-_y);

		if( iteration > 1 )
		{
			if( delta < 0.000000001 ) // dititally too small to see
			{
				direction = -1;
				break;
			}
			if( delta > 250 )
			{
				direction2 = 1;
				break;
			}
		}
		_delta = delta;

		x = xtemp;

		iteration = iteration + 1;
	}

	if( iteration < max_iteration && iteration > _ii2_max_iter )
		_ii2_max_iter = iteration;

	result_direction[0] = direction;
	return direction2 * ( (iteration < max_iteration)
		?(iteration * 255 / max_iteration)
		:-(iteration * 255 / max_iteration) );
}

function DrawInfinite2(  surface,  _x0,  _y0,  a,  b,  da, db,  ofsx,  ofsy )
{
	var x, x0, _y, y, y0;
	var delta, _delta = 0;
	var iteration = 0;
	var  max_iteration = 255;
	var xtemp;

	// setup f(0)
	x = _x0;
	y = _y0;
	x0 = a;
	y0 = b;

	//plot( surface, x/da+ofsx, y/db+ofsy, Color(255-iteration,255-iteration,255-iteration) );
	while ( x*x + y*y <= (2*2*10*10)  &&  iteration < max_iteration )
	{
		xtemp = x*x - y*y + x0;
		_y = y;
		y = 2*x*y + y0;

		delta = (xtemp - x)*(xtemp-x) + (y-_y) * (y-_y);
		if( iteration > 1 )
		{
			if( delta == 0 ) // dititally too small to see
			{
				break;
			}
			if( _delta / delta < 0.01 )
			{
				break;
			}
		}
		_delta = delta;

		x = xtemp;
		iteration = iteration + 1;
	}


	x = _x0;
	y = _y0;
	x0 = a;
	y0 = b;

	// override display scaling
	da = 0.01;
	db = 0.01;

	iteration = 0;
	//plot( surface, x/da+ofsx, y/db+ofsy, Color(255-iteration,255-iteration,255-iteration) );
	while ( x*x + y*y <= (2*2)  &&  iteration < max_iteration )
	{
		xtemp = x*x - y*y + x0;
		_y = y;
		y = 2*x*y + y0;

		delta = (xtemp - x)*(xtemp-x) + (y-_y) * (y-_y);
		if( iteration > 1 )
		{
			if( delta == 0 ) // dititally too small to see
			{
				lprintf( "float underflow" );
				break;
			}

			/*
			lprintf( "delta del [%g,%g] [%g,%g] %g/%g = %g"
				, x, xtemp
				, _y, y 
				, _delta, delta, _delta / delta );
			*/
			if( _delta / delta < 0.01 )
			{
				break;
			}
		}
		_delta = delta;

		do_line( surface, (x-xorg)/da+ofsx, (_y-yorg)/db+ofsy
			, (xtemp-xorg)/da+ofsx, (y-yorg)/db+ofsy, BASE_COLOR_WHITE );
		x = xtemp;

		iteration = iteration + 1;
		switch( iteration & 3 )
		{
		case 0:
			plot( surface, (x-xorg)/da+ofsx, (y-yorg)/db+ofsy,
				Color(255-iteration,255-iteration,0)
			 );
		break;
		case 1:
			plot( surface, (x-xorg)/da+ofsx, (y-yorg)/db+ofsy,
				  Color(255-iteration,0, 255-iteration)
			 );
			break;
		case 2:
			plot( surface, (x-xorg)/da+ofsx, (y-yorg)/db+ofsy,
				  Color(0, 255-iteration,255-iteration)
			 );
			break;
		case 3:
			plot( surface, (x-xorg)/da+ofsx, (y-yorg)/db+ofsy,
			  Color(255-iteration,0,0)
			 );
			break;
		}
	}
	//if( iteration < max_iteration && iteration > _ii1_max_iter )
	//	_ii1_max_iter = iteration;

	if( ii1_max_iter )
		return (iteration < max_iteration)?(iteration * 255 / ii1_max_iter):-1;
	else
		return (iteration < max_iteration)?(iteration * 255 / max_iteration):-1;

        mandelCtx.putImageData(mandelData, 0, 0 );
}

function GLDrawInfinite2( surface, _x0,  _y0,  a,  b,  da,  db,  ofsx, ofsy )
{
	var x, x0, _y, y, y0;
	var delta, _delta = 0;
	var iteration = 0;
	var  max_iteration = 255;
	var xtemp;
	var here = [0,0,0];
	// setup f(0)
	x = _x0;
	y = _y0;
	x0 = a;
	y0 = b;

	//plot( surface, x/da+ofsx, y/db+ofsy, Color(255-iteration,255-iteration,255-iteration) );
	while ( x*x + y*y <= (2*2 * 100 * 100 )  &&  iteration < max_iteration )
	{
		xtemp = x*x - y*y + x0;
		_y = y;
		y = 2*x*y + y0;

		delta = (xtemp - x)*(xtemp-x) + (y-_y) * (y-_y);
		if( iteration > 1 )
		{
			if( delta == 0 ) // dititally too small to see
			{
				break;
			}
			if( _delta / delta < 0.01 )
			{
				break;
			}
		}
		_delta = delta;

		x = xtemp;
		iteration = iteration + 1;
	}


	x = _x0;
	y = _y0;
	x0 = a;
	y0 = b;

	// override display scaling
	da = 0.01;
	db = 0.01;

	iteration = 0;
		glBegin( GL_LINE_STRIP );
		glColor4ub( 255,255,255,255 );
	//plot( surface, x/da+ofsx, y/db+ofsy, Color(255-iteration,255-iteration,255-iteration) );
	while ( x*x + y*y <= (2*2 * 100 * 100)  &&  iteration < max_iteration )
	{
		xtemp = x*x - y*y + x0;
		_y = y;
		y = 2*x*y + y0;

		delta = (xtemp - x)*(xtemp-x) + (y-_y) * (y-_y);
		if( iteration > 100 )
		{
			if( delta == 0 ) // dititally too small to see
			{
				lprintf( "float underflow" );
				break;
			}

			/*
			lprintf( "delta del [%g,%g] [%g,%g] %g/%g = %g"
				, x, xtemp
				, _y, y 
				, _delta, delta, _delta / delta );
			*/
			if( _delta / delta < 0.01 )
			{
				break;
			}
			if( _delta / delta > 2 )
			{
				break;
			}
		}
		_delta = delta;
		here[vRight] = ( (xtemp-xorg)/da+ofsx ) / 10;
		here[vUp] = ( (y-yorg)/db+ofsy ) / 10;
		here[vForward] = iteration * 0.1;

		glVertex3fv( here );

		x = xtemp;

		iteration = iteration + 1;
	}
	glEnd();
	//if( iteration < max_iteration && iteration > _ii1_max_iter )
	//	_ii1_max_iter = iteration;

   if( ii1_max_iter )
		return (iteration < max_iteration)?(iteration * 255 / ii1_max_iter):-1;
	else
		return (iteration < max_iteration)?(iteration * 255 / max_iteration):-1;

}




var caBuf = [0,0,0,0];
function ColorAverage( a, b, i,m) {

    var c = caBuf;
	c[0] = (((b[0]-a[0])*i/m) + a[0])|0
        c[1] = (((b[1]-a[1])*i/m) + a[1])|0
        c[2] = (((b[2]-a[2])*i/m) + a[2])|0
	c[3] = (((b[3]-a[3])*i/m) + a[3])|0
    //console.log( "color: ", a, b, c, i, ((b[1]-a[1])*i/m)|0, a[1], ((b[1]-a[1])*i/m) + a[1] )
    return c;//`#${(c[0]<16?"0":"")+c[0].toString(16)}${(c[1]<16?"0":"")+c[1].toString(16)}${(c[2]<16?"0":"")+c[2].toString(16)}`
}

var drawn = false;

var inout = false;


var renderState = {
	aspect : 1.0,
	ofsx : (512/2),
	ofsy : (512/2),
	dx : display_scale*4.0 / 512,
	dy : display_scale*4.0 / 512,
	a : 0,	
	b : 0,
	nsub : [0],
}



function Render(  output_surface )
{

	if( !drawn )
	{
		drawn = false;
//	ClearImage( output_surface);

   _ii1_max_iter = 0;
   _ii2_max_iter = 0;
   {
		var dam, dbm;
		dam = ( mx - ofsx ) * dx + xorg;
		dbm = ( my - ofsy ) * dy + yorg;

	var n = 0;

	renderState.nsub[0] = 0;	
	while( renderState.a < 512 )
	//for( a = 0; a < 512; a++ )
	{
		//for( b = 0; b < 512; b++ )
		while( renderState.b < 512 )
		{
			var da, db;
			var rda, rdb;
			var r, g = 0, bl  = 0;
			var direction = [0];
			n++;
		
			//rda = ( ( b *2 ) / (RCOORD)output_surface->height) * sin(3.14159/2 + ( ( a * 2*3.14159 ) / (RCOORD)output_surface->width));
			//rdb = ( ( b *2 ) / (RCOORD)output_surface->height) * cos(3.14159/2 + ( ( a * 2*3.14159 ) / (RCOORD)output_surface->width));
			//da = ( rda  ) + xorg;
			//db = ( rdb ) + yorg;

			var da = renderState.aspect * ( renderState.a - renderState.ofsx ) * renderState.dx + xorg;
			var db = ( renderState.b - renderState.ofsy ) * renderState.dy + yorg;
			//if( (r = IsInfinite( dam, dbm, da, db )) == -1 )
			r = 0;

			
			// draw just in range of the cursor 
	//		if( !( ( (mx - a) > -20) && ( (mx-a) < 20 )
	//			&& ( (my - b) > -20 ) && ( (my - b) < 20 ) ) )
	//		{
	//			continue;
	//		}
			
			//if( (g = IsInfinite2( dam, dbm, da, db )) == -1 )
			//	g = 0;
			bl = IsInfinite2( 0, 0, da, db, direction, renderState.nsub );
			if( (direction) < 0 )
			{
				r = ( 255-bl );
				bl = 0;
			}
			else if( bl < 0 )
			{
				g = 32;
				bl = 0;
				//r = 0;
			}
			else if( bl != 0 )
			{
				//r = 0;
				bl = bl;
			}
			//else
			//	r = 0;
			{

				// point pair horiz -0.123 (R) 0.35071355833500363833634934966131      
				//                    0.422(I)  0.64961527075646859365525325998975
				//
				// point pair vert  -0.563(R)  0.75033325929216279143681201481957  0(I)    //distance to next 0.49986672471039669667784846697923
				// point pair vert  -1.563(R)  1.2501999840025594881146604817988   0(I)    // to next 0.1125178884860932415243100526011 
				// next is -1.857         (R)  1.3627178724886527296389705343999   0(I)

				var unity = da*da + db*db;
				var offset_unity = (da+0.123)*(da+0.123) + db*db;
//console.log( "....", renderState.a, renderState.b );
			if( unity < 0.564 && unity >= 0.562 )
				plot( output_surface, renderState.a, renderState.b, ColorAverage( Color(r,g,bl), BASE_COLOR_WHITE, 64, 256 ) );
			else if( offset_unity < 0.422 && offset_unity >= 0.420 )
				plot( output_surface, renderState.a, renderState.b, ColorAverage( Color(r,g,bl), BASE_COLOR_WHITE, 64, 256 ) );
			else if( unity < 1.001 && unity >= 0.999 )
				plot( output_surface, renderState.a, renderState.b, ColorAverage( Color(r,g,bl), BASE_COLOR_WHITE, 138, 256 ) );
			else if( unity < 1.564 && unity >= 1.562 )
				plot( output_surface, renderState.a, renderState.b, ColorAverage( Color(r,g,bl), BASE_COLOR_WHITE, 64, 256 ) );
			else if( unity < 1.868 && unity >= 1.866 )
				plot( output_surface, renderState.a, renderState.b, ColorAverage( Color(r,g,bl), BASE_COLOR_WHITE, 64, 256 ) );

			else if( da >= -0.125 && da <= -0.122 )
				plot( output_surface, renderState.a, renderState.b, ColorAverage( Color(r,g,bl), BASE_COLOR_BLUE, 64, 256 ) );
			else if( da >= -0.001 && da <= 0.001 )
				plot( output_surface, renderState.a, renderState.b, ColorAverage( Color(r,g,bl), BASE_COLOR_GREEN, 64, 256 ) );
			else if( db >= -0.001 && db <= 0.001 )
				plot( output_surface, renderState.a, renderState.b, ColorAverage( Color(r,g,bl), BASE_COLOR_ORANGE, 64, 256 ) );
			else
				plot( output_surface, renderState.a, renderState.b, Color(r,g,bl) );
			}
			renderState.b++;
		}
		renderState.b = 0;
		renderState.a++;
		if( renderState.nsub[0] > 500000 )
			break;
	}
	if( renderState.a == 512 ) {
	        mandelCtx.putImageData( mandelData, 0, 0 );
		mandelTexture.needsUpdate = true;
		renderState.a = 0;

		if( inout ) {
			if( display_scale >= 1.0 )
				inout = !inout;
			display_scale *= 1.25;
		} else {
			if( display_scale < 1.0/(16*16*16*16) )
				inout = !inout;
			display_scale /= 1.25;
		}

		renderState.dx = display_scale*4.0 / 512;
		renderState.dy = display_scale*4.0 / 512;
	}

	//console.log( "Did %d in %d %d", renderState.nsub[0], Date.now() - start, ( n ) / (Date.now()-start), ( renderState.nsub[0] ) / (Date.now()-start) );
   }

	}
   ii1_max_iter = _ii1_max_iter;
   ii2_max_iter = _ii1_max_iter;
        //mandelCtx.putImageData( mandelData, 0, 0 );
	return;
/*
	{
	   {
			RCOORD dam, dbm;
			dam = ( mx - ofsx ) * dx + xorg;
			dbm = ( my - ofsy ) * dy + yorg;
		for( a = -20; a <= 20; a++ )
		{
			for( b = -20; b <= 20; b++ )
			{
				RCOORD da, db;
				int r, g = 0, bl  = 0;
				int direction;
				float v1[3];
				float v2[3];
				da = aspect * ( mx + a - ofsx ) * dx + xorg;
				db = ( my + b - ofsy ) * dy + yorg;
				r = 0;
				bl = IsInfinite2( 0, 0, da, db, &direction );
				if( (direction) < 0 )
				{
					v1[vForward] = bl * 0.05;
					r = ( bl );
					bl = 0;
				}
				else if( bl < 0 )
				{
					v1[vForward] = 0.5;
					g = 32;
					bl = 0;
					//r = 0;
				}
				else if( bl != 0 )
				{
					v1[vForward] = bl * 0.04;
					//r = 0;
					bl = bl;
				}
				//else
				//	r = 0;
				if( g == 255 )
				{
					int a = 3;
				}
				glBegin( GL_LINES );
				v2[vRight] = v1[vRight] = ( mx + a ) * 0.1;
				v2[vUp] = v1[vUp] = ( my + b ) * 0.1;
				v2[vForward] = 0;
				glColor4ub( r*0xFF,g,bl,255 );
				glVertex3fv( v1 );
				glVertex3fv( v2 );
				glEnd();
				//plot( output_surface, a, b, Color(r,g,bl) );
			}
		}
	   }

	}


	ofsx = (output_surface->width/2);
	ofsy = (output_surface->height/2);
	dx = display_scale*4.0 / (RCOORD)output_surface->width;
	dy = display_scale*4.0 / (RCOORD)output_surface->height;
	{
		RCOORD da, db;
		int r, g, bl  = 0;
		int iter;
		da = aspect * ( mx - ofsx ) * dx + xorg;
		db = ( my - ofsy ) * dy + yorg;
		//iter = DrawInfinite2( output_surface, 0, 0, da, db, dx, dy, ofsx, ofsy );
		iter = GLDrawInfinite2( output_surface, 0, 0, da, db, dx, dy, ofsx, ofsy );
		if( 0 )
		{
			TEXTCHAR buf[256];
			snprintf( buf,256, "%d   %d,%d = %g, %g", iter, mx, my, da, db );
			PutString( output_surface, 10, 50, BASE_COLOR_WHITE, BASE_COLOR_BLACK, buf );
		}
	}
*/
}

/*
static void CPROC OnDraw3d( "Mandelbrot renderer" )( uintptr_t psvInit )
{
	Render( render, 0 );

}

void CPROC MyRedrawCallback( uintptr_t psv, PRENDERER r )
{
   Render( r, FALSE );
}


int CPROC MyMouseCallback( uintptr_t psv, int32_t x, int32_t y, uint32_t b )
{
	if( b & MK_RBUTTON )
	{
		xorg += ( mx - x ) * ( display_scale*4.0 / (RCOORD)output_surface->width );
		yorg += ( my - y ) * ( display_scale*4.0 / (RCOORD)output_surface->height );
			drawn = 0;
	}
	else
	{
		if( ( b & MK_SHIFT ) && ( b & MK_LBUTTON ) )
		{
			if( output_surface )
			{
				RCOORD newscale = display_scale - (display_scale*0.3);
				xorg -= (x*newscale/output_surface->width - x*display_scale/output_surface->width );
				yorg -= (y*newscale/output_surface->height -y*display_scale/output_surface->height );

				display_scale = newscale;
				drawn = 0;
			}
		}


		if( ( b & MK_CONTROL )&& ( b & MK_LBUTTON ) )
		{
			RCOORD newscale = display_scale + (display_scale*0.01);
			xorg -= (x*newscale/output_surface->width -mx *display_scale/output_surface->width );
			yorg -= (y*newscale/display_scale/output_surface->height -my *display_scale/output_surface->height );

			display_scale = newscale;
			drawn = 0;
		}
	}
   //if( !b )
	//	ii1_max_iter = 0;
   //if( !b )
	//	ii2_max_iter = 0;

	//x02 = ( x - ofsx )* dx;
	//y02 = ( y - ofsy ) * dy;
	mx = x;
	my = y;



   Redraw( (PRENDERER)psv );

   return 0;
}
*/

init();
animate();

