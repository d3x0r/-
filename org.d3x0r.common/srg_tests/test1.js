
const size = 256;
const bits = 8;

var frames = 0;
var firstTick = Date.now();
var frameCounter;

frameCounter = document.getElementById( "frameRate" );
if( !frameCounter ) {
	frameCounter = document.createElement( "div" );
	document.body.appendChild( frameCounter );
}
frameCounter.textContent = "?? FPS";

var canvas = document.getElementById( "graphout" );
var ctx= canvas.getContext( "2d" );
canvas.width = size;
canvas.height = size;
var myImageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
var myEnable = document.getElementById( "enablegraphout" );
var enables = { enable:true, enable2:true, enable3:true }
myEnable.addEventListener( "click", ()=>{
	enables.enable = !enables.enable;
	firstTick = Date.now();
	frames = 0;
} );

var canvas2 = document.getElementById( "graphout2" );
var ctx2= canvas2.getContext( "2d" );
canvas2.width = size;
canvas2.height = size;
var myImageData2 = ctx2.getImageData(0, 0, canvas2.width, canvas2.height)
var myEnable2 = document.getElementById( "enablegraphout2" );
myEnable2.addEventListener( "click", ()=>{
	enables.enable2 = !enables.enable2;
	firstTick = Date.now();
	frames = 0;
} );

var canvas3 = document.getElementById( "graphout3" );
var ctx3= canvas3.getContext( "2d" );
canvas3.width = size;
canvas3.height = size;
var myImageData3 = ctx3.getImageData(0, 0, canvas3.width, canvas3.height)
var myEnable3 = document.getElementById( "enablegraphout3" );
myEnable3.addEventListener( "click", ()=>{
	enables.enable3 = !enables.enable3;
	firstTick = Date.now();
	frames = 0;
} );

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

var values3 = [];
var values3_acc = [];
for( var n = 0; n < size; n++ )  {
	var newCol;
	var newCol_acc;
	values3.push( newCol=[] );
	values3_acc.push( newCol_acc=[] );
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


var rp1 = runPass.bind( {}, myImageData,ctx,values,values_acc, false, RNG, "enable")
var rp2 = runPass.bind( {}, myImageData2,ctx2,values2,values2_acc,false, RNG2, "enable2")
var rp3 = runPass.bind( {}, myImageData3,ctx3,values3,values3_acc, true, null, "enable3")

	var max = 0;
	
function runPass( myImageData,ctx,  values, values_acc, math, RNG, enable ) {
	if( enables[enable] ) {
	var min = 10000;
	tick = Date.now();
	//while( ( newtick = Date.now() ) - tick < 300 ) {
	if( math ) {
		for( var n = 0; n < size*size; n++ ) {
			var x = (Math.random() * size)|0;
			var y = (Math.random() * size)|0;
			values[x][y] += 1.0;
		}
	} else {
		for( var n = 0; n < size*size; n++ ) {
			var x = RNG.getBits( bits );
			var y = RNG.getBits( bits );
			values[x][y] += 1.0;
		}
	}
	var data = myImageData.data;
	tick = newtick;

	max = 0;
	min = 8000;
	for( var m = 0; m < size; m++ ) {
		var valrow = values[m];
		for( var n = 0; n < size; n++ ) {
			var v = valrow[n];
			if( v > max ) max = v;
			if( v < min ) min = v;
		}
	}

	var min_acc = 1000;
	var max_acc = 0;
	for( var m = 0; m < size; m++ ) {
		var valrow = values[m];
		var valaccrow = values_acc[m];
		for( var n = 0; n < size; n++ ) {
			var c = valrow[n] - min;
			valrow[n] = valrow[n] * 0.90;
			c = c / ( max-min);
			//if( c > 0.75 ) console.log( "at",valrow[n], c, n, m );
			//c = 2*( c - 0.5 );
			if( c < 0 ) {
				valaccrow[n] *= 0.1;
				if(0) {
					c = c * c;
		        		data[(n*size+m)*4 + 0] = 5 *( c );
        				data[(n*size+m)*4 + 1] = 0;
        				data[(n*size+m)*4 + 2] = 0;
        				data[(n*size+m)*4 + 3] = 255;
				}
			}else {
				//c = c * c;
				valaccrow[n] = valaccrow[n] * 0.90 +
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

	for( var m = 0; m < size; m++ ) {
		var row = values_acc[m];
		for( var n = 0; n < size; n++ ) {
			var v = row[n];
			if( v > max_acc ) max_acc = v;
			if( v < min_acc ) min_acc = v;
		}
	}

	for( var m = 0; m < size; m++ ) {
		var row = values_acc[m];
		for( var n = 0; n < size; n++ ) {
			var c = row[n] - min_acc;
			c = c / ( max_acc-min_acc);
			//if( c > 0.75 ) console.log( "at",valrow[n], c, n, m );
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
	}
	
}

function animtick() {
 rp1();
 rp2()
 rp3()
	frames++;
	if( ( frames % 100 ) === 0 )
		frameCounter.textContent = ( frames/ ( (Date.now()-firstTick)/1000)) + " FPS";
	setTimeout( animtick, 5 );

}
animtick();
//	runPass();
//runPass();
