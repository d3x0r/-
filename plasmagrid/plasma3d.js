
var SRG = require( "../org.d3x0r.common/salty_random_generator.js" ).SaltyRNG;
//var generator = SRG( FeedRandom(patch) )

//});

const skip_left = 1;
const skip_top = 2;
const skip_right = 4;
const skip_bottom = 8;
const skip_below = 16;
const skip_above = 32;

const extend_left = 0;
const extend_right = 2;
const extend_top = 1;
const extend_bottom = 3;
const extend_above = 4;
const extend_below = 5;

const corner_below_top_left = 0;
const corner_below_top_right = 1;
const corner_below_bottom_left = 2;
const corner_below_bottom_right = 3;
const corner_above_top_left = 4;
const corner_above_top_right = 5;
const corner_above_bottom_left = 6;
const corner_above_bottom_right = 7;


const scalar1 = 5;
const scalar2 = 20;

function grid () { 
	var gr =  {
		x :0 , y:0, z:0, x2:0, y2:0, z2:0, skip : 0,
		clone:function(){ var g = grid(); g.x=gr.x;g.y=gr.y;g.z=gr.z;g.x2=gr.x2;g.y2=gr.y2;g.z2=gr.z2;g.skip=gr.skip;return g }
	};
	return gr ;
}

function plasma_patch( map ) {
	var patch = {
		// where I am.
		x : 0, y: 0,
		corners:[0,0,0,0,0,0,0,0],
		seed_corner : 0,
		saved_seed_corner : 0,
		min_height : 0,
		max_height : 0,
		_min_height : 0,
		_max_height: 0,

		entropy :  null,
		map: null,
		map1: null,
		area_scalar:0,
		horiz_area_scalar:0,
		//POINTER entopy_state;

		plasma : map,

		as_left: null,
		as_top: null,
		as_right: null,
		as_bottom : null
	}
	patch.entropy = SRG( FeedRandom( patch )  );
	return patch;
}

/*
	patch = PlasmaCreatePatch( plasma, seed, roughness );
	plasma.world_map = [patch];
	plasma.map_width = 1;
	plasma.map_height = 1;
	plasma.clip.top = patch.max_height;
	plasma.clip.bottom = patch.min_height;
	plasma.world_height_map = PlasmaReadSurface( patch, 0, 0, 0, 1 );
*/

function plasma_state( w, h, d ) {
var map = {
	p_width : w, p_height :h, p_depth : d, 
	//var *read_map;  // this is the map used to retun the current state.
	//struct plasma_clip {
//		var top, bottom;
//	} clip;
	map_width : 1, map_height : 1, map_depth : 1,
	world_map : [],
	root_x : 0, root_y : 0,  root_z : 0, // where 0, 0 is...
	world_height_map :null,
	clip : { top:0, left:0, bottom:0, right:0, above:0, below:0 },

	plasma_patch : ()=>{ return plasma_patch( map ) }
};
return map;
}

