
const size = 128;
const bits = 7;

var canvas = document.getElementById( "graphout" );
var ctx= canvas.getContext( "2d" );
canvas.width = size;
canvas.height = size;

var canvas2 = document.getElementById( "graphout2" );
var ctx2= canvas2.getContext( "2d" );
canvas2.width = size;
canvas2.height = size;

var values = [];
var values_acc = [];
for( var n = 0; n < size; n++ )  {
	var newCol;
	var newCol_acc;
	values.push( newCol=[] );
	values_acc.push( newCol_acc=[] );
	for( var m = 0; m < size; m++ )  {
		newCol.push( 0 );
		newCol_acc.push( 0 );
    }        
}

var values2 = [];
var values2_acc = [];
for( var n = 0; n < size; n++ )  {
	var newCol;
	var newCol_acc;
	values2.push( newCol=[] );
	values2_acc.push( newCol_acc=[] );
	for( var m = 0; m < size; m++ )  {
		newCol.push( 0 );
		newCol_acc.push( 0 );
    }        
}


var RNG = exports.SaltyRNG( 
			//null 
			(salt)=>{salt.push( Date.now().toString() )}
		, { mode:0 } );

var RNG2 = exports.SaltyRNG( 
			//null 
			(salt)=>{salt.push( Date.now().toString() )}
		, { mode:1 } );


var tick, newtick;

tick = Date.now();

	var myImageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
	var myImageData2 = ctx2.getImageData(0, 0, canvas2.width, canvas2.height)

var rp1 = runPass.bind( {}, myImageData,ctx,values,values_acc)
var rp2 = runPass.bind( {}, myImageData2,ctx2,values2,values2_acc)

	var max = 0;
	
function runPass( myImageData,ctx,  values, values_acc ) {
	var min = 10000;
	tick = Date.now();
	//while( ( newtick = Date.now() ) - tick < 300 ) {
		for( var n = 0; n < size*size; n++ ) {
			var x = RNG.getBits( bits );
			var y = RNG.getBits( bits );
			values[x][y] += 1.0;
		}
	//}
	var data = myImageData.data;
	tick = newtick;

	max = 0;
	min = 8000;
	for( var n = 0; n < size; n++ ) {
		for( var m = 0; m < size; m++ ) {
			var v = values[m][n];
			if( v > max ) max = v;
			if( v < min ) min = v;
		}
	}

	var min_acc = 1000;
	var max_acc = 0;
	for( var n = 0; n < size; n++ ) {
		for( var m = 0; m < size; m++ ) {
			var c = values[m][n] - min;
			values[m][n] = values[m][n] * 0.92;
			c = c / ( max-min);
			//if( c > 0.75 ) console.log( "at",values[m][n], c, n, m );
			//c = 2*( c - 0.5 );
			if( c < 0 ) {
				values_acc[m][n] *= 0.5;
				if(0) {
				c = c * c;
        		data[(n*size+m)*4 + 0] = 5 *( c );
        		data[(n*size+m)*4 + 1] = 0;
        		data[(n*size+m)*4 + 2] = 0;
        		data[(n*size+m)*4 + 3] = 255;
				}
			}else {
				c = c * c;
				values_acc[m][n] = values_acc[m][n] * 0.99 +
						c;
				if(0) {
        		data[(n*size+m)*4 + 0] = 0;
        		data[(n*size+m)*4 + 1] = 255*( c);
        		data[(n*size+m)*4 + 2] = 0;
        		data[(n*size+m)*4 + 3] = 255;
				}
			}
			/*
			if( c < 0.33 ) {
        		data[(n*size+m)*4 + 0] = 255 *( c*3 );
        		data[(n*size+m)*4 + 1] = 0;
        		data[(n*size+m)*4 + 2] = 0;
        		data[(n*size+m)*4 + 3] = 255;
			} else if( c > 0.66 ) {
        		data[(n*size+m)*4 + 0] = 0;
        		data[(n*size+m)*4 + 1] = 255*( (c-0.33)*3 );
        		data[(n*size+m)*4 + 2] = 0;
        		data[(n*size+m)*4 + 3] = 255;
			} else {
        		data[(n*size+m)*4 + 0] = 0;
        		data[(n*size+m)*4 + 1] = 0;
        		data[(n*size+m)*4 + 2] = 255*( (c-0.66)*3 );
        		data[(n*size+m)*4 + 3] = 255;
            }
			*/
        }
	}

	for( var n = 0; n < size; n++ ) {
		for( var m = 0; m < size; m++ ) {
			var v = values_acc[m][n];
			if( v > max_acc ) max_acc = v;
			if( v < min_acc ) min_acc = v;
		}
	}

	for( var n = 0; n < size; n++ ) {
		for( var m = 0; m < size; m++ ) {
			var c = values_acc[m][n] - min_acc;
			c = c / ( max_acc-min_acc);
			//if( c > 0.75 ) console.log( "at",values[m][n], c, n, m );
			//c = 2*( c - 0.5 );
			/*
			if( c < 0 ) {
				c = c * c;
        		data[(n*size+m)*4 + 0] = 5 *( c );
        		data[(n*size+m)*4 + 1] = 0;
        		data[(n*size+m)*4 + 2] = 0;
        		data[(n*size+m)*4 + 3] = 255;
			}else {
				//c = c * c;
				values_acc[m][n] += c;
        		data[(n*size+m)*4 + 0] = 0;
        		data[(n*size+m)*4 + 1] = 255*( c);
        		data[(n*size+m)*4 + 2] = 0;
        		data[(n*size+m)*4 + 3] = 255;
			}
			*/
			
			{
        		data[(n*size+m)*4 + 0] = 255 *( c );
        		data[(n*size+m)*4 + 1] = 255*( c );
        		data[(n*size+m)*4 + 2] = 255*( c );
        		data[(n*size+m)*4 + 3] = 255;
            }
			
        }
	}

	ctx.putImageData(myImageData, 0, 0);
	//requestAnimationFrame( runPass );
	setTimeout( ()=>{runPass(myImageData,ctx,values,values_acc)}, 5 );
}

 rp1();
 rp2()
//	runPass();
//runPass();
