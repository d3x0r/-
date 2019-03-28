

var c = document.getElementById( "testSurface");
var ctx = c.getContext("2d");


var SRG = exports.SaltyRNG;//require( "../org.d3x0r.common/salty_random_generator.js" ).SaltyRNG;

//const patch = 1025;
const patch = 129;
//1025  
//#define patch 257

var slider_panel = {
	pair1 : document.createElement( "DIV" ),
	pair2 : document.createElement( "DIV" ),
	pair3 : document.createElement( "DIV" ),
	pair4 : document.createElement( "DIV" ),
	slider1 : document.createElement("INPUT"),
	slider2 : document.createElement("INPUT"),
	slider3 : document.createElement("INPUT"),
	slider4 : document.createElement("INPUT"),
	value1 : document.createElement("SPAN"),
	value2 : document.createElement("SPAN"),
	value3 : document.createElement("SPAN"),
	value4 : document.createElement("SPAN"),

};

//  on("change",// final
// on("input", // input is each delta change

slider_panel.slider1.setAttribute("type", "range");
slider_panel.slider1.max = 999;
slider_panel.slider1.min = 1;

slider_panel.slider2.setAttribute("type", "range");
slider_panel.slider2.min = -5+5;
slider_panel.slider2.max = 5+5;


slider_panel.slider3.setAttribute("type", "range");
slider_panel.slider3.min = 1;
slider_panel.slider3.max = 100;

slider_panel.slider4.setAttribute("type", "range");

slider_panel.slider1.onchange = Slider1UpdateProc;
slider_panel.slider2.onchange = Slider2UpdateProc;
slider_panel.slider3.onchange = Slider3UpdateProc;
slider_panel.slider4.onchange = Slider4UpdateProc;

slider_panel.slider1.oninput = Slider1UpdateProc;
slider_panel.slider2.oninput = Slider2UpdateProc;
slider_panel.slider3.oninput = Slider3UpdateProc;
slider_panel.slider4.oninput = Slider4UpdateProc;

document.body.appendChild( slider_panel.pair1 );
document.body.appendChild( slider_panel.pair2 );
document.body.appendChild( slider_panel.pair3 );
document.body.appendChild( slider_panel.pair4 );

slider_panel.pair1.appendChild( slider_panel.value1 );
slider_panel.pair1.appendChild( document.createElement( "br" ) );
slider_panel.pair1.appendChild( slider_panel.value4 );
slider_panel.pair1.appendChild( document.createElement( "br" ) );

slider_panel.pair1.appendChild( slider_panel.slider1 );

slider_panel.pair2.appendChild( slider_panel.value2 );
slider_panel.pair2.appendChild( document.createElement( "br" ) );
slider_panel.pair2.appendChild( slider_panel.slider2 );

slider_panel.pair3.appendChild( slider_panel.value3 );
slider_panel.pair3.appendChild( document.createElement( "br" ) );
slider_panel.pair3.appendChild( slider_panel.slider3 );

slider_panel.pair4.appendChild( slider_panel.slider4 );
slider_panel.pair4.appendChild( document.createElement( "br" ) );


var l = {
        plasma : null,
        entropy : SRG( TestFeedRandom ),
         digits:1,
         decimal:0,
         render:c,
        horz_r_scale:0,
        ofs_x:0, ofs_y : 0,
        mouse_x:0, mouse_y:0,
        mouse_b : 0,

        grid_reader:null
    } 



c.onmousedown = (evt)=>Mouse(evt.clientX,evt.clientY,evt.buttons);
c.onmouseup = (evt)=>Mouse(evt.clientX,evt.clientY,evt.buttons);
c.onmousemove = (evt)=>Mouse(evt.clientX,evt.clientY,evt.buttons);

const MK_LBUTTON = 1
const MK_RBUTTON = 2
const MK_MBUTTON = 8

const MK_SOMEBUTTON      = (MK_LBUTTON|MK_RBUTTON|MK_MBUTTON)
function MAKE_SOMEBUTTONS(b)  { return    ((b)&(MK_SOMEBUTTON)) }

function MAKE_NEWBUTTON(b,_b) { return  ((((b)^(_b))&(b))&MK_SOMEBUTTON) }
function MAKE_NOBUTTONS(b)   { return    ( !((b) & MK_SOMEBUTTON ) ) }

function MAKE_FIRSTBUTTON(b,_b) {
	return ( MAKE_NEWBUTTON(b,_b) && MAKE_NOBUTTONS(_b) )
}
function Mouse(  x, y, b )
{
	if( MAKE_FIRSTBUTTON( b, l.mouse_b ) )
	{
		l.mouse_x = x;
		l.mouse_y = y;
	}
	else if( MAKE_SOMEBUTTONS( b ) )
	{
		l.ofs_x += l.mouse_x - x;
		l.ofs_y += l.mouse_y - y;
		l.mouse_x = x;
		l.mouse_y = y;
		DrawPlasma( l.render );
	}
	else
	{

	}
	l.mouse_b = b;
	return 1;
}