function PlasmaFill2( plasma, map, here )
{

	var pdq_todo = [];

	var mx, my;
	var real_here;
	var next = grid();
	var del;
	var center;
	var this_point;
	const width = plasma.width;
	const height = plasma.height;
	const widthHeight = width * height;
	var depth = plasma.depth;
	real_here = here.clone();
	//MemCpy( &real_here, here, sizeof( struct grid ) );

	function mid(a,b) { return ((((a)+(b))|0)/2|0) }

	do
	{
		here = real_here;
		//console.log( "here:", here );
		mx = mid( here.x2, here.x );
		my = mid( here.y2, here.y );
		mz = mid( here.z2, here.z );

		// may be a pinched rectangle... 3x2 that just has 2 mids top bottom to fill no center
		//console.log( "center %d,%d  next is %d,%d %d,%d", mx, my, here.x, here.y, here.x2, here.y2 );
		if( here.z != here2.z ) {
			if( mz != here.z )
				if( ( mx != here.x ) && ( my != here.y ) )
				{
					var del1 = ( ( plasma.entropy.getBits( 13, false ) / ( 1 << 13 ) ) - 0.5 );
		        	
					var area = ( Math.sqrt( ( ( here.x2 - here.x )*( here.x2 - here.x ) 
							+ ( here.y2 - here.y )*( here.y2 - here.y )
							+ ( here.z2 - here.z )*( here.z2 - here.z ) ) 
							) * ( plasma.area_scalar ) );
					var avg = ( map[here.x + here.y*width + here.z * widthHeight] + map[here.x2 + here.y*width + here.z * widthHeight]
						  + map[here.x + here.y2*width + here.z * widthHeight] + map[here.x2 + here.y2*width+ here.z * widthHeight]
						  + map[here.x + here.y*width + here.z2 * widthHeight] + map[here.x2 + here.y*width + here.z2 * widthHeight]
						  + map[here.x + here.y2*width + here.z2 * widthHeight] + map[here.x2 + here.y2*width+ here.z2 * widthHeight]
					          ) / 8;
					//avg += ( map[here.x + my*width] + map[here.x2 + my*width]
					//				 + map[mx + here.y*width] + map[mx + here.y2*width] ) / 4;
					//avg /= 2;
					//console.log( "Set point %d,%d = %g (%g) %g", mx, my, map[mx + my * width], avg );
					center 
						= this_point
						= map[mx + my * width + mz*widthHeight] 
						= avg + ( area *  del1 ) * scalar1;
		        	
					if( this_point > plasma.max_height )
						plasma.max_height = this_point;
					if( this_point < plasma.min_height )
						plasma.min_height = this_point;
		        	
					if( mid( next.x = here.x, next.x2 = mx ) != next.x 
						&& mid( next.y = here.y, next.y2 = my ) != next.y 
						&& mid( next.z = here.z, next.z2 = mz ) != next.z )
					{
						next.skip = here.skip & ( skip_top|skip_left|skip_below );
						pdq_todo.push( next.clone() )
					}
		        	
					if( mid( next.x = mx, next.x2 = here.x2 ) != next.x 
						&& mid( next.y = here.y, next.y2 = my ) != next.y 
						&& mid( next.z = here.z, next.z2 = mz ) != next.z  )
					{
						next.skip = skip_left | here.skip & ( skip_top|skip_below );
						pdq_todo.push( next.clone() )
					}
		        	
					if( mid( next.x = here.x, next.x2 = mx ) != next.x 
						&& mid( next.y = my, next.y2 = here.y2 ) != next.y 
						&& mid( next.z = mz, next.z2 = here.z2 ) != next.z  )
					{
						next.skip = (here.skip & skip_left) | skip_top|skip_below;
						pdq_todo.push( next.clone() )
					}
		        	
					if( mid( next.x = mx, next.x2 = here.x2 ) != next.x 
						&& mid( next.y = my, next.y2 = here.y2 ) != next.y 
						&& mid( next.z = mz, next.z2 = here.z2 ) != next.z  )
					{
						next.skip = skip_left|skip_top|skip_below;
						pdq_todo.push( next.clone() )
					}
			        
					if( mid( next.x = here.x, next.x2 = mx ) != next.x 
						&& mid( next.y = here.y, next.y2 = my ) != next.y 
						&& mid( next.z = mz, next.z2 = here.z2 ) != next.z )
					{
						next.skip = here.skip & ( skip_top|skip_left|skip_above );
						pdq_todo.push( next.clone() )
					}
		        	
					if( mid( next.x = mx, next.x2 = here.x2 ) != next.x 
						&& mid( next.y = here.y, next.y2 = my ) != next.y 
						&& mid( next.z = mz, next.z2 = here.z2 ) != next.z  )
					{
						next.skip = skip_left |skip_above| here.skip & ( skip_top );
						pdq_todo.push( next.clone() )
					}
		        	
					if( mid( next.x = here.x, next.x2 = mx ) != next.x 
						&& mid( next.y = my, next.y2 = here.y2 ) != next.y 
						&& mid( next.z = mz, next.z2 = here.z2 ) != next.z  )
					{
						next.skip = (here.skip & skip_left) | skip_top|skip_above;
						pdq_todo.push( next.clone() )
					}
		        	
					if( mid( next.x = mx, next.x2 = here.x2 ) != next.x 
						&& mid( next.y = my, next.y2 = here.y2 ) != next.y 
						&& mid( next.z = mz, next.z2 = here.z2 ) != next.z  )
					{
						next.skip = skip_left|skip_top|skip_above;
						pdq_todo.push( next.clone() )
					}
				}

			if( mz != here.z )
			{
				var del1 = ( ( plasma.entropy.getBits( 13, false ) / ( 1 << 13 ) ) - 0.5 );
				var del2 = ( ( plasma.entropy.getBits( 13, false ) / ( 1 << 13 ) ) - 0.5 );
				var del3 = ( ( plasma.entropy.getBits( 13, false ) / ( 1 << 13 ) ) - 0.5 );
				var del4 = ( ( plasma.entropy.getBits( 13, false ) / ( 1 << 13 ) ) - 0.5 );

				var area = ( mz - here.z ) * ( plasma.horiz_area_scalar );

				if( mx != here.x )
				{
					if( !(here.skip&skip_top) && !( here.y == 0 && plasma.as_top ) && !( here.z == 0 && plasma.as_above ))
					{
						//console.log( "set point  %d,%d", mx, here.y );
						this_point
							= map[mx + here.y * width + mz * widthHeight ] 
							= ( map[here.x + here.y*width + mz * widthHeight] 
							  + map[here.x2 + here.y*width + mz * widthHeight] + center ) / 3
								+ area * del1 * scalar2;
						if( this_point > plasma.max_height )
							plasma.max_height = this_point;
						if( this_point < plasma.min_height )
							plasma.min_height = this_point;
					}
			        
					if( !( here.y2 == (height-1) && plasma.as_bottom ) )
					{
					//console.log( "set point  %d,%d", mx, here.y2 );
						this_point
							= map[mx + here.y2 * width + mz * widthHeight] 
							= ( map[here.x + here.y2*width + mz * widthHeight] 
							  + map[here.x2 + here.y2*width + mz * widthHeight] + center ) / 3
								+ area * del2 * scalar2;
						if( this_point > plasma.max_height )
							plasma.max_height = this_point;
						if( this_point < plasma.min_height )
							plasma.min_height = this_point;
					}
					//else
						//console.log( "Skip point %d,%d  %g", here.y2, mx, map[mx + here.y2 * width] );
				}
				if( my != here.y )
				{
					if( !(here.skip&skip_left) && !( here.x == 0 && plasma.as_left ) )
					{
						this_point
							= map[here.x + my * width + mz * widthHeight] 
							= ( map[here.x + here.y*width + mz * widthHeight] 
							  + map[here.x + here.y2*width + mz * widthHeight] + center ) / 3
							  + area * del3 * scalar2;
						//console.log( "set point  %d,%d", here.x, my );
						if( this_point > plasma.max_height )
							plasma.max_height = this_point;
						if( this_point < plasma.min_height )
							plasma.min_height = this_point;
					}
					if( !( here.x2 == (width-1) && plasma.as_right ) )
					{
						this_point
							= map[here.x2 + my * width + mz * widthHeight] 
							= ( map[here.x2 + here.y*width + mz * widthHeight] 
							  + map[here.x2 + here.y2*width + mz * widthHeight] + center ) / 3
								+ area * del4 * scalar2;
						//console.log( "set point  %d,%d", here.x2, my );
						if( this_point > plasma.max_height )
							plasma.max_height = this_point;
						if( this_point < plasma.min_height )
							plasma.min_height = this_point;
					}
				}
			}

		        for( var switchZ = 0; switchZ < 2; switchZ++ ) {
				var thisZ = switchZ==0?here.z:switchZ==1?mz:here.z2;
				if( mx != here.x )
				{
					var del1 = ( ( plasma.entropy.getBits( 13, false ) / ( 1 << 13 ) ) - 0.5 );
					var del2 = ( ( plasma.entropy.getBits( 13, false ) / ( 1 << 13 ) ) - 0.5 );
					var area = ( mx - here.x ) * ( plasma.horiz_area_scalar );
					if( !(here.skip&skip_top) && !( here.y == 0 && plasma.as_top ) && !( here.z == 0 && plasma.as_above ))
					{
						//console.log( "set point  %d,%d", mx, here.y );
						this_point
							= map[mx + here.y * width + thisZ * widthHeight ] 
							= ( map[here.x + here.y*width + thisZ * widthHeight] 
							  + map[here.x2 + here.y*width + thisZ * widthHeight] + center ) / 3
								+ area * del1 * scalar2;
						if( this_point > plasma.max_height )
							plasma.max_height = this_point;
						if( this_point < plasma.min_height )
							plasma.min_height = this_point;
					}
			        
					if( !( here.y2 == (height-1) && plasma.as_bottom ) )
					{
					//console.log( "set point  %d,%d", mx, here.y2 );
						this_point
							= map[mx + here.y2 * width + thisZ * widthHeight] 
							= ( map[here.x + here.y2*width + thisZ * widthHeight] 
							  + map[here.x2 + here.y2*width + thisZ * widthHeight] + center ) / 3
								+ area * del2 * scalar2;
						if( this_point > plasma.max_height )
							plasma.max_height = this_point;
						if( this_point < plasma.min_height )
							plasma.min_height = this_point;
					}
					//else
						//console.log( "Skip point %d,%d  %g", here.y2, mx, map[mx + here.y2 * width] );
				}
				if( my != here.y )
				{
					var del1 = ( ( plasma.entropy.getBits( 13, false ) / ( 1 << 13 ) ) - 0.5 );
					var del2 = ( ( plasma.entropy.getBits( 13, false ) / ( 1 << 13 ) ) - 0.5 );
					var area = ( my - here.y ) * ( plasma.horiz_area_scalar );
			        
					if( !(here.skip&skip_left) && !( here.x == 0 && plasma.as_left ) )
					{
						this_point
							= map[here.x + my * width + thisZ * widthHeight] 
							= ( map[here.x + here.y*width + thisZ * widthHeight] 
							  + map[here.x + here.y2*width + thisZ * widthHeight] + center ) / 3
							  + area * del1 * scalar2;
						//console.log( "set point  %d,%d", here.x, my );
						if( this_point > plasma.max_height )
							plasma.max_height = this_point;
						if( this_point < plasma.min_height )
							plasma.min_height = this_point;
					}
					if( !( here.x2 == (width-1) && plasma.as_right ) )
					{
						this_point
							= map[here.x2 + my * width + thisZ * widthHeight] 
							= ( map[here.x2 + here.y*width + thisZ * widthHeight] 
							  + map[here.x2 + here.y2*width + thisZ * widthHeight] + center ) / 3
								+ area * del2 * scalar2;
						//console.log( "set point  %d,%d", here.x2, my );
						if( this_point > plasma.max_height )
							plasma.max_height = this_point;
						if( this_point < plasma.min_height )
							plasma.min_height = this_point;
					}
				}
			}
		} else {
			if( ( mx != here.x ) && ( my != here.y ) )
			{
				var del1 = ( ( plasma.entropy.getBits( 13, false ) / ( 1 << 13 ) ) - 0.5 );
		        
				var area = ( Math.sqrt( ( ( here.x2 - here.x )*( here.x2 - here.x ) + ( here.y2 - here.y )*( here.y2 - here.y )) ) * ( plasma.area_scalar ) );
				var avg = ( map[here.x + here.y*width + here.z*widthHeight] 
					  + map[here.x2 + here.y*width + here.z*widthHeight]
					  + map[here.x + here.y2*width + here.z*widthHeight] 
					  + map[here.x2 + here.y2*width + here.z*widthHeight] ) / 4;
				//avg += ( map[here.x + my*width] + map[here.x2 + my*width]
				//				 + map[mx + here.y*width] + map[mx + here.y2*width] ) / 4;
				//avg /= 2;
				//console.log( "Set point %d,%d = %g (%g) %g", mx, my, map[mx + my * width], avg );
				center 
					= this_point
					= map[mx + my * width + here.z*widthHeight] = avg + ( area *  del1 ) * scalar1;
		        
				if( this_point > plasma.max_height )
					plasma.max_height = this_point;
				if( this_point < plasma.min_height )
					plasma.min_height = this_point;
		        
				if( mid( next.x = here.x, next.x2 = mx ) != next.x 
					&& mid( next.y = here.y, next.y2 = my ) != next.y  )
				{
					next.skip = here.skip & ( skip_top|skip_left );
					pdq_todo.push( next.clone() )
				}
		        
				if( mid( next.x = mx, next.x2 = here.x2 ) != next.x 
					&& mid( next.y = here.y, next.y2 = my ) != next.y  )
				{
					next.skip = skip_left | here.skip & ( skip_top );
					pdq_todo.push( next.clone() )
				}
		        
				if( mid( next.x = here.x, next.x2 = mx ) != next.x 
					&& mid( next.y = my, next.y2 = here.y2 ) != next.y  )
				{
					next.skip = (here.skip & skip_left) | skip_top;
					pdq_todo.push( next.clone() )
				}
		        
				if( mid( next.x = mx, next.x2 = here.x2 ) != next.x 
					&& mid( next.y = my, next.y2 = here.y2 ) != next.y  )
				{
					next.skip = skip_left|skip_top;
					pdq_todo.push( next.clone() )
				}
			}
		        
			if( mx != here.x )
			{
				var del1 = ( ( plasma.entropy.getBits( 13, false ) / ( 1 << 13 ) ) - 0.5 );
				var del2 = ( ( plasma.entropy.getBits( 13, false ) / ( 1 << 13 ) ) - 0.5 );
				var area = ( mx - here.x ) * ( plasma.horiz_area_scalar );
				if( !(here.skip&skip_top) && !( here.y == 0 && plasma.as_top ) )
				{
					//console.log( "set point  %d,%d", mx, here.y );
					this_point
						= map[mx + here.y * width] 
						= ( map[here.x + here.y*width + here.z*widthHeight] 
						  + map[here.x2 + here.y*width + here.z*widthHeight] + center ) / 3
						    + area * del1 * scalar2;
					if( this_point > plasma.max_height )
						plasma.max_height = this_point;
					if( this_point < plasma.min_height )
						plasma.min_height = this_point;
				}
		        
				if( !( here.y2 == (height-1) && plasma.as_bottom ) )
				{
				//console.log( "set point  %d,%d", mx, here.y2 );
					this_point
						= map[mx + here.y2 * width + here.z*widthHeight] 
						= ( map[here.x + here.y2*width + here.z*widthHeight] 
						  + map[here.x2 + here.y2*width + here.z*widthHeight] + center ) / 3
						    + area * del2 * scalar2;
					if( this_point > plasma.max_height )
						plasma.max_height = this_point;
					if( this_point < plasma.min_height )
						plasma.min_height = this_point;
				}
				//else
					//console.log( "Skip point %d,%d  %g", here.y2, mx, map[mx + here.y2 * width] );
			}
			if( my != here.y )
			{
				var del1 = ( ( plasma.entropy.getBits( 13, false ) / ( 1 << 13 ) ) - 0.5 );
				var del2 = ( ( plasma.entropy.getBits( 13, false ) / ( 1 << 13 ) ) - 0.5 );
				var area = ( my - here.y ) * ( plasma.horiz_area_scalar );
		        
				if( !(here.skip&skip_left) && !( here.x == 0 && plasma.as_left ) )
				{
					this_point
						= map[here.x + my * width + here.z*widthHeight] 
						= ( map[here.x + here.y*width + here.z*widthHeight] 
						  + map[here.x + here.y2*width + here.z*widthHeight] + center ) / 3
						    + area * del1 * scalar2;
					//console.log( "set point  %d,%d", here.x, my );
					if( this_point > plasma.max_height )
						plasma.max_height = this_point;
					if( this_point < plasma.min_height )
						plasma.min_height = this_point;
				}
				if( !( here.x2 == (width-1) && plasma.as_right ) )
				{
					this_point
						= map[here.x2 + my * width + here.z*widthHeight] 
						= ( map[here.x2 + here.y*width + here.z*widthHeight] 
						  + map[here.x2 + here.y2*width + here.z*widthHeight] + center ) / 3
						    + area * del2 * scalar2;
					//console.log( "set point  %d,%d", here.x2, my );
					if( this_point > plasma.max_height )
						plasma.max_height = this_point;
					if( this_point < plasma.min_height )
						plasma.min_height = this_point;
				}
			}
			else
				console.log( "can't happen" );
		}
	}
	while( real_here = pdq_todo.shift() );


	console.log( "done..." );

}


