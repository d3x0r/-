
import * as THREE  from "./three.js/build/three.module.js"

import {lnQuat} from "./lnQuatSq.js"


class ballPatch {
	geometry = THREE.BufferGeometry();
	constructor() {
		
	}
}


class ball {
	patches = [];
	dataGrid = null;
	segs = 0;
	constructor( LOD ) {
		this.segs = LOD;
		const x = new ballPatch();

		dataGrid = new Float64Array( (LOD *2 + 3 ) * ( 6  *(n+1)) );		
	}

	getLatLength( lat ) {
		if( lat < (this.size+1 ) ) {
			if( !lat ) return 1;
			return lat * 6;
		} else if( lat <= (this.size+1)*2 ) {
			return ( this.size+1)*6;
		} else {
			const lat = ( ( lat - (this.size+1) * 2 ) ) + 1;
			if( !lat ) return 1;
			return lat*6;
		}
	}

	getHeight( lat, long ) {
		/*
		const wraps = ( lat / ((this.size*2)+3) ) | 0;
		if( wraps & 1 ) {
			long = -long;

		}
		*/
		if( lat / ((this.size*2)+3) )

		if( lat < (this.size+1 ) ) {
			const y = lat;
			const x = long;
			// 0->
		} else if( lat <= (this.size+1)*2 ) {
		
		} else {
			const y = ((size+1) - lat - (this.size+1)*2);
			const x = (this.size+1)*6 - long;
		}
	}

	setLOD( LOD ) {
		this.segs = LOD;
		dataGrid = new Float64Array( (LOD *2 + 3 ) * ( 6  *(n+1)) );

	}
}


// divisions...
//#define HEX_SIZE l.hex_count

// equitoral circumferance
//
// 24,901.55 miles (40,075.16 kilometers).
// 131480184 ft
// 40075160 m
//  6378159.7555797717226664788383706m radius
//
// right now 640 is the hex scale, would take
// 31308.71875 hexes to span the earth

// 111319.88888888888888888888888889   m per degree
// 1739.3732638888888888888888888889 m per 64th of a full hex/degree


// kilometer scale... 1:1m
//#define PLANET_CIRCUM ((6378*6.28318)*(1000.0))
// kilometer scale... 1:1km
#define PLANET_CIRCUM (45*6.28318) //*(1000.0))
// 10 kilometer scale  1:10km
//#define PLANET_CIRCUM (637.8*6.28318) //*(1000.0))
//#define PLANET_CIRCUM ((40075.16)*(1000.0))

#define PLANET_M_PER_ ((PLANET_CIRCUM)/(6.0))


#define PLANET_M_PER_DEG ((PLANET_CIRCUM)/(360.0))
#define PLANET_M_PER_MAJORHEX  ((PLANET_M_PER_DEG)/HEX_SIZE)

#define PLANET_RADIUS ((PLANET_CIRCUM)/(6.283185307179586476925286766559))
#define HEIGHT_AT_1_DEGREE ( PLANET_RADIUS * 0.000038076935828711262644835174 )


const SPHERE_SIZE = PLANET_RADIUS;

//#define POLE_NEAR_AREA_DEBUG
//#define DEBUG_RENDER_POLE_NEARNESS

// land hex
//     x
//    ___
// y / 0 /\ x
//  /___/ 2\    ...
//  \  1\  /    ...
// y \___\/ y
//      x




struct world_height_map
{
	// 6 hexpatches which are 60 units wide.
	// 3 mate together for a length of 180 between any two centers
	// 6 poles, 3 pair 180 apart... it works, I don't quite get it as
	// I attempt to explain it.
	int hex_size;
   float **band[6];//[HEX_SIZE+1][HEX_SIZE+1]; // band arond the center... 30 degrees...
   float **pole_patch[2][3];//[HEX_SIZE+1][HEX_SIZE+1];
   world_height_map( int size )
   {
	   int n, m;
	   hex_size = size + 1;
	   for( n = 0; n < 6; n++ )
	   {
		   band[n] = NewArray( float *, hex_size );
		   for( m = 0; m < hex_size; m++  )
			   band[n][m] = NewArray( float, hex_size );
		   pole_patch[0][n] = NewArray( float *, hex_size );
		   for( m = 0; m < hex_size; m++  )
			   pole_patch[0][n][m] = NewArray( float, hex_size );

	   }
   }
};