function DrawPlasma( )
{
	var use_grid_reader = true;
	var data  = PlasmaReadSurface( l.plasma, l.ofs_x, l.ofs_y, l.render.width, l.render.height, 0, 0 );
	var _output = 0;
	var output;
    var output_offset = 0;
	var w;
	var h;
	var surface = null;
	var min = 999999999;
	var max = 0;
	console.log( "begin render" );

    var _output = ctx.getImageData(0, 0, l.render.width, l.render.height);
    var output = _output.data;
     //{ width: 100, height: 100, data: Uint8ClampedArray[40000] }
    function plot(a,b,c,d) { 
		//console.log( "output at", output_offset, d )
        output[output_offset*4+0] = d[0]; 
        output[output_offset*4+1] = d[1]; 
        output[output_offset*4+2] = d[2]; 
        output[output_offset*4+3] = d[3]; 
        output_offset++
        //output++;
    }


	virtual_surface = 0;
	if( !data )
		return;

	for( h = 0; h < _output.height; h++ )
	{
		//output_offset =  + ( surface.height - h - 1 ) * surface.width;

		for( w = 0; w < _output.width; w++ )
		{
			var here = data[ h * l.render.height + w ];
			if( min > here )  min = here;
			if( max < here ) max = here;
if (true) {
			if( here <= 0.01 )
				plot( surface, w, h, ColorAverage( BASE_COLOR_WHITE,
												 BASE_COLOR_BLACK, (here)/(0.01) * 1000, 1000 ) );
			else if( here <= 0.25 )
				plot( surface, w, h, ColorAverage( BASE_COLOR_BLACK,
												 BASE_COLOR_LIGHTBLUE, (here-0.01)/(0.25-0.01) * 1000, 1000 ) );
			else if( here <= 0.5 )
				plot( surface, w, h, ColorAverage( BASE_COLOR_LIGHTBLUE,
												 BASE_COLOR_LIGHTGREEN, (here-0.25)/(0.5-0.25) * 1000, 1000 ) );
			else if( here <= 0.75 )
				plot( surface, w, h, ColorAverage( BASE_COLOR_LIGHTGREEN,
												 BASE_COLOR_LIGHTRED, (here-0.5)/(0.75-0.5) * 1000, 1000 ) );
			else if( here <= 0.99 )
				plot( surface, w, h, ColorAverage( BASE_COLOR_LIGHTRED,
												 BASE_COLOR_WHITE, (here-0.75)/(0.99-0.75) * 1000, 1000 ) );
			else //if( here <= 4.0 / 4 )
				plot( surface, w, h, ColorAverage( BASE_COLOR_WHITE,
												 BASE_COLOR_BLACK, (here-0.99)/(1.0-0.99) * 10000, 10000 ) );
}
			//plot( surface, w, h, ColorAverage( BASE_COLOR_BLACK,
			//									 BASE_COLOR_LIGHTRED, (here) * 1000, 1000 ) );
			//console.log( "%d,%d  %g", w, h, data[ h * surface.width + w ] );
		}
	}
	// here is (AT THIS TIME) scaled 0-1 mostly non-inclusive.
	//console.log( "Result is", min, max );

	ctx.putImageData(_output, 0,0);
	//UpdateDisplay( render );
	//if( use_grid_reader )
	//	Release( data );
}

const BASE_COLOR_WHITE = [255,255,255,255];
const BASE_COLOR_BLACK = [0,0,0,255];
const BASE_COLOR_RED = [127,0,0,255];
const BASE_COLOR_LIGHTBLUE = [0,0,255,255];
const BASE_COLOR_LIGHTRED = [255,0,0,255];
const BASE_COLOR_LIGHTGREEN = [0,255,0,255];

function ColorAverage( a, b, i,m) {

    var c = [ (((b[0]-a[0])*i/m) + a[0])|0,
        (((b[1]-a[1])*i/m) + a[1])|0,
        (((b[2]-a[2])*i/m) + a[2])|0,
		(((b[3]-a[3])*i/m) + a[3])|0
             ]
    //console.log( "color: ", a, b, c, i, ((b[1]-a[1])*i/m)|0, a[1], ((b[1]-a[1])*i/m) + a[1] )
    return c;//`#${(c[0]<16?"0":"")+c[0].toString(16)}${(c[1]<16?"0":"")+c[1].toString(16)}${(c[2]<16?"0":"")+c[2].toString(16)}`
}


function TestFeedRandom( salt )
{
    salt.push( Date.now() );
}

function PlasmaLayerSalting( salt )
{
    salt.push( Date.now() );
}