function FeedRandom( patch ) { 
	return function( salt )
	{
		if( patch.seed_corner < 0 )
			salt.push( [patch.x, patch.y].join(",") ) 
		else
			salt.push( patch.corners[ patch.seed_corner ].toString() )

		//console.log( "Salt is:", patch.seed_corner, salt );
		patch.seed_corner++;
		if( patch.seed_corner > 3 )
			patch.seed_corner = 0;
	}
}

function PlasmaRender( plasma, seed )
{
	var next = grid();
	var width = plasma.plasma.width;
	var height = plasma.plasma.height;
	//var *map2 =  NewArray( var, width * plasma.height );
	if( !seed )
	{
		var ps = plasma.plasma;
		var x, y;
		for( x = 0; x < ps.map_width; x++ )
			for( y = 0; y < ps.map_height; y++ )
			{
				var here;
				if( here = ps.world_map[ ( x ) + ( y ) * ps.map_width] )
					PlasmaRender( here, here.corners );
			}
			return;
	}else {
		plasma.seed_corner = -1;   // first seed is patch corrdinate, then the corners
		plasma.corners[0] = seed[0];
		plasma.corners[1] = seed[1];
		plasma.corners[2] = seed[2];
		plasma.corners[3] = seed[3];
		plasma.corners[4] = seed[4];
		plasma.corners[5] = seed[5];
		plasma.corners[6] = seed[6];
		plasma.corners[7] = seed[7];
	}

	if( plasma.entopy_state )
	{
		//plasma.entopy_state = plasma.entropy.restore(plasma.entopy_state);
		//plasma.seed_corner = plasma.saved_seed_corner;
	}
	else
	{
		//plasma.entopy_state = plasma.entropy.save();
		//plasma.saved_seed_corner = plasma.seed_corner;
	}
	plasma.min_height = 0;
	plasma.max_height = 0;
	next.x = 0;
	next.y = 0;
	next.x2 = width - 1;
	next.y2 = height - 1;
	next.skip = next.skip&(skip_bottom|skip_right)

	if( !seed )
		seed = plasma.corners;

	if( !plasma.as_left && !plasma.as_top )
		plasma.map1[0 + 0 * width]                    = plasma.corners[0] = seed[0];

	if( !plasma.as_right && !plasma.as_top )
		plasma.map1[(width - 1) + 0 * width]          = plasma.corners[1] = seed[1];

	if( !plasma.as_left && !plasma.as_bottom )
		plasma.map1[0 + (height-1) * width]           = plasma.corners[2] = seed[2];

	if( !plasma.as_bottom && !plasma.as_right )
		plasma.map1[(width - 1) + (height-1) * width] = plasma.corners[3] = seed[3];

	if( !plasma.as_bottom && !plasma.as_above )
		plasma.map1[(width - 1) + (height-1) * width] = plasma.corners[4] = seed[4];

	if( !plasma.as_bottom && !plasma.as_below )
		plasma.map1[(width - 1) + (height-1) * width] = plasma.corners[5] = seed[5];

	{
		var n;
		plasma._min_height = 1;
		plasma._max_height = 0;
		plasma.min_height = 1;
		plasma.max_height = 0;
		
		for( n = 0; n < 4; n++ )
		{
			var this_point = plasma.corners[n];
			if( this_point > plasma.max_height )
				plasma._max_height
					= plasma.max_height 
					= this_point;
			if( this_point < plasma.min_height )
				plasma._min_height 
					= plasma.min_height
					= this_point;
		}
		
	}

	PlasmaFill2( plasma, plasma.map1, next );

}