// length of an edge - divided by HEX_SIZE = width of segment
#define HEX_SCALE PLANET_M_PER_MAJORHEX

// Vertical_stride
#define HEX_VERT_STRIDE ( ( HEX_SCALE * 1.7320508075688772935274463415059 / 2 ) /*/ (double)HEX_SIZE*/ )

// horizontal_stride
#define HEX_HORZ_STRIDE ( ( HEX_SCALE ) /*/ (double)HEX_SIZE*/ )



class hexpatch_heights
{
	//float height[3][60][60];
	// resoution of 111.31km
	// 111319.88888888888888888888888889
	// 64 1739.3732638888888888888888888889
	// 64 27.177707248263888888888888888889
   // 27
	float **height[3];//[HEX_SIZE][HEX_SIZE];
	hexpatch(int size )
	{
		int n,m;
		for( n = 0; n < 3; n++ )
		height[n] = NewArray( float*, size );
		for( m = 0; m < size; m++ )
			height[n][m] = NewArray( float, size );
	}
   // this hexpatch is mapped differently...

	// a hex patch is 3 sets of squares..
	//
	// radial mapping here...
	// it is produced with level, r
   // where level is 0-hexsize from center to outside.
	// r is a counter clockwise rotation from zero to 120 degrees in hex_size total intervals
	// land hex
	//     x - zero at origin. y zero at origin.
	//    ___
	// y / 0 /\ y - zero at origin y at origin
	//  /___/+1\    ...
	//  \ +2\  /    ...
	// x \___\/ x
	//  3l y
	//
	//  edge from zero degrees is section 0, axis y
   //  edge from 60 degrees is section 0 axis hesize-x
	// building the map of coordinates results in differnet 'nearness' constants...
   //

	// level, R is near
	// so along the way one bit is dropped, but then the average geometry is
   // square, but there is a slow migration towards being diagonal... 45 degrees almost.


};


class hexpatch
{
	origin = {x:0,y:0,z:0}; // center of hex...

	hex_size = 0;
	band = [];
	pole = []
	
	constructor( size ) {
		this.hex_size = size;
		for( let n = 0; n < 6; n++ ) {
			this.band.push( new band(size) );
		}
		for( let n = 0; n < 6; n++ ) {
			this.pole.push( new pole(size) );
		}
	}
};





#if 0
enum { UP
	  , RIGHT_UP
	  , RIGHT_DOWN
	  , DOWN
	  , LEFT_DOWN
	  , LEFT_UP
} DIRECTIONS;
#endif

#define TIME_TO_TURN_BALL  l.time_to_turn_ball
const  TIME_SCALE = (1.0)

#define TIME_TO_APPROACH l.time_to_approach
#define TIME_TO_WATCH l.time_to_track
#define TIME_TO_HOME l.time_to_home 

//#include "local.h"

const bodymap = [];

function ConvertPolarToRect( level, c )
{
		// all maps must include c == HEX_SIZE
		c %= (level*2+1);
		if( c < level )
		{
			// need to redo the flat distortion....
			return { x:level, y:c };
		}
		else 
		{
			return { x:((level)-(c-level)), y:level };
		}
}



	class  band_patch_tag {
		// grid is col, row (x, y)
		//VECTOR **grid; // +1 cause there's this many squares bounded by +1 lines.
      grid = [];
                
		// the 4 corners that are this hex square.
      near_area = [ ]

		// each area is near 4 other areas.
		// these areas are
		//        1
		//        |
		//    2 - o - 0
		//        |
		//        3
		//

		nPoints = []; // for each patch, how many points it is
		// holds the list of rows (for the grid) and is verts; really it's scaled grid.
                
		verts = [];
		// normals at that point
		norms = [];
		// colors at that point
		colors = [];
		//_POINT4 **colors;
		constructor( size ) {
		}
	} 