function KeyPlasma( key )
{
	if( IsKeyPressed( key ) )
	{
        /*
		RCOORD coords[4];
		if( KEY_CODE( key ) == KEY_W )
		{
			RCOORD *data = PlasmaReadSurface( l.plasma, l.ofs_x, l.ofs_y, 0 );
			console.log( "begin render" );
			WriteImage( "plasma.dds", data, patch-1, patch-1, patch );
		}
		else if( KEY_CODE( key ) == KEY_R )
		{
			//RCOORD *data = PlasmaReadSurface( l.plasma, l.ofs_x, l.ofs_y, 0 );
			//console.log( "begin render" );
			ReadImage( "TerrainNormal_Height.dds" );
		}
		else
		{
			coords[0] = SRG_GetEntropy( l.entropy, 5, FALSE ) / 132.0 + 0.5;
			coords[1] = SRG_GetEntropy( l.entropy, 5, FALSE ) / 132.0 + 0.5;
			coords[2] = SRG_GetEntropy( l.entropy, 5, FALSE ) / 132.0 + 0.5;
			coords[3] = SRG_GetEntropy( l.entropy, 5, FALSE ) / 132.0 + 0.5;
			PlasmaRender( l.plasma, coords );
			DrawPlasma( l.render );
		}
        */
	}
	return 1;
}


function ComputeRoughness(  )
{
	var n;
	var base = 1;
	var roughness;
	if( l.decimal > 0 )
	{
		for( n = 0; n < l.decimal; n++ )
			base = base * 10;
	}
	else
	{
		for( n = 0; n > l.decimal; n-- )
			base = base / 10;
	}
	roughness = base * l.digits;
	roughness = ( roughness / 512 )/* * patch*/;
	slider_panel.value4.innerHTML = roughness;
	
	PlasmaSetGlobalRoughness( l.plasma, roughness, l.horz_r_scale );
	{
		slider_panel.value1.value = l.digits
		slider_panel.value2.value = l.decimal
		slider_panel.value3.value = l.roughness
	}
	PlasmaRender( l.plasma, coords );
	DrawPlasma();
}

function Slider1UpdateProc()
{
	// value is 0-1000 for the digits place
	l.digits = this.value;
	slider_panel.value1.innerHTML = l.digits;
	ComputeRoughness(  );
}

function Slider2UpdateProc()
{
	// decimal shift left-right
	l.decimal = this.value-5;
	slider_panel.value2.innerHTML = l.decimal;
	ComputeRoughness(  );
}

function Slider3UpdateProc()
{
	// hoirzonatal random modifier compared to center
	l.horz_r_scale = this.value / 100.0;
	slider_panel.value3.innerHTML = l.horz_r_scale;
	ComputeRoughness(  );
}

function  Slider4UpdateProc()
{
	// 
	//l.horz_r_scale = val / 100.0;
	//ComputeRoughness( panel );
}

const resolution = 16;

function getLayers( x,y,z ) {
	function feedLayerSalt( salt ) {
		salt.push( x );
		salt.push( y );
		salt.push( z );
		//args.forEach( (arg)=>salt.push( arg ) );
	}
	var layerSRG = SRG( feedLayerSalt );
	var result = [];
	for( var n = 0; n < 16; n++ ) {
		result.push( ( ( (layerSRG.getBits( resolution, false ) / ( (1 << resolution) - 1 ) ) - 0.5 ) * 2 ) );
	}
	return result;
}

// main.
{
        if( true ) {
	var plasma_world_map = [];
	const world_range = 5;
	for( var x = -world_range; x <= world_range; x++ ) {
		var yPlane = [];
		plasma_world_map.push( yPlane );
		for( var y = -world_range; y <= world_range; y++ ) {
			var zStrip = [];
			yPlane.push( zStrip );
			for( var z = -world_range; z <= world_range; z++ ) {
				//console.log( "coords:", x, y, z );
				zStrip.push( c = getLayers( x, y, z ) );
			}
		}
	}       
	}

	

    var coords=[,,,];
	//console.log( "First log" );
	//SetAllocateLogging( 1 );
	l.horz_r_scale = 0.75;
	l.decimal = 0;
	l.digits = 201;
	slider_panel.value1.innerHTML = l.digits;
	slider_panel.slider1.value = l.digits;
	slider_panel.value2.innerHTML = l.decimal;
	slider_panel.slider2.value = l.decimal+5;
	slider_panel.value3.innerHTML = l.horz_r_scale;
	slider_panel.slider3.value = l.horz_r_scale*100;

//	SetKeyboardHandler( l.render, KeyPlasma, 0 );
	//SetMouseHandler( l.render, Mouse, 0 );
	//l.grid_reader = GridReader_Open( "c:/storage/maps/nevada_gis/usa_elevation/usa1_alt" );


	coords[0] = 200.0 * plasma_world_map[0][0][0][0];
	coords[1] = -200.0 * plasma_world_map[1][0][0][0];
	coords[2] = 200.0 * plasma_world_map[0][1][0][0];
	coords[3] = -200.0 * plasma_world_map[1][1][0][0];
	l.plasma = PlasmaCreate( coords, 0.5/*patch * 2*/, patch, patch );

	DrawPlasma( );

}