function PlasmaCreatePatch( map, seed, roughness )
{
	var plasma = map.plasma_patch();
	next = grid();

	plasma.map1 = new Float32Array( map.width * map.height ) ;
	plasma.map =  new Float32Array( map.width * map.height );

	plasma.seed_corner = -1;   // first seed is patch corrdinate, then the corners

	plasma.area_scalar = roughness;
	plasma.horiz_area_scalar = roughness;
	plasma.entopy_state = null;
	plasma.corners[0] = seed[0];
	plasma.corners[1] = seed[1];
	plasma.corners[2] = seed[2];
	plasma.corners[3] = seed[3];
	{
		var n;
		plasma._min_height = 0;
		plasma._max_height = 1;
		plasma.min_height = 1;
		plasma.max_height = 0;
		/*
		for( n = 0; n < 4; n++ )
		{
			var this_point = plasma.corners[n];
			if( this_point > plasma.max_height )
				plasma._max_height
					= plasma.max_height 
					= this_point;
			if( this_point < plasma.min_height )
				plasma._min_height 
					= plasma.min_height
					= this_point;
		}
		*/
	}

	plasma.entropy = SRG( FeedRandom( plasma ) );


	//if( initial_render )
	//	PlasmaRender( plasma, plasma.corners );

	return plasma;
}

