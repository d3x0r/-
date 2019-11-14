
var dlaConfig = {};
var config = {};

if( typeof document !== "undefined" ) {
	dlaConfig.canvas = document.getElementById( "testSurfaceDla" );
	dlaConfig.ctx = dlaConfig.canvas.getContext("2d");
} else {
	dlaConfig.lib = true;
}


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


const SURFACE_SIZE =  512;
//const SURFACE_SIZE =  1024;
const SURFACE_PAD = 100;
const WORK_SIZE = ((2*SURFACE_PAD)+SURFACE_SIZE);


dlaConfig.canvas.width = SURFACE_SIZE;
dlaConfig.canvas.height = SURFACE_SIZE;

//#define WORKTYPE uint16_t
function roamer(x,y) { return {x:x,y:y} }

/*
void MoreSalt( uintptr_t psv, POINTER *salt, size_t *salt_size )
{
	static uint32_t val;
	val = GetTickCount();
	(*salt) = &val;
	(*salt_size) = sizeof( val );
}
*/


const l = {
	range_colors : [],
	white : BASE_COLOR_BLACK,
	working_plane:[],  // WORKTYPE
	 roamer_count:0,
	 roamers:[],
	 source_bits:0,
	 source_count:0, // number of sources available.
	sources :[], // list of source points available.
	//PTHREAD updater;
	entropy : exports.SaltyRNG(),
	 generation : 0,

	//struct plasma_patch *plasma;

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

    var _output = dlaConfig.ctx.getImageData(0, 0, SURFACE_SIZE, SURFACE_SIZE);
    var output = _output.data;

function drawDIsplay(  )
{
	var x, y;

	dlaConfig.ctx.clearRect( 0, 0, SURFACE_SIZE, SURFACE_SIZE );
	//dlaConfig.ctx.fillRect( 0, 0, SURFACE_SIZE, SURFACE_SIZE );
	//dlaConfig
    //var _output = dlaConfig.ctx.getImageData(0, 0, SURFACE_SIZE, SURFACE_SIZE);
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
	if(0)
	for( y = 0; y < SURFACE_SIZE; y++ ) {
		var here = (( (y) ) * SURFACE_SIZE+ ( 0 ))*4;
		for( x = 0; x < SURFACE_SIZE; x++, wpl++, here += 4 ){
			output[ here+0 ] = 0;
			output[ here+1 ] = 0;
			output[ here+2 ] = 0;
			output[ here+3 ] = 0;
		}
	}

	for( y = 0; y < SURFACE_SIZE; y++ ) {
		var wpl = (y + SURFACE_PAD) * WORK_SIZE + 0 + SURFACE_PAD;
		var here = (( (y) ) * SURFACE_SIZE+ ( 0 ))*4;
		for( x = 0; x < SURFACE_SIZE; x++, wpl++, here += 4 ){
			var b;
			if( (b = l.working_plane[ wpl ] ) > 1 ) {
				var color = ColorAverage( l.range_colors[((b/64)|0)%l.range_colors.length], l.range_colors[(((b/64)|0) + 1) % l.range_colors.length], b%64, 64 );
				output[ here+0 ] = color[0];
				output[ here+1 ] = color[1];
				output[ here+2 ] = color[2];
				output[ here+3 ] = color[3];
			}
		}
	}
	{
		l.roamers.forEach( (roamer)=>{
			if( !roamer) return;
			if( ( roamer.x > SURFACE_PAD ) 
				&& ( roamer.y > SURFACE_PAD )
				&& roamer.x < (SURFACE_PAD+SURFACE_SIZE)
				&& roamer.y < (SURFACE_PAD+SURFACE_SIZE) ){
					var here = (( roamer.x - SURFACE_PAD ) + ( ( (roamer.y - SURFACE_PAD) ) * SURFACE_SIZE ))*4;
					output[ here+0]  = 0;//l.white[0];
					output[ here+1]  = l.white[1];
					output[ here+2]  = l.white[2];
					output[ here+3]  = l.white[3];
				}

		})
	}
	dlaConfig.ctx.putImageData(_output, 0,0);

}

function TickUpdateDisplay() {
	drawDIsplay();
	if( !l.roamers.length || ( l.roamers.length > 1000 ) )
		setTimeout( TickUpdateDisplay, 100 );
}


function AddRoamer( )
{
	var source;
	var x, y;
	var here;
	do
	{
		x = SURFACE_PAD + Math.random() * SURFACE_SIZE;//l.entropy.getBits( 20 ) % SURFACE_SIZE;
		y = SURFACE_PAD + Math.random() * SURFACE_SIZE;//l.entropy.getBits( 20 ) % SURFACE_SIZE;
		here = ( x ) + ( y ) * WORK_SIZE;
	}
	while( l.working_plane[here+0] 
		|| l.working_plane[here -1] 
		|| l.working_plane[here+1] 
		|| l.working_plane[here+WORK_SIZE] 
		|| l.working_plane[here-WORK_SIZE]
		|| l.working_plane[here-1+WORK_SIZE] 
		|| l.working_plane[here-1-WORK_SIZE]
		|| l.working_plane[here+1+WORK_SIZE] 
		|| l.working_plane[here+1-WORK_SIZE] );
	var r;
	if( l.roamer_count < (r = l.roamers.length ))
		for( r = 0; r < l.roamers.length; r++ ) if( !l.roamers[r] ) { l.roamers[r] = {x:x,y:y}; break; }

	if( r == l.roamers.length ) l.roamers.push( {x:x,y:y} );
	l.roamer_count++;
}

function UpdateRoamers( start ) // offset in thousands
{
	var idx;
	var roamer;
	var d;
	var generated = 0;
	//var startTime = Date.now();
	var generation = ( l.generation / 5 )|0 + 1;
	idx = start * 1000;
	for( ; idx < l.roamers.length; idx++ ) {
		roamer = l.roamers[idx];
		if( !roamer ) continue;
		d = (Math.random() * 4 ) | 0;//l.entropy.getBits( 2, 0 );
		switch( d )
		{
		case 0:
			if( roamer.x > 0 )
				roamer.x--;
			else
			{
				l.roamers[idx] = null;
				roamer = null;
				l.roamer_count--;
			}
			break;
		case 1:
			if( roamer.y > 0 )
				roamer.y--;
			else
			{
				l.roamers[idx] = null;
	            roamer = null;
				l.roamer_count--;
			}
			break;
		case 2:
			if( roamer.x < (WORK_SIZE-1) )
				roamer.x++;
			else
			{
				l.roamers[idx] = null;
				roamer = null;
				l.roamer_count--;
			}
			break;
		case 3:
			if( roamer.y < (WORK_SIZE-1) )
				roamer.y++;
			else
			{
				l.roamers[idx] = null;
				roamer = null;
				l.roamer_count--;
			}
			break;
		}
		if( roamer )
		{
			var b;
			var here = ( roamer.x + roamer.y * WORK_SIZE );
			//function 1+(a) { return generation; }
			//function 1+(a) { return a+1; }

			if( !l.working_plane[here+0]
				&& ( roamer.x > 0/*SURFACE_PAD*/ ) 
				&& roamer.x < ( SURFACE_SIZE+2*SURFACE_PAD - 1)
				&& ( roamer.y > 0/*SURFACE_PAD*/ ) 
				&& roamer.y < ( SURFACE_SIZE+2*SURFACE_PAD - 1) )
			{
                        const globalGen = false;
                        
				if( l.working_plane[here-1] )
					l.working_plane[here+0] = globalGen?generation:(1+(l.working_plane[here-1]));
				else if( l.working_plane[here+1] )
					l.working_plane[here+0] = globalGen?generation:(1+(l.working_plane[here+1]));

				else if(l.working_plane[ here+1 + WORK_SIZE] )
					l.working_plane[here+0] = globalGen?generation:(1+(l.working_plane[here+1 + WORK_SIZE]));
				else if( l.working_plane[here+1 - WORK_SIZE] )
					l.working_plane[here+0] = globalGen?generation:(1+(l.working_plane[here+1 - WORK_SIZE]));

				else if( l.working_plane[here-1 + WORK_SIZE] )
					l.working_plane[here+0] = globalGen?generation:(1+(l.working_plane[here-1 + WORK_SIZE]));
				else if( l.working_plane[here-1 - WORK_SIZE] )
					l.working_plane[here+0] = globalGen?generation:(1+(l.working_plane[here-1 - WORK_SIZE]));

				else if( l.working_plane[here+WORK_SIZE] )
					l.working_plane[here+0] = globalGen?generation:(1+(l.working_plane[here+WORK_SIZE]));
				else if( l.working_plane[here-WORK_SIZE] )
					l.working_plane[here+0] = globalGen?generation:(1+(l.working_plane[here-WORK_SIZE]));

				if( l.working_plane[here+0] )
				{
					l.roamers[idx] = null;
					l.roamer_count--;
					generated++;
				}
			}
		}
	}
	if( generated )
		l.generation++;
	//console.log( "SOMETHING:", Date.now() - startTime );
}

var started = false;;
function UpdateRoamerThread(  )
{
	var start = 0;
	//SetLink( &l.roamers, 120000, 1 );
	//SetLink( &l.roamers, 120000, 0 );
		if( !started ) {
			while( l.roamer_count >= start * 25000 && l.roamer_count < (start+1) * 25000 )
				AddRoamer();
			started = true;
		}
		//if( l.roamer_count >= start * 1000 && l.roamer_count < (start+1) * 1000 )
		//	AddRoamer();
		UpdateRoamers( start );
		UpdateRoamers( start );
		UpdateRoamers( start );
		if( l.roamers.length > 1000 )
		setTimeout( UpdateRoamerThread, 5 );
}

function InitPerlinWater( config )
{	
	var waters = 0;
	const ps = config.patchSize;
	for( var y = 0; y < ps; y++ )
		for( var x = 0; x < ps; x++ ) {
			if( config.gen_noise[y*ps+x] < 0.20 ) {
				l.working_plane[(SURFACE_PAD+y)*WORK_SIZE+(SURFACE_PAD+x)] = 1;
				waters++;
			}
		}

	console.log( "There's something silly here:", waters );
}

function InitSkyAndLand(  )
{
	var n;
	for( n = 0; n < SURFACE_SIZE; n++ )
	{
		l.working_plane[ (SURFACE_SIZE+SURFACE_PAD) * ( WORK_SIZE ) 
						+ SURFACE_PAD + n ] = 1;
	}
/*
	for( n = 0; n < SURFACE_SIZE; n += 16 )
	{
		var source = {x:0,y:0};
		source.x = SURFACE_PAD + n;
		source.y = SURFACE_PAD + SURFACE_SIZE;
		l.sources.push( source );
		l.source_count++;
	}
	*/
	{
		l.source_bits = 0;
		for( n = 0; n < 32; n++ )
			if( l.source_count & ( 1 << n ) )
				l.source_bits = n;
		l.source_bits++;
	}
}



function InitVerticalBar(  )
{
	var n;
	for( n = 0; n < 20; n++ )
	{
		l.working_plane[ (SURFACE_PAD) * ( WORK_SIZE ) 
						+ SURFACE_PAD + SURFACE_SIZE / 2 - 10 + n ] = 1;
	}
	for( n = 0; n < SURFACE_SIZE; n++ )
	{
		l.working_plane[ (SURFACE_PAD + n) * ( WORK_SIZE ) 
						+ SURFACE_PAD + SURFACE_SIZE / 2  ] = 1;
	}

/*
	for( n = 0; n < SURFACE_SIZE; n += 16 )
	{
		struct roamer *source = New( struct roamer );
		source.x = SURFACE_PAD + n;
		source.y = SURFACE_PAD + SURFACE_SIZE;
		AddLink( &l.sources, source );
		l.source_count++;
	}
	*/
	{
		l.source_bits = 0;
		for( n = 0; n < 32; n++ )
			if( l.source_count & ( 1 << n ) )
				l.source_bits = n;
		l.source_bits++;
	}
}


function InitSpaceSparks(  )
{
	var n;
	const CENTER_SIZE = 10;
	for( n = 0; n < CENTER_SIZE; n++ )
	{
		l.working_plane[ (SURFACE_PAD + (SURFACE_SIZE/2 - (CENTER_SIZE/2)) + n) * ( WORK_SIZE ) 
						+ SURFACE_PAD + (SURFACE_SIZE/2 - (CENTER_SIZE/2))  ] = 1;
		l.working_plane[ (SURFACE_PAD + (SURFACE_SIZE/2 - (CENTER_SIZE/2)) + n) * ( WORK_SIZE ) 
						+ SURFACE_PAD + (SURFACE_SIZE/2 + (CENTER_SIZE/2))  ] = 1;

		l.working_plane[ (SURFACE_PAD + (SURFACE_SIZE/2 - (CENTER_SIZE/2)) ) * ( WORK_SIZE ) 
						+ SURFACE_PAD + (SURFACE_SIZE/2 - (CENTER_SIZE/2) + n)  ] = 1;
		l.working_plane[ (SURFACE_PAD + (SURFACE_SIZE/2 + (CENTER_SIZE/2)) ) * ( WORK_SIZE ) 
						+ SURFACE_PAD + (SURFACE_SIZE/2 - (CENTER_SIZE/2) + n)  ] = 1;
	}

	for( n = 0; n < 125; n ++ )
	{
		var source = {x:0,y:0};
		var n =  Math.random() * SURFACE_SIZE*4;// l.entropy.getBits( 20, 0 ) % SURFACE_SIZE * 4;
		if( n < SURFACE_SIZE )
		{
			source.x = n + SURFACE_PAD;
			source.y = SURFACE_PAD;
		}
		else if( n < 2*SURFACE_SIZE )
		{
			source.x = ( n - SURFACE_SIZE ) + SURFACE_PAD;
			source.y = SURFACE_PAD + SURFACE_SIZE;
		}
		else if( n < 3*SURFACE_SIZE )
		{
			source.x = SURFACE_PAD;
			source.y = ( n - SURFACE_SIZE*2) + SURFACE_PAD;
		}
		else if( n < 4*SURFACE_SIZE )
		{
			source.x = SURFACE_SIZE + SURFACE_PAD;
			source.y = ( n - SURFACE_SIZE*3) + SURFACE_PAD;
		}
		l.sources.push( source );
		l.source_count++;
	}

	{
		l.source_bits = 0;
		for( n = 0; n < 32; n++ )
			if( l.source_count & ( 1 << n ) )
				l.source_bits = n;
		l.source_bits++;
	}
}


function main()
{

	if( !config.gen_noise )
		setTimeout( main, 10);

	for( var n = 0; n < WORK_SIZE*WORK_SIZE; n++ )
		l.working_plane[n] = 0;

	//InitSpaceSparks();
	//InitVerticalBar();
	//InitSkyAndLand();
	InitPerlinWater( config );

	l.white = BASE_COLOR_BLACK;

	const RANGES = [BASE_COLOR_BLACK, BASE_COLOR_DARK_BLUE
				, BASE_COLOR_MID_BLUE, BASE_COLOR_LIGHT_TAN
				, BASE_COLOR_DARK_GREEN, BASE_COLOR_LIGHT_TAN
				, BASE_COLOR_DARK_BROWN, BASE_COLOR_WHITE
				, BASE_COLOR_BLACK ];

	l.range_colors[0] = BASE_COLOR_LIGHTBLUE;
	l.range_colors[1] = BASE_COLOR_LIGHT_TAN;
	l.range_colors[2] = BASE_COLOR_DARK_GREEN;
	l.range_colors[3] = BASE_COLOR_DARK_BROWN;
	l.range_colors[4] = BASE_COLOR_YELLOW;
	l.range_colors[5] = BASE_COLOR_MAGENTA;

	TickUpdateDisplay();
	UpdateRoamerThread();

}

main()