// unit vector parts
class band {
	// the 4 corners that make up this sqaure.
	// could, in theory, scan this to come up with the 
	// correct square to point conversions
	corners = null;
        
	//struct corner_tag {
        //	int r, c;
	//} ***corners;// the 4 corners that are this hex square.
                
	hex_size = 0;

	//struct band_render_info {
	//	Image source;
	//	struct SACK_3D_Surface *fragment;
	//};
        
	bands = []

	CreateBandFragments(  )
	{
		//struct SACK_3D_Surface *tmp;
		const verts = ( this.hex_size + 1 ) * 2;
		//normals = [];
		//texture = [];

		//_POINT *normals = NewArray( _POINT, verts );
		//_POINT *texture = NewArray( _POINT, verts );
		let nShape;
	
		const band = this;

		for( let s = 0; s < 6; s ++ )
		{
			patches[s].verts = [];//NewArray( _POINT*, verts * hex_size * 2 );
			patches[s].norms = [];//NewArray( _POINT*, verts * hex_size * 2 );
			patches[s].faces = [];//NewArray( _POINT*, verts * hex_size * 2 );
			patches[s].colors = [];//NewArray( _POINT4*, verts * hex_size );
			patches[s].nPoints = []//NewArray( int, hex_size );

			for( let row = 0; row < this.hex_size; row++ )
			{
				_POINT tmp2;
				int use_s2;

				patches[s].nPoints.push( (this.hex_size+1)*2-1 );

				const row_verts = [];
				patches[s].verts.push( row_verts );
				const row_norms = [];
				patches[s].norms.push( row_norms );


				patches[s].colors.push( [] );// = NewArray( _POINT4, hex_size * 2 );

				for( let col = 0; col <= this.hex_size; col++ )
				{
					let s2;
					let c2;
					if( col == this.hex_size )
					{
						c2 = 0;
						s2 = ( s + 1 ) % 6;
					}
					else
					{
						c2 = col;
						s2 = s;
					}
					row_verts.push( band->patches[s].grid[row][col].scale( SPHERE_SIZE ) );
					//scale( row_verts[col*2], band->patches[s].grid[row][col], SPHERE_SIZE );
					//crossproduct( row_norms[col*2], _Y, row_verts[col*2] );
					//normalize( row_norms[col*2] );
				
					scale( row_verts[col*2+1], band->patches[s2].grid[row+1][c2], SPHERE_SIZE );
					crossproduct( row_norms[col*2+1], _Y, row_verts[col*2+1] );
					normalize( row_norms[col*2+1] );
				}
			}
			//tmp = CreateBumpTextureFragment( verts, (PCVECTOR*)shape, (PCVECTOR*)shape
			//	, (PCVECTOR*)normals, (PCVECTOR*)NULL, (PCVECTOR*)texture );
			//AddLink( &bands, tmp );
		}
	}


	const right = {x:1,y:0,z:0};


	function resize( size )
	{
		this.hex_size = size;
		{
			let work = new lnQuat(); // transform
			let col, row;
			let sections = 6*this.hex_size;
			let sections2= this.hex_size;


			//scale( ref_point, VectorConst_X, SPHERE_SIZE );
			for( let s = 0; s < 6; s++ )
			{
				for( row = 0; row <= this.hex_size; row++ )
				{
					const lngt = ((((60.0/this.hex_size)*row)-30.0)*(1*M_PI))/180.0

					for( let col = 0; col <= this.hex_size; col ++ )
					{
						const lat = (((s*this.hex_size)+col)*(2.0*M_PI))/sections;

						work.set( {lat:lat,lng:lngt }, true );
						const basis = work.getBasis();
						patches[s].grid[row].push( basis.up )
					}
				}
			}
			//DestroyTransform( work );
		}
		this.CreateBandFragments( );
	}