function PlasmaCreateEx(  seed,  roughness, width, height, depth, initial_render )
{
	var plasma = plasma_state( width, height, depth );
	var patch;

	plasma.read_map =  new Float32Array( plasma.width * plasma.height );

	patch = PlasmaCreatePatch( plasma, seed, roughness );

	PlasmaRender( patch, patch.corners );
	plasma.world_map = [patch];

	plasma.clip.top = patch.max_height;
	plasma.clip.bottom = patch.min_height;

	plasma.world_height_map = PlasmaReadSurface( patch, 0, 0, 0, 1 );

	// don't release read_map;
	//Release( patch.map1 );
	//Release( patch.map );
	//Release( patch );

	plasma.map_height = 20;
	plasma.map_width = 20;
	plasma.width = width;
	plasma.height = height;
	// make a new read map, the first is actually world_height_map for corner seeds.
	plasma.read_map =  new Array( plasma.width * plasma.height );

	plasma.world_map = new Array( plasma.map_height * plasma.map_width );
	{
		var map_seed = [ plasma.world_height_map[plasma.map_height>>1 * plasma.map_width + plasma.map_width>>1],
			 plasma.world_height_map[plasma.map_height>>1 * plasma.map_width + (1+plasma.map_width>>1)],
			 plasma.world_height_map[(1+plasma.map_height>>1) * plasma.map_width + plasma.map_width>>1],
			 plasma.world_height_map[(1+plasma.map_height>>1) * plasma.map_width + (1+plasma.map_width>>1)]]
		patch = PlasmaCreatePatch( plasma, map_seed, roughness );
	}

	plasma.root_x = plasma.map_height>>1;
	plasma.root_y = plasma.map_width>>1;
	patch.x = 0;
	patch.y = 0;

	plasma.world_map[ ( plasma.root_x + patch.x ) + ( plasma.root_y + patch.y ) * plasma.map_width ] = patch;

	//if( initial_render )
	{
		PlasmaRender( patch, patch.corners );
		plasma.clip.top = patch.max_height;
		plasma.clip.bottom = patch.min_height;
	}

	return plasma;
}

function PlasmaCreate( seed, roughness, width, height )
{
	return PlasmaCreateEx( seed, roughness, width, height, true );
}

