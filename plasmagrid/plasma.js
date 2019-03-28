
//throw new Error( "THIS IS DAMANGED AND DOES NOT WORK; restructured with plasma3d" );

var SRG = exports.SaltyRNG;
//var SRG = require( "../org.d3x0r.common/salty_random_generator.js" ).SaltyRNG;
//var generator = SRG( FeedRandom(patch) )

//});

const skip_left = 1;
		const  skip_top = 2;
		const  skip_right = 4;
		const  skip_bottom = 8;

const scalar1 = 5;
const scalar2 = 5;

function grid () { 
	var gr =  {
		x :0 , y:0, x2:0, y2:0, skip : 0,
		clone:function(){ var g = grid(); g.x=gr.x;g.y=gr.y;g.x2=gr.x2;g.y2=gr.y2;g.skip=gr.skip;return g }
	};
	return gr ;
}

function plasma_patch( map ) {
	var patch = {
		// where I am.
		x : 0, y: 0,
		corners:[0,0,0,0],
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

function plasma_state( w, h ) {
var map = {
	 stride : 0, rows :0,
	 map_width : w, map_height : h,
	 root_x : 0, root_y : 0, // where 0, 0 is...
	world_map : null,
	world_height_map :null,
	clip : { top:0,left:0,bottom:0,right:0 },

	plasma_patch : ()=>{ return plasma_patch( map ) }
};
return map;
}

function PlasmaFill2( plasma, map, here )
{

	var pdq_todo = {
		first : null,
		last : null,
		push(n) {
			if( !this.first )
				this.last = this.first = { node:n, next:null };
			else
				this.last = ( this.last.next = { node:n, next:null } );
		},
		shift() {
			if( this.first ) {
				var out = this.first;
				this.first = this.first.next;
				return out.node;
			} 
			return null;
		},
	};

	var mx, my;
	var real_here;
	var next = grid();
	var del;
	var center;
	var this_point;
	var stride = plasma.plasma.stride;
	var rows = plasma.plasma.rows;
	real_here = here.clone();
	//MemCpy( &real_here, here, sizeof( struct grid ) );

	function mid(a,b) { return ((((a)+(b))|0)/2|0) }
	var start = Date.now();
	do
	{
		here = real_here;
		//console.log( "here:", here );
		mx = mid( here.x2, here.x );
		my = mid( here.y2, here.y );

		// may be a pinched rectangle... 3x2 that just has 2 mids top bottom to fill no center
		//console.log( "center %d,%d  next is %d,%d %d,%d", mx, my, here.x, here.y, here.x2, here.y2 );
		if( ( mx != here.x ) && ( my != here.y ) )
		{
			var del1 = ( ( plasma.entropy.getBits( 13, false ) / ( 1 << 13 ) ) - 0.5 );

			var area = ( Math.sqrt( ( ( here.x2 - here.x )*( here.x2 - here.x ) + ( here.y2 - here.y )*( here.y2 - here.y )) ) * ( plasma.area_scalar ) );
			var avg = ( map[here.x + here.y*stride] + map[here.x2 + here.y*stride]
				  + map[here.x + here.y2*stride] + map[here.x2 + here.y2*stride] ) / 4;
			//avg += ( map[here.x + my*stride] + map[here.x2 + my*stride]
			//				 + map[mx + here.y*stride] + map[mx + here.y2*stride] ) / 4;
			//avg /= 2;
			//console.log( "Set point %d,%d = %g (%g) %g", mx, my, map[mx + my * stride], avg );
			var newval = map[mx + my * stride] = avg + ( area *  del1 ) * scalar1;
			//if( newval > 1.0 )
			//	newval = 1.0 - newval;
			//else if( newval < -1.0 )
			//	newval = -1.0 - newval;
			center 
				= this_point
				= newval;

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
				var newval = ( map[here.x + here.y*stride] + map[here.x2 + here.y*stride] ) / 2
						+ area * del1 * scalar2;

				//console.log( "set point  %d,%d", mx, here.y );
				this_point = map[mx + here.y * stride] = newval;
				if( this_point > plasma.max_height )
					plasma.max_height = this_point;
				if( this_point < plasma.min_height )
					plasma.min_height = this_point;
			}

			if( !( here.y2 == (rows-1) && plasma.as_bottom ) )
			{
			//console.log( "set point  %d,%d", mx, here.y2 );
				var newval = ( map[here.x + here.y2*stride] + map[here.x2 + here.y2*stride] ) / 2
						+ area * del2 * scalar2;
				this_point
					= map[mx + here.y2 * stride] = newval;
				if( this_point > plasma.max_height )
					plasma.max_height = this_point;
				if( this_point < plasma.min_height )
					plasma.min_height = this_point;
			}
			//else
				//console.log( "Skip point %d,%d  %g", here.y2, mx, map[mx + here.y2 * stride] );
		}
		if( my != here.y )
		{
			var del1 = ( ( plasma.entropy.getBits( 13, false ) / ( 1 << 13 ) ) - 0.5 );
			var del2 = ( ( plasma.entropy.getBits( 13, false ) / ( 1 << 13 ) ) - 0.5 );
			var area = ( my - here.y ) * ( plasma.horiz_area_scalar );

			if( !(here.skip&skip_left) && !( here.x == 0 && plasma.as_left ) )
			{
			 	var newval = ( map[here.x + here.y*stride] + map[here.x + here.y2*stride] ) / 2
					+ area * del1 * scalar2;

				this_point = map[here.x + my * stride] = newval;
				//console.log( "set point  %d,%d", here.x, my );
				if( this_point > plasma.max_height )
					plasma.max_height = this_point;
				if( this_point < plasma.min_height )
					plasma.min_height = this_point;
			}
			if( !( here.x2 == (stride-1) && plasma.as_right ) )
			{
			 	var newval = ( map[here.x + here.y*stride] + map[here.x + here.y2*stride] ) / 2
					+ area * del2 * scalar2;
				this_point
					= map[here.x2 + my * stride] = newval;
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
	while( real_here = pdq_todo.shift() );


	console.log( "done...", Date.now() - start );

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
	var stride = plasma.plasma.stride;
	var rows = plasma.plasma.rows;
	//var *map2 =  NewArray( var, stride * plasma.rows );
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
	next.x2 = stride - 1;
	next.y2 = rows - 1;
	next.skip = next.skip&(skip_bottom|skip_right)

	if( !seed )
		seed = plasma.corners;

	if( !plasma.as_left && !plasma.as_top )
		plasma.map1[0 + 0 * stride]                    = plasma.corners[0] = seed[0];

	if( !plasma.as_right && !plasma.as_top )
		plasma.map1[(stride - 1) + 0 * stride]          = plasma.corners[1] = seed[1];

	if( !plasma.as_left && !plasma.as_bottom )
		plasma.map1[0 + (rows-1) * stride]           = plasma.corners[2] = seed[2];

	if( !plasma.as_bottom && !plasma.as_right )
		plasma.map1[(stride - 1) + (rows-1) * stride] = plasma.corners[3] = seed[3];

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

	plasma.map1 = new Float32Array( map.stride * map.rows ) ;
	plasma.map =  new Float32Array( map.stride * map.rows );

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

function PlasmaCreateEx(  seed,  roughness, width, height, initial_render )
{
	var plasma = plasma_state( width, height );
	var patch;


	plasma.root_x = 0;
	plasma.root_y = 0;
	plasma.stride = plasma.map_width;
	plasma.rows = plasma.map_height;
	patch = PlasmaCreatePatch( plasma, seed, roughness );
	PlasmaRender( patch, patch.corners );
	plasma.world_map = [patch];
	plasma.map_width = 1;
	plasma.map_height = 1;
	plasma.clip.top = patch.max_height;
	plasma.clip.bottom = patch.min_height;
	plasma.world_height_map = PlasmaReadSurface( patch, 0, 0, 20, 20, 0, 1 );

	plasma.map_height = 20;
	plasma.map_width = 20;
	plasma.stride = width;
	plasma.rows = height;
	// make a new read map, the first is actually world_height_map for corner seeds.

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

	return patch;
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
		var stride = plasma.stride;
		var rows = plasma.rows;
		var n;
		if( old_patch = patch.as_left )
		{
			console.log( "patch has a left..." );
			for( n = 0; n < rows; n++ )
				patch.map1[ 0 + n * stride ] = old_patch.map1[ (stride-1) + n * stride ];
		}
		if( old_patch = patch.as_top )
		{
			console.log( "patch has a top..." );
			for( n = 0; n < stride; n++ )
				patch.map1[ n + 0 * stride ] = old_patch.map1[ n + (rows-1) * stride ];
		}

		if( old_patch = patch.as_right )
		{
			console.log( "patch has a right..." );
			for( n = 0; n < rows; n++ )
				patch.map1[ (stride-1) + n * stride ] = old_patch.map1[ 0 + n * stride ];
		}

		if( old_patch = patch.as_bottom )
		{
			console.log( "patch has bottom... (%d,%d) above(%d,%d)", patch.x, patch.y, old_patch.x, old_patch.y );
			for( n = 0; n < stride; n++ )
				patch.map1[ n + (rows-1) * stride ] = old_patch.map1[ n + 0 * stride ];
		}
	}
}

function PlasmaExtend( plasma,  in_direction,  seed, roughness )
{
	var new_plasma;
	var new_seed = [,,,];//[4];
	if( plasma )
	switch( in_direction )
	{
	case 0: // to the right
		if( plasma && plasma.as_right )
			return plasma.as_right;
		new_seed[0] = plasma.corners[1];
		new_seed[1] = plasma.plasma.world_height_map[ ( plasma.x + plasma.plasma.root_x + 1 ) + (plasma.y + plasma.plasma.root_y) * plasma.plasma.map_width ];
		new_seed[2] = plasma.corners[3];
		new_seed[3] = plasma.plasma.world_height_map[ ( plasma.x + plasma.plasma.root_x + 1 ) + (plasma.y + plasma.plasma.root_y + 1) * plasma.plasma.map_width ];
		break;
	case 1: // to the bottom
		if( plasma && plasma.as_bottom )
			return plasma.as_bottom;
		new_seed[0] = plasma.corners[2];
		new_seed[1] = plasma.corners[3];
		new_seed[2] = plasma.plasma.world_height_map[ ( plasma.x + plasma.plasma.root_x ) + (plasma.y + plasma.plasma.root_y + 1) * plasma.plasma.map_width ];
		new_seed[3] = plasma.plasma.world_height_map[ ( plasma.x + plasma.plasma.root_x + 1 ) + (plasma.y + plasma.plasma.root_y + 1) * plasma.plasma.map_width ];
		break;
	case 2: // to the left
		if( plasma && plasma.as_left )
			return plasma.as_left;
		new_seed[0] = plasma.plasma.world_height_map[ ( plasma.x + plasma.plasma.root_x - 1) + (plasma.y + plasma.plasma.root_y) * plasma.plasma.map_width ];
		new_seed[1] = plasma.corners[0];
		new_seed[2] = plasma.plasma.world_height_map[ ( plasma.x + plasma.plasma.root_x - 1) + (plasma.y + plasma.plasma.root_y + 1) * plasma.plasma.map_width ];
		new_seed[3] = plasma.corners[2];
		break;
	case 3: // to the top
		if( plasma && plasma.as_top )
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
		var stride = plasma.plasma.stride;
		var rows = plasma.plasma.rows;
		if( new_plasma.as_top || new_plasma.as_left )
			new_plasma.corners[0] = new_plasma.map1[0 + 0 * stride];
		if( new_plasma.as_top || new_plasma.as_right )
			new_plasma.corners[1] = new_plasma.map1[(stride - 1) + 0 * stride];
		if( new_plasma.as_bottom || new_plasma.as_left )
			new_plasma.corners[2] = new_plasma.map1[0 + (rows-1) * stride];
		if( new_plasma.as_bottom || new_plasma.as_right )
			new_plasma.corners[3] = new_plasma.map1[(stride - 1) + (rows-1) * stride];
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
		var input = patch.map1[ x + y * patch.plasma.stride ];
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


function PlasmaReadSurface( patch_root,  x, y,  w, h, smoothing,  force_scaling )
{
	var first_patch;
	var last_patch;
	var patch;
	var plasma = patch_root.plasma;

	var sec_x;
	var sec_y;
	var destsec_x;
	var destsec_y;

	var ofs_x;
	var ofs_y;
	var destofs_x;
	var destofs_y;

	if( x < 0 ) {
		sec_x = ((x - (plasma.stride-1)) / plasma.stride)|0;
		ofs_x = plasma.stride - ( -x % plasma.stride );
	}else {
		sec_x = (x / plasma.stride)|0;
		ofs_x = ( x % plasma.stride );
	}
	if( y < 0 ) {
		sec_y = ((y - (plasma.rows-1)) / plasma.rows)|0;
		ofs_y = plasma.rows - ( -y % plasma.rows );
	}else {
		sec_y = (y / plasma.rows)|0;
		ofs_y = ( y % plasma.rows );
	}

	if( (x+w) < 0 ) {
		destsec_x = (((x+w) - (plasma.stride-1)) / plasma.stride)|0;
		destofs_x = plasma.stride - ( -(x+w) % plasma.stride );
	}else {
		destsec_x = ((x+w) / plasma.stride)|0;
		destofs_x = ( (x+w) % plasma.stride );
	}
	if( (y+h) < 0 ) {
		destsec_y = (((y+h) - (plasma.rows-1)) / plasma.rows)|0;
		destofs_y = plasma.rows - ( -(y+h) % plasma.rows );
	}else {
		destsec_y = ((y+h) / plasma.rows)|0;
		destofs_y = ( (y+h) % plasma.rows );
	}


	var out_x, out_y;

	console.log( "start at %d,%d  offset in first: %d,%d  sec: %d,%d", x, y, ofs_x, ofs_y, sec_x, sec_y );

	first_patch = patch = GetMapCoord( plasma, sec_x, sec_y );
	
	if( !first_patch )
	{
		var n, m;
		patch = patch_root;
		while( sec_x < patch.x )
		{
			var seed = [0.5,0.5];
			patch = PlasmaExtend( patch, 2, seed, patch_root.area_scalar );
		}
		while( sec_x > patch.x )
		{
			var seed = [0.5,0.5];
			patch = PlasmaExtend( patch, 0, seed, patch_root.area_scalar );
		}
		while( sec_y < patch.y )
		{
			var seed = [0.5,0.5];
			patch = PlasmaExtend( patch, 1, seed, patch_root.area_scalar );
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
		first_patch = patch;
	}
	
	patch = first_patch;
	for( out_x = sec_x; out_x <= destsec_x; out_x++ ) {
		var colPatch = GetMapCoord( plasma, out_x, sec_y );
		if( !colPatch )
			colPatch = PlasmaExtend( patch, 1, seed, patch_root.area_scalar );
		
		var fromPlasma = colPatch;
		for( out_y = sec_y; out_y <= destsec_y; out_y++ ) {
			var rowPatch;
			rowPatch = GetMapCoord( plasma, out_x, out_y );
			if( !rowPatch )
				rowPatch = PlasmaExtend( fromPlasma, 1, seed, patch_root.area_scalar );
			fromPlasma = rowPatch;
		}
	}
	

	//console.log( "patch is %d,%d", patch.x, patch.y ) ;
console.log( "Max/min:", patch.max_height, patch.min_height );
	var read_map =  new Array( w * h );

	if( patch )
		for( out_x = ofs_x; out_x < plasma.stride; out_x++ )
			for( out_y = ofs_y; out_y < plasma.rows; out_y++ )
			{
				read_map[ ( out_x - ofs_x ) + ( out_y - ofs_y ) * w] 
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
			for( out_y = ofs_y; out_y < plasma.rows; out_y++ )
			{
				read_map[ ( out_x + ( plasma.stride - ofs_x ) ) + ( out_y - ofs_y ) * w] 
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
		for( out_x = ofs_x; out_x < plasma.stride; out_x++ )
			for( out_y = 0; out_y < ofs_y; out_y++ )
			{
				read_map[ ( out_x - ofs_x ) + ( out_y + ( plasma.rows - ofs_y ) ) * w] 
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
				read_map[ ( out_x + ( plasma.stride - ofs_x ) ) + ( out_y + ( plasma.rows - ofs_y ) ) * w] 
					= GetMapData( patch, out_x, out_y, smoothing, force_scaling );
			}
	}
	return read_map;
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