	constructor( size ) {
		this.resize( size );
	}

};

// near_area points and this semi-polar representation needs a rectangular conversion

class near_area {
	 s=0; x=0; y=0; // global map x, y that this is... this could be optimized cause y is always related directly to X by HEX_SIZE*y+x
	// indexed by x, y from level, c translation.  Is the 4 near squares to any given point.
   // on the pole itself, this is short 1, and .s = -1
}

class pole_patch_tag {
		grid = [];//[HEX_SIZE+1][HEX_SIZE+1];
		//let triangles[HEX_SIZE][HEX_SIZE*2][3];
		near_area = [];

		//let *nPoints; // for each patch, how many points it is
		// holds the list of rows (for the grid) and is verts; really it's scaled grid.
		//_POINT **verts;
		verts = [];
		// normals at that point
		norms = [];
		//_POINT **norms;
		// colors at that point
		//_POINT4 **colors;
		colors = [];
	};

class pole{
	hex_size = 0;
	patches = [];
	let corners;//[HEX_SIZE][HEX_SIZE][4];
	
	PLIST pole_bands[2];
	PLIST bands;
	let number;

	pole(  size, north )
	{
		this.resize( size, north );
	}

	CreatePoleFragments( north )
	{
		const maxverts = ( this.hex_size + 1 ) * 2;
		let s, level, c, r;
		let x, y; // used to reference patch level
		//let x2, y2;

		{
			const verts = ( this.hex_size + 1 ) * 2;

			//for( north = 0; north <= 1; north++ )
			{
				for( s = 0; s < 3; s++ )
				{
					let row;
					patches[s].verts = [];//NewArray( _POINT*, verts * hex_size * 2 );
					patches[s].norms = [];//NewArray( _POINT*, verts * hex_size * 2 );
					patches[s].colors = [];//NewArray( _POINT4*, verts * hex_size );
					patches[s].nPoints = [];//NewArray( let, hex_size );
					for( level = 1; level <= this.hex_size; level++ )
					{
						row = (level-1)*2;

						patches[s].nPoints[level-1] = (level+1)*2-1;
						_POINT *row_verts = patches[s].verts[row] = NewArray( _POINT, level * (level+1)*2-1 );
						_POINT *row_norms = patches[s].norms[row] = NewArray( _POINT, level * (level+1)*2-1 );
						patches[s].colors[row] = NewArray( _POINT4, level * (level+1)*2-1 );

						for( c = 0; c <= level; c++ )
						{
							let v_idx = c * 2;
							const xy = ConvertPolarToRect( level, c );
							scale( row_verts[v_idx]
									, patches[s].grid[xy.x][xy.y]
									, SPHERE_SIZE /*+ height[s+(north*6)][x][y]*/ );

							if( north )
								row_verts[v_idx][1] = -row_verts[v_idx][1];
					
							crossproduct(  row_norms[v_idx], _Y, row_verts[v_idx] );
							normalize(  row_norms[v_idx] );

							if( c < (level) )
							{
								ConvertPolarToRect( level-1, c, &x, &y );
								scale( row_verts[v_idx+1], patches[s].grid[x][y]
										, SPHERE_SIZE /*+ patch->height[s+(north*6)][x][y]*/ );
								if( north )
									row_verts[v_idx+1][1] = -row_verts[v_idx+1][1];
								crossproduct(row_norms[v_idx+1], _Y, row_verts[v_idx+1] );
								normalize( row_norms[v_idx+1] );
							}
						}

						if( 0 )
						{
							//AddLink( &bands, tmp = CreateBumpTextureFragment( nShape, (PCVECTOR*)shape, (PCVECTOR*)shape, (PCVECTOR*)normals, (PCVECTOR*)NULL, (PCVECTOR*)NULL ) );
							switch( s )
							{
							case 0:
							case 1:
								tmp->color = 1;
								break;
							case 2:
								tmp->color = 0;
								break;
							}
						}

						if( bLog )lprintf( "---------" );

						row = (level-1)*2 + 1;
						row_verts = patches[s].verts[row] = NewArray( _POINT, level * (level+1)*2-1 );
						row_norms = patches[s].norms[row] = NewArray( _POINT, level * (level+1)*2-1 );
						patches[s].colors[row] = NewArray( _POINT4, level * (level+1)*2-1 );
						for( c = level; c <= level*2; c++ )
						{
							let v_idx = (c - level)*2;

							ConvertPolarToRect( level, c, &x, &y );
							scale( row_verts[v_idx]
									, patches[s].grid[x][y], SPHERE_SIZE /*+ patch->height[s+(north*6)][x][y]*/ );
							if( north )
								row_verts[v_idx][1] = -row_verts[v_idx][1];
							crossproduct( row_norms[v_idx], _Y, row_verts[v_idx] );
							normalize( row_norms[v_idx] );
							if( c < (level)*2 )
							{
								ConvertPolarToRect( level-1, c-1, &x, &y );
								//if( bLog )lprintf( "Render corner %d,%d", 2*level-c-1,level-1);
								scale( row_verts[v_idx+1], patches[s].grid[x][y], SPHERE_SIZE /*+ patch->height[s+(north*6)][x][y]*/ );
								if( north )
									row_verts[v_idx+1][1] = -row_verts[v_idx+1][1];
								crossproduct( row_norms[v_idx+1], _Y, row_verts[v_idx+1] );
								normalize( row_norms[v_idx+1] );
							}
						}

						if( 0 )
						{
							//AddLink( &bands, tmp = CreateBumpTextureFragment( nShape, (PCVECTOR*)shape, (PCVECTOR*)shape, (PCVECTOR*)normals, (PCVECTOR*)NULL, (PCVECTOR*)NULL ) );
							switch( s )
							{
							case 0:
								tmp->color = 1;
								break;
							case 1:
							case 2:
								tmp->color = 0;
								break;
							}
						}
					}
				}
			}
		}
		//__except(EXCEPTION_EXECUTE_HANDLER){ lprintf( "Pole Patch Excepted." );return 0; }
	}