function GetMapCoord( plasma, x, y )
{
	if( ( plasma.root_x + x ) < 0 ) 
		return null;
	if( ( plasma.root_y + y ) < 0 ) 
		return null;
	if( ( plasma.root_x + x ) >= plasma.map_width ) 
		return null;
	if( ( plasma.root_y + y ) >= plasma.map_height ) 
		return null;
	return 	plasma.world_map[ ( plasma.root_x + x ) + ( plasma.root_y + y ) * plasma.map_width ];

}

function  SetMapCoord( plasma, patch )
{
	var old_patch;
	plasma.world_map[ ( plasma.root_x + patch.x ) + ( plasma.root_y + patch.y ) * plasma.map_width ] = patch;
	if( old_patch = GetMapCoord( plasma, patch.x-1, patch.y ) )
	{
		console.log( "%d,%d is right of %d,%d", patch.x, patch.y, old_patch.x, old_patch.y );
		patch.as_left = old_patch;
		old_patch.as_right = patch;
	}

	if( old_patch = GetMapCoord( plasma, patch.x+1, patch.y ) )
	{
		console.log( "%d,%d is left of %d,%d", patch.x, patch.y, old_patch.x, old_patch.y );
		patch.as_right = old_patch;
		old_patch.as_left= patch;
	}

	// old patch is (on top of patch if +1 )
	if( old_patch = GetMapCoord( plasma, patch.x, patch.y+1 ) )
	{
		console.log( "%d,%d is below %d,%d", patch.x, patch.y, old_patch.x, old_patch.y );
		patch.as_top = old_patch;
		old_patch.as_bottom = patch;
	}

	if( old_patch = GetMapCoord( plasma, patch.x, patch.y-1 ) )
	{
		console.log( "%d,%d is above %d,%d", patch.x, patch.y, old_patch.x, old_patch.y );
		patch.as_bottom = old_patch;
		old_patch.as_top = patch;
	}

	{
		var width = plasma.width;
		var height = plasma.height;
		var n;
		if( old_patch = patch.as_left )
		{
			console.log( "patch has a left..." );
			for( n = 0; n < height; n++ )
				patch.map1[ 0 + n * width ] = old_patch.map1[ (width-1) + n * width ];
		}
		if( old_patch = patch.as_top )
		{
			console.log( "patch has a top..." );
			for( n = 0; n < width; n++ )
				patch.map1[ n + 0 * width ] = old_patch.map1[ n + (height-1) * width ];
		}

		if( old_patch = patch.as_right )
		{
			console.log( "patch has a right..." );
			for( n = 0; n < height; n++ )
				patch.map1[ (width-1) + n * width ] = old_patch.map1[ 0 + n * width ];
		}

		if( old_patch = patch.as_bottom )
		{
			console.log( "patch has bottom... (%d,%d) above(%d,%d)", patch.x, patch.y, old_patch.x, old_patch.y );
			for( n = 0; n < width; n++ )
				patch.map1[ n + (height-1) * width ] = old_patch.map1[ n + 0 * width ];
		}
	}
}

function PlasmaExtend( plasma,  in_direction,  seed, roughness )
{
	var new_plasma;
	var new_seed = [,,,];//[4];
	switch( in_direction )
	{
	case 0: // to the right
		if( plasma.as_right )
			return plasma.as_right;
		new_seed[0] = plasma.corners[1];
		new_seed[1] = plasma.plasma.world_height_map[ ( plasma.x + plasma.plasma.root_x + 1 ) + (plasma.y + plasma.plasma.root_y) * plasma.plasma.map_width ];
		new_seed[2] = plasma.corners[3];
		new_seed[3] = plasma.plasma.world_height_map[ ( plasma.x + plasma.plasma.root_x + 1 ) + (plasma.y + plasma.plasma.root_y + 1) * plasma.plasma.map_width ];
		break;
	case 1: // to the bottom
		if( plasma.as_bottom )
			return plasma.as_bottom;
		new_seed[0] = plasma.corners[2];
		new_seed[1] = plasma.corners[3];
		new_seed[2] = plasma.plasma.world_height_map[ ( plasma.x + plasma.plasma.root_x ) + (plasma.y + plasma.plasma.root_y + 1) * plasma.plasma.map_width ];
		new_seed[3] = plasma.plasma.world_height_map[ ( plasma.x + plasma.plasma.root_x + 1 ) + (plasma.y + plasma.plasma.root_y + 1) * plasma.plasma.map_width ];
		break;
	case 2: // to the left
		if( plasma.as_left )
			return plasma.as_left;
		new_seed[0] = plasma.plasma.world_height_map[ ( plasma.x + plasma.plasma.root_x - 1) + (plasma.y + plasma.plasma.root_y) * plasma.plasma.map_width ];
		new_seed[1] = plasma.corners[0];
		new_seed[2] = plasma.plasma.world_height_map[ ( plasma.x + plasma.plasma.root_x - 1) + (plasma.y + plasma.plasma.root_y + 1) * plasma.plasma.map_width ];
		new_seed[3] = plasma.corners[2];
		break;
	case 3: // to the top
		if( plasma.as_top )
			return plasma.as_top;
		new_seed[0] = plasma.plasma.world_height_map[ ( plasma.x + plasma.plasma.root_x ) + (plasma.y + plasma.plasma.root_y-1) * plasma.plasma.map_width ];
		new_seed[1] = plasma.plasma.world_height_map[ ( plasma.x + plasma.plasma.root_x + 1 ) + (plasma.y + plasma.plasma.root_y-1) * plasma.plasma.map_width ];
		new_seed[2] = plasma.corners[0];
		new_seed[3] = plasma.corners[1];
		break;
	}

	new_plasma = PlasmaCreatePatch( plasma.plasma, new_seed, roughness );

	switch( in_direction )
	{
	case 0: // to the right
		new_plasma.x = plasma.x + 1;
		new_plasma.y = plasma.y;
		break;
	case 1: // to the bottom
		new_plasma.x = plasma.x;
		new_plasma.y = plasma.y - 1;
		break;
	case 2: // to the left
		new_plasma.x = plasma.x - 1;
		new_plasma.y = plasma.y;
		break;
	case 3: // to the top
		new_plasma.x = plasma.x;
		new_plasma.y = plasma.y + 1;
		break;
	}
	console.log( "Create plasma at %d,%d", new_plasma.x, new_plasma.y );
	// overwrites the corners...
	SetMapCoord( plasma.plasma, new_plasma );

	{
		var width = plasma.plasma.width;
		var height = plasma.plasma.height;
		if( new_plasma.as_top || new_plasma.as_left )
			new_plasma.corners[0] = new_plasma.map1[0 + 0 * width];
		if( new_plasma.as_top || new_plasma.as_right )
			new_plasma.corners[1] = new_plasma.map1[(width - 1) + 0 * width];
		if( new_plasma.as_bottom || new_plasma.as_left )
			new_plasma.corners[2] = new_plasma.map1[0 + (height-1) * width];
		if( new_plasma.as_bottom || new_plasma.as_right )
			new_plasma.corners[3] = new_plasma.map1[(width - 1) + (height-1) * width];
	}

	PlasmaRender( new_plasma, new_plasma.corners );

	return new_plasma;
}


