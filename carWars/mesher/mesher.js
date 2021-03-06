
// some working notes
                        // slope = ( values[1] - values[0] ) / 1;
                        // b = values[0]
                        // y = mx + b;
                        // x = (y-b)/m
                        // x = (0-values[0])/(values[1]-values[0] )
                        // x =  (values[0])/(values[0]-values[1] )
                        //  -3  8
                        //  3/11 
                        //  -3  3
                        //  3/6 

/*
// inverted not applies to that point in or out of shape vs the others.
   0 _ _ 1  (inverted)
   |\   /|
    \\2//     (above page)
    | | |
     \|/
      3  (inverted)
*/

const cellOrigin = [0,0,0];

var bufferOut = null;
var bufferPos = 0;

function emit( p ) {
	bufferOut[bufferPos++] = p[0];
	bufferOut[bufferPos++] = p[1];
	bufferOut[bufferPos++] = p[2];
}

function lerp( p1, p2, del ) {
	return [ cellOrigin[0] + p1[0] + (p2[0]-p1[0])*del
               , cellOrigin[1] + p1[1] + (p2[1]-p1[1])*del
               , cellOrigin[1] + p1[2] + (p2[2]-p1[2])*del ];
}


function tetCompute( values, geometry, invert ) {
	var b = 0; // can iterate through each point, and test each as a base..
        
        // in order to mesh at all, 1 has to be on the outside.
        for( b = 0; b < 4; b++ ) 
        	if( values[0] <= 0 ) break;
        invert = invert ^ (b&1);
	if( ( b < 4 ) && ( values[b+0] <= 0 ) ) {
        	if( values[(b+1)&3] > 0 ) {
                	cross1 = -values[(b+0)&3] / ( values[(b+1)&3]-values[(b+0)&3] );
                        
                        if( values[(b+2)&3] > 0 ) {
                        	// 0-2 is also a cross
                                cross2 = -values[(b+0)&3] / ( values[(b+2)&3] - values[(b+0)&3] );
	                        if( values[(b+3)&3] > 0 {
        	                	// 0-3 is also a cross
                	                cross3 = -values[(b+0)&3] / ( values[(b+3)&3] - values[(b+0)&3] );
                                        // emit tri.  
                                        if( invert ) {
	                                        emit( lerp( geometry[0], geometry[1], cross1 );
	                                        emit(lerp( geometry[0], geometry[2], cross2 );
	                                        emit( lerp( geometry[0], geometry[3], cross3 );
                                        } else {
	                                        emit( lerp( geometry[0], geometry[2], cross2 );
	                                        emit( lerp( geometry[0], geometry[1], cross1 );
	                                        emit( lerp( geometry[0], geometry[3], cross3 );
                                        }
                        	} else {
                                	cross3 = -values[(b+3)&3] / ( values[(b+1)&3] - values[(b+3)&3] );
                                	cross4 = -values[(b+3)&3] / ( values[(b+2)&3] - values[(b+3)&3] );
                                        let a,b,c,d;
                                        // emit quad
                                        if( invert ) {
                                	        a= lerp( geometry[0], geometry[1], cross1 );
                                        	b= lerp( geometry[0], geometry[2], cross2 );
	                                         c=lerp( geometry[3], geometry[1], cross3 ); // always lerp from outside to inside.
        	                                 d=lerp( geometry[3], geometry[2], cross4 );
                                        } else {
	                                         b=lerp( geometry[0], geometry[1], cross1 );
        	                                 a=lerp( geometry[0], geometry[2], cross2 );
                	                         c=lerp( geometry[3], geometry[1], cross3 ); // always lerp from outside to inside.
                        	                 d=lerp( geometry[3], geometry[2], cross4 );
                                        }
                                        // emit a,b,c  b,c,d
                                        emit( a,b,c );
                                        emit( b,c,d );
                                        
                                }
                        } else {
                        	if( values[(b+3)&3] > 0 ) {
                                	cross2 = -values[(b+2)&3] / ( values[(b+1)&3] - values[(b+2)&3] );
                                	cross3 = -values[(b+0)&3] / ( values[(b+3)&3] - values[(b+0)&3] );
                                        cross4 = -values[(b+2)&3] / ( values[(b+3)&3] - values[(b+2)&3] );
                                	// emit quad
                                        if( invert ) {
                                	        // a=lerp( geometry[0], geometry[1], cross1 );
                                        	// b=lerp( geometry[0], geometry[3], cross2 );
	                                        // c=lerp( geometry[2], geometry[1], cross3 ); // always lerp from outside to inside.
        	                                // d=lerp( geometry[2], geometry[3], cross4 );
                                        } else {
	                                        // b=lerp( geometry[0], geometry[1], cross1 );
        	                                // a=lerp( geometry[0], geometry[3], cross2 );
                	                        // c=lerp( geometry[2], geometry[1], cross3 ); // always lerp from outside to inside.
                        	                // d=lerp( geometry[2], geometry[3], cross4 );
                                        }
                                        // emit a,b,c  b,c,d
                                        emit( a,b,c );
                                        emit( b,c,d );
                                } else {
                                	// 
                                        cross3 = -values[(b+0)&3] / ( values[(b+3)&3] - values[(b+0)&3] );
                                        // emit tri 1,2,3
                                        if( invert ) {
	                                        // lerp( geometry[0], geometry[1], cross1 );
	                                        // lerp( geometry[0], geometry[2], cross2 );
	                                        // lerp( geometry[0], geometry[3], cross3 );
                                        } else {
	                                        // lerp( geometry[0], geometry[2], cross2 );
	                                        // lerp( geometry[0], geometry[1], cross1 );
	                                        // lerp( geometry[0], geometry[3], cross3 );
                                        }
                                }
                        }
                } else {
                	// 0,1 outside
                        if( values[(b+2)&3] > 0 ) {
                        	// 0-2 is also a cross
                                cross1 = -values[(b+0)&3] / ( values[(b+2)&3] - values[(b+0)&3] );
                                cross2 = -values[(b+1)&3] / ( values[(b+2)&3] - values[(b+1)&3] );
	                        if( values[(b+3)&3] > 0 {
        	                	// 0-3 is also a cross
                	                cross3 = -values[(b+0)&3] / ( values[(b+3)&3] - values[(b+0)&3] );
                	                cross4 = -values[(b+1)&3] / ( values[(b+3)&3] - values[(b+1)&3] );
                                        // emit quad.  
                                        if( invert ) {
                                	        //a= lerp( geometry[0], geometry[1], cross1 );
                                        	//b= lerp( geometry[0], geometry[2], cross2 );
	                                        // c=lerp( geometry[3], geometry[1], cross3 ); // always lerp from outside to inside.
        	                                // d=lerp( geometry[3], geometry[2], cross4 );
                                        } else {
	                                        // b=lerp( geometry[0], geometry[1], cross1 );
        	                                // a=lerp( geometry[0], geometry[2], cross2 );
                	                        // c=lerp( geometry[3], geometry[1], cross3 ); // always lerp from outside to inside.
                        	                // d=lerp( geometry[3], geometry[2], cross4 );
                                        }
                                        // emit a,b,c  b,c,d
                        	} else {
                                	cross3 = -values[(b+3)&3] / ( values[(b+2)&3] - values[(b+3)&3] );
                                        // emit tri 1,2,3
                                        if( invert ) {
	                                        // lerp( geometry[0], geometry[1], cross1 );
	                                        // lerp( geometry[0], geometry[2], cross2 );
	                                        // lerp( geometry[0], geometry[3], cross3 );
                                        } else {
	                                        // lerp( geometry[0], geometry[2], cross2 );
	                                        // lerp( geometry[0], geometry[1], cross1 );
	                                        // lerp( geometry[0], geometry[3], cross3 );
                                        }
                                        
                                }
                        } else {
                                // 0,1,2 outside
                        	if( values[(b+3)&3] > 0 ) {
                                	cross1 = -values[(b+0)&3] / ( values[(b+3)&3] - values[(b+0)&3] );
                                        cross2 = -values[(b+1)&3] / ( values[(b+3)&3] - values[(b+1)&3] );
                                        cross3 = -values[(b+2)&3] / ( values[(b+3)&3] - values[(b+2)&3] );
                                	// emit tri
                                        if( invert ) {
	                                        // lerp( geometry[3], geometry[0], cross1 );
	                                        // lerp( geometry[3], geometry[1], cross2 );
	                                        // lerp( geometry[3], geometry[2], cross3 );
                                        } else {
	                                        // lerp( geometry[3], geometry[1], cross2 );
	                                        // lerp( geometry[3], geometry[0], cross1 );
	                                        // lerp( geometry[3], geometry[2], cross3 );
                                        }
                                } else {
                                	// all inside.
                                }
                        }

                }
        } else {
        
        }
}

// pyramid indexes are going to be order sensitive also.
// 
//
//
//
// pyramid point ordering
//
//
//    2 ----- 3
//    | \   / |
//    |  \ /  |
//    |   4   |(above page)
//    |  / \  |
//    | /   \ |
//    0 ----- 1
//	  
//	  
//	splits into two ordered tetrahedrons with
//
//    0,2,4,1   1,2,4,3
//



function pyramidCompute( values, geometry, invert ) {
	var v = [values[0], values[2], values[4], values[1]];
        var g = [geometry[0], geometry[2], geometry[4], geometry[1]];
        tetCompute( v, g, invert );
        
	var v = [values[1], values[2], values[4], values[3]];
        var g = [geometry[1], geometry[2], geometry[4], geometry[3]];
        tetCompute( v, g, invert );
}

// values input to this are in 2 planes for lower and upper values

const geom = [
	[0,0,0],  // bottom layer
        [1,0,0],
        [0,1,0],
        [1,1,0],
        [0.5,0.5,0.5], // centroid 0
        [0,0,1],  // top layer
        [1,0,1],
        [0,1,1],
        [1,1,1],
        [1.5,0.5,0.5], // centroid 1 (right)   v1245
        [0.5,1.5,0.5], // centroid 2 (fore)    v3467
        [1.5,1.5,0.5], // centroid 3 (fore-right)  v4578
]



function cellCompute( values, geometry ) {
	let b0134 = ( (values[0][0] <= 0) + (values[0][1] <= 0 ) + ( values[0][3] <= 0 ) + ( values[0][4] <= 0 )
	            + (values[1][0] <= 0) + (values[1][1] <= 0 ) + ( values[1][3] <= 0 ) + ( values[1][4] <= 0 )
                    );
	let v0134 = ( values[0][0] + values[0][1] + values[0][3] + values[0][4]
	            + values[1][0] + values[1][1] + values[1][3] + values[1][4]
                    ) / 8;

        
	let v1245 = ( values[0][1] + values[0][2] + values[0][4] + values[0][5]
	            + values[1][1] + values[1][2] + values[1][4] + values[1][5]
                    ) / 8;

	let b1245 = ( (values[0][1] <= 0) + (values[0][4] <= 0 ) + ( v0134 <= 0 )
	            + (values[1][1] <= 0) + (values[1][4] <= 0 ) + ( v1245 <= 0 )
                    );

	let v3467 = ( values[0][3] + values[0][4] + values[0][6] + values[0][7]
	            + values[1][3] + values[1][4] + values[1][6] + values[1][7]
                    ) / 8;
        let b3467 = ( values[0][3]  <= 0) + (values[0][4] <= 0 ) + ( v0134 <= 0 )
                    + values[1][3]  <= 0) + (values[1][4] <= 0 ) + ( v3467 <= 0 )
                    );
                    
	let v4578 = ( values[0][4] + values[0][5] + values[0][7] + values[0][8]
	            + values[1][4] + values[1][5] + values[1][7] + values[1][8]
                    ) / 8;

        let b4578 = ( values[0][5]  <= 0) + (values[0][6] <= 0 ) + ( v0134 <= 0 ) + ( v1245 <= 0 )
                    + values[1][5]  <= 0) + (values[1][6] <= 0 ) + ( v4578 <= 0 ) + ( v3467 <= 0 )
                    );

	if( ( b0134 > 0 ) && ( b0134 < 8 ) ) {

		var v = [values[0][0],values[0][1],values[0][3],values[0][4],v0134]
                var g = [geom[0], geom[1], geom[2], geom[3], geom[4]];
		pyramidCompute( v, g, false );
                
		var v = [values[1][0],values[1][1],values[1][3],values[1][4],v0134]
                var g = [geom[5], geom[6], geom[7], geom[8], geom[4]];
		pyramidCompute( v, g, true );
        	
        }
        
        if( ( b1245 > 0 ) && ( b1245 < 6 ) ) {
		var v = [values[0][1],values[0][4],v0134, v1245]
                var g = [geom[1], geom[3], geom[4], geom[9] ];
        	tetCompute( v, g, false );
                
		var v = [values[1][1],values[1][4],v0134, v1245]
                var g = [geom[6], geom[8], geom[4], geom[9] ];
        	tetCompute( v, g, true );
        }

        if( ( b3467 > 0 ) && ( b3467 < 6 ) ) {
		var v = [values[0][1],values[0][4],v0134, v1245]
                var g = [geom[1], geom[3], geom[4], geom[9] ];
        	tetCompute( v, g, false );
                
		var v = [values[1][1],values[1][4],v0134, v1245]
                var g = [geom[6], geom[8], geom[4], geom[9] ];
        	tetCompute( v, g, true );
        }

	
        if( ( b4578 > 0 ) && ( b4578 < 6 ) ) {
		var v = [values[0][4],v0134,v1245,v3467,v4578]
                var g = [geom[0], geom[1], geom[2], geom[3], geom[4]];
		pyramidCompute( v, g, true );
                
		var v = [values[1][4],v0134,v1245,v3467,v4578]
                var g = [geom[5], geom[6], geom[7], geom[8], geom[4]];
		pyramidCompute( v, g, false );
        }

}