	void resize( let size, let north )
	{
		this.hex_size = size;
		{
			PTRANSFORM work;
			VECTOR patch1, patch1x;
			let level;
			let c;
			let patch;
			work = new lnQuat();
			//__try
			for( patch = 0; patch < 3; patch++ )
			{
				for( level = 0; level <= this.hex_size; level++ )
				{
					const patch_bias = -((patch*120) * M_PI ) / 180;
					const sections = ( level * 2 );
					work.set( {lat:0,lng: ((((60.0/this.hex_size)*level))*(1*M_PI))/180.0 }, true );
					//RotateAbs( work, 0, 0, ((((60.0/hex_size)*level))*(1*M_PI))/180.0 );
					const b = work.getBasis();
					//GetAxisV( work, patch1x, vUp );
					//Apply( work, patch1x, ref_point );
					if( !sections ) // level 0
					{
						patches[patch].grid[0].push( b.up );
						continue;
					}
					//use common convert sphere to hex...
					for( c = 0; c <= sections; c++ )
					{
						let x, y;
						ConvertPolarToRect( level, c, &x, &y );
						RotateAbs( work, 0, patch_bias - ((120.0*c)*(1*M_PI))/((sections)*180.0), 0 );
						Apply( work, patch1, patch1x );
						SetPoint( patches[patch].grid[x][y], patch1 );
					}
				}
			}
			DestroyTransform( work );
			//__except(EXCEPTION_EXECUTE_HANDLER){ lprintf( "Pole Patch Excepted." ); }
		}
		CreatePoleFragments( north );
	}
};