function PlasmaGetSurface( plasma )
{
	return plasma.map;
}

function GetMapData( patch,  x, y, smoothing, force_scaling )
{
		var input = patch.map1[ x + y * patch.plasma.width ];
		var top = patch.plasma.clip.top;// patch._max_height;
		var bottom = patch.plasma.clip.bottom; // patch._min_height;
		//console.log( "patch %p (%d,%d) = %g", patch, x, y, input );
		if( force_scaling /*( patch.min_height < patch._min_height || patch.max_height > patch._max_height )*/ )
		{
			var tries = 0;
			var updated;
			do
				{
					tries++;
					if( tries > 5 )
					{
						//console.log( "capping oscillation at 20" );
						break;
					}
					updated  = false;
					if( input > top )
					{
						// 
						input = top - ( input - top );
						updated = true;
					}
					else if( input < bottom )
					{
						input = bottom - ( input - bottom );
						updated = true;
					}
				}
				while( updated );
				input = ( input - bottom ) / ( top - bottom );
				if( smoothing == 0 )
				{
				// need to specify a copy mode.
					return input;
					//sin( /*map2[index] * */( map_from[0] - patch.min_height ) / divider * 3.14159/2 /*+ map2[index] * 3.14159/2*/ );
					//( 1 + sin( /*map2[index] * */( map_from[0] - patch.min_height ) / divider * 3.14159 - 3.14159/2 /*+ map2[index] * 3.14159/2*/ ) ) / 2;
				}

				else if( smoothing == 1 )
				{
					// smooth top and bottom across sin curve, middle span is 1:1 ...
					return
						( 1 + sin( input * 3.14159 - 3.14159/2 ) ) / 2;
				}

				if( smoothing == 3 )  // bad mode ... needs work
				{
				// peaker tops and bottoms smoother middle, middle span ...
				return 
					( 1 + tan( ( ( input ) + 0.5 ) * ( 3.14159 * 0.5 ) + (3.14159/2) ) ) /2;
				}

				if( smoothing == 4 ) // use square furnction, parabolic... cubic... qudric?
				// peaker tops and bottoms smoother middle, middle span is 1:1 ...
				{
					var tmp = input - 0.5;
					if( tmp < 0 )
						return ( 0.5 + ( 2 * tmp * tmp ) );
					else
						return 	0.5 -( 2 * tmp * tmp );
				}
				//*/
				//console.log( "%g = %g %g", patch.map[index], patch.map1[index], map2[index] );
		}
		else
		{
			var divider = ( patch.max_height - patch.min_height );
			{
				// need to specify a copy mode.
				if( false )
					return ( input - patch.min_height ) / divider;
				else 
					return ( Math.sin( input/100 ) + 1 ) / 2;
					//( 1 + sin( /*map2[index] * */( map_from[0] - patch.min_height ) / divider * 3.14159 - 3.14159/2 /*+ map2[index] * 3.14159/2*/ ) ) / 2;

				/*
				// smooth top and bottom across sin curve, middle span is 1:1 ...
				map[0] = 
					( 1 + sin( ( map_from[0] - patch.min_height ) / divider * 3.14159 - 3.14159/2 ) ) / 2;
				*/
				///*
				// peaker tops and bottoms smoother middle, middle span ...
				//map[0] = 
				//	( 1 + tan( ( ( ( map_from[0] - patch.min_height ) / divider ) + 0.5 ) * ( 3.14159 * 0.5 ) + (3.14159/2) ) ) /2;
				// peaker tops and bottoms smoother middle, middle span is 1:1 ...
				if( 0 )
				{
					var tmp = ( input - patch.min_height ) / divider - 0.5;
					if( tmp < 0 )
						return ( 0.5 + ( 2 * tmp * tmp ) );
					else
						return 0.5 -( 2 * tmp * tmp );
				}
			}
		}
		return 0;
}


function PlasmaReadSurface( plasma, x, y, z, smoothing,  force_scaling )
{
	var first_patch;
	var last_patch;
	var patch;
	var plasma = patch_root.plasma;

	var del_x = (x < 0 ? - (plasma.width-1) : (0))|0;
	var del_y = (y < 0 ? - (plasma.height-1) : (0))|0;
	var sec_x = ((x +del_x) / plasma.width)|0;
	var sec_y = (-(y +del_y) / plasma.height)|0;

	var ofs_x = (x) % plasma.width;
	var ofs_y = (y) % plasma.height;
	var out_x, out_y;
	console.log( "start at %d,%d  offset in first: %d,%d  sec: %d,%d", x, y, ofs_x, ofs_y, sec_x, sec_y );

	first_patch
		= patch 
		= GetMapCoord( plasma, sec_x, sec_y );
	
	if( !first_patch )
	{
		do
		{
			var n, m;
			patch = patch_root;
			while( sec_x < patch.x )
			{
				var seed = [0.5,0.5];
				patch = PlasmaExtend( patch, 2, seed, patch_root.area_scalar );
			}
			while( sec_y < patch.y )
			{
				var seed = [0.5,0.5];
				patch = PlasmaExtend( patch, 1, seed, patch_root.area_scalar );
			}
			while( sec_x > patch.x )
			{
				var seed = [0.5,0.5];
				patch = PlasmaExtend( patch, 0, seed, patch_root.area_scalar );
			}
			while( sec_y > patch.y )
			{
				var seed = [0.5,0.5];
				patch = PlasmaExtend( patch, 3, seed, patch_root.area_scalar );
			}
			patch = GetMapCoord( plasma, sec_x, sec_y );
			if( !patch )
			{
				console.log( "Failed to get the patch... ", sec_x, sec_y );
				return null;
			}
		}
		while( !( patch = GetMapCoord( plasma, sec_x, sec_y ) ) );
		first_patch = patch;
	}

	//console.log( "patch is %d,%d", patch.x, patch.y ) ;
console.log( "Max/min:", patch.max_height, patch.min_height );

	if( patch )
	for( out_x = ofs_x; out_x < plasma.width; out_x++ )
		for( out_y = ofs_y; out_y < plasma.height; out_y++ )
		{
			plasma.read_map[ ( out_x - ofs_x ) + ( out_y - ofs_y ) * plasma.width] 
				= GetMapData( patch, out_x, out_y, smoothing, force_scaling );
		}
	if( ofs_x && ( ( plasma.root_x + sec_x + 1 ) < plasma.map_width ) )
	{
		patch = GetMapCoord( plasma, sec_x + 1, sec_y );
		if( !patch )
		{
			var seed = [0.5,0.5];
			patch = PlasmaExtend( first_patch, 0, seed, first_patch.area_scalar );
		}
		//console.log( "patch is %d,%d", patch.x, patch.y ) ;
		if( patch )
		for( out_x = 0; out_x < ofs_x; out_x++ )
			for( out_y = ofs_y; out_y < plasma.height; out_y++ )
			{
				plasma.read_map[ ( out_x + ( plasma.width - ofs_x ) ) + ( out_y - ofs_y ) * plasma.width] 
					= GetMapData( patch, out_x, out_y, smoothing, force_scaling );
			}
	}
	if( ( plasma.root_y + sec_y - 1 ) >= 0 )
	{
		patch = GetMapCoord( plasma, sec_x, sec_y - 1 );
		if( !patch )
		{
			var seed = [0.5,0.5];
			patch = PlasmaExtend( first_patch, 1, seed, first_patch.area_scalar );
		}
		//console.log( "patch is %d,%d", patch.x, patch.y ) ;
		if( patch )
		for( out_x = ofs_x; out_x < plasma.width; out_x++ )
			for( out_y = 0; out_y < ofs_y; out_y++ )
			{
				plasma.read_map[ ( out_x - ofs_x ) + ( out_y + ( plasma.height - ofs_y ) ) * plasma.width] 
					= GetMapData( patch, out_x, out_y, smoothing, force_scaling );
			}
	}
	last_patch = patch;
	if( ( ( plasma.root_x + sec_x + 1 ) < plasma.map_width ) && ( ( plasma.root_y + sec_y - 1 ) >= 0 ) )
	{
		patch = GetMapCoord( plasma, sec_x + 1, sec_y - 1 );
		if( !patch )
		{
			var seed = [0.5,0.5];
			patch = PlasmaExtend( last_patch, 0, seed, first_patch.area_scalar );
		}
		//console.log( "patch is %d,%d", patch.x, patch.y ) ;
		if( patch )
		for( out_x = 0; out_x < ofs_x; out_x++ )
			for( out_y = 0; out_y < ofs_y; out_y++ )
			{
				plasma.read_map[ ( out_x + ( plasma.width - ofs_x ) ) + ( out_y + ( plasma.height - ofs_y ) ) * plasma.width] 
					= GetMapData( patch, out_x, out_y, smoothing, force_scaling );
			}
	}
	return plasma.read_map;
}

function  PlasmaSetRoughness( plasma,  roughness, horiz_rough )
{
	plasma.area_scalar = roughness;
	plasma.horiz_area_scalar = roughness * horiz_rough;
}

function  PlasmaSetGlobalRoughness(plasma, roughness, horiz_rough )
{
	console.log( "Set Roughness:", roughness, horiz_rough );
	var state = plasma.plasma;
	var  x, y;
	var here = state.world_map;
	var n = 0;

	for( y = 0; y < state.map_height; y++ )
		for( x = 0; x < state.map_width; x++ )
		{
			if( here[n] )
			{
				here[n].area_scalar = horiz_rough;
				here[n].horiz_area_scalar = roughness;
			}
			n++;
		}
}


function PlasmaGetMap( plasma )
{
	return plasma.plasma;
}

function  PlasmaSetMasterMap(  plasma, master_map, width, height )
{

}


function PlasmaWorldSeedGenerator() {
	var seedGen = { 
		
	}
}