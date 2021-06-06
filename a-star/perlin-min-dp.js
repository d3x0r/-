
const generate_3D = false;
//-------------------------
// Usage : 



var config = {
	patchSize : 128,
	generations : 7,
	"2D" : true,
	left : 32,    // default left side (entry)
	right : 96,   // default right side (exit)
	nodes : [],  // trace of A*Path
	base : 0,
	seed : Date.now()
}

//import {noise} from "./perlin-min.mjs";
import {noise} from "./perlin-sphere-3.js";

if( typeof document !== "undefined" ) {
	config.canvas = document.getElementById( "testSurface" );
        config.ctx = config.canvas.getContext("2d");
	config.canvas2 = document.getElementById( "testSurface2" );
        config.ctx2 = config.canvas2.getContext("2d");

} else {
	config.lib = true;
}


const BASE_COLOR_WHITE = [255,255,255,255];
const BASE_COLOR_BLACK = [0,0,0,255];
const BASE_COLOR_DARK_BLUE = [0,0,132,255];
const BASE_COLOR_MID_BLUE = [0x2A,0x4F,0xA8,255];
const BASE_COLOR_RED = [127,0,0,255];
const BASE_COLOR_LIGHT_TAN = [0xE2,0xB5,0x71,255];    //E2B571
const BASE_COLOR_YELLOW = [255,255,0,255];
const BASE_COLOR_LIGHTBLUE = [0,0,255,255];
const BASE_COLOR_LIGHTCYAN = [0,192,192,255];
const BASE_COLOR_DARK_BLUEGREEN = [0x06, 0x51, 0x42,255];
const BASE_COLOR_LIGHTRED = [255,0,0,255];
const BASE_COLOR_LIGHTGREEN = [0,255,0,255];
const BASE_COLOR_DARK_GREEN = [0,93,0,255];
const BASE_COLOR_DARK_BROWN = [0x54,0x33,0x1c,255];  //54331C


//const RANGES = [BASE_COLOR_BLACK, BASE_COLOR_DARK_BLUE, BASE_COLOR_DARK_GREEN, BASE_COLOR_LIGHT_TAN, BASE_COLOR_DARK_BROWN, BASE_COLOR_WHITE, BASE_COLOR_BLACK ];
//const RANGES_THRESH = [0, 0.01, 0.25, 0.50, 0.75, 0.99, 1.0 ];

const RANGES = [BASE_COLOR_BLACK, BASE_COLOR_DARK_BLUE, BASE_COLOR_MID_BLUE, BASE_COLOR_LIGHT_TAN, BASE_COLOR_DARK_GREEN, BASE_COLOR_LIGHT_TAN, BASE_COLOR_DARK_BROWN, BASE_COLOR_WHITE, BASE_COLOR_BLACK ];
const RANGES_THRESH = [0, 0.02, 0.20, 0.24, 0.29, 0.50, 0.75, 0.99, 1.0 ];



var w = 0;
var h = 0;
var h2 = 0;
var h2Target = 20;
var wO = 0;
var hO = 0;


let wstride = ( 20 * Math.random() - 10 ) ;
let hstride = ( 20 * Math.random() - 10 ) ;
let slen = Math.sqrt(wstride*wstride+hstride*hstride);
const stridea = Math.acos( hstride/slen );
let strideangle = (wstride<0?(2*Math.PI-stridea):stridea)/(2*Math.PI);
const nwstride = wstride/slen;
const nhstride = hstride/slen;


init( config );

function init( config ) {
	if( config.lib ) {
	} else {
	}

	var myNoise = noise( 0, config );

	if( config.canvas ) {
		drawData( myNoise, config );
	}


	function stepPlasma() {
		if( config.canvas ) {
			drawData( myNoise, config );
		}
		setTimeout( stepPlasma, 10 );
	}
	stepPlasma();


}

function ColorAverage( a, b, i,m) {

    var c = [ (((b[0]-a[0])*i/m) + a[0])|0,
        (((b[1]-a[1])*i/m) + a[1])|0,
        (((b[2]-a[2])*i/m) + a[2])|0,
		(((b[3]-a[3])*i/m) + a[3])|0
             ]
    //c[3] -= c[1];
    //console.log( "color: ", a, b, c, i, ((b[1]-a[1])*i/m)|0, a[1], ((b[1]-a[1])*i/m) + a[1] )
    return c;//`#${(c[0]<16?"0":"")+c[0].toString(16)}${(c[1]<16?"0":"")+c[1].toString(16)}${(c[2]<16?"0":"")+c[2].toString(16)}`
}


function drawData( noise, config ) {

	
	config.ctx.clearRect(0,0,128,128);
    var _output = config.ctx.getImageData(0, 0, config.patchSize, config.patchSize);
    var output = _output.data;
	var surface = null;
    var output_offset = 0;
	

    function plot(b,c,d) { 
		//console.log( "output at", output_offset, d )
		const output_offset = (c*_output.width+b)*4;
        output[output_offset+0] = d[0]; 
        output[output_offset+1] = d[1]; 
        output[output_offset+2] = d[2]; 
        output[output_offset+3] = d[3]; 
        //output_offset+=4
        //output++;
    }

var lastTick = Date.now();

const drawNodes = {
root:null,
length:0,
push(n){
	drawNodes.length++;
	n.next = drawNodes.root;
	drawNodes.root = n;
},
pop(){
	const n = drawNodes.root;
	if( n ) {
		drawNodes.length--;
		drawNodes.root = drawNodes.root.next;
		return n;
	}
	return null;
}

};
const nodesChecked = [];

for( let i = 0; i < _output.height; i++ ) {
	const row = [];
	nodesChecked.push( row );
	for( let i = 0; i < _output.width; i++ ) {
		row.push(false);
	}
}

const dirs = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];

function stepDraw() {
	//var h;
	var start = Date.now();
	//if
	const drawList = {
		root:null,
		length:0,
		push(n){
			const x = n.x - 64;
			const y = n.y - 64;
			const l =  Math.sqrt(x*x+y*y);
			n.dist = l;
			let cur = drawList.root;
			let prior = null;
			while( cur && cur.dist < l ) {
				prior = cur;
				cur= cur.next;
			}
			drawList.length++;
			if( cur ) {
				if( prior )
					prior.next = n;
				else
					drawList.root = n;
					n.next = cur;
			} else {
				if( prior ) {
					prior.next = n;
					n.next = null;
				} else {
					drawList.root = n;
					n.next = null;
				}
			}
		},
		shift() {
			if( drawList.length ) {
				const n = drawList.root;
				drawList.root = n.next;
				drawList.length--;
				return n;
			}
			return null;
		}
	};
	for( let i = 0; i < _output.height; i++ ) {
		const row = nodesChecked[i];
		for( let i = 0; i < _output.width; i++ ) {
			row[i] = (false);
		}
	}

	output_offset = 0;//config.patchSize *h;
	const halfh = _output.height/2;
	const halfw = _output.width/2;

	let drawNode = drawNodes.length?drawNodes.pop():{x:halfw, y:halfh,len:0, dist : 0, next:null };
	nodesChecked[drawNode.y][drawNode.x] = true;
	drawList.push( drawNode );

	
	function doDrawNode(node) {

	}

	while( drawNode = drawList.shift() ) {
		//nodesChecked[drawNode.y][drawNode.x] = true;

		const h = drawNode.y;
		const w = drawNode.x;

//	for( h = -_output.height; h < 0; h++ )
	{
		//output_offset =  + ( surface.height - h - 1 ) * surface.width;
//		for( w = -_output.width; w < 0; w++ )
		{
			let here = noise.get( 128*w/_output.width +wO, 128*h/_output.height+hO, h2 );
			var c1,c2,c3;
const c1r1 = 0.10;
const c1r2 = 0.36;
const c1r3 = 0.50;
const c1r4 = 0.63;
const c1r5 = 0.90;
			let toHerex = w - halfw;
			let toHerey = h - halfh;
			let del = toHerex*toHerex + toHerey*toHerey;
			if( del ) {
				del = Math.sqrt(del );
				toHerex /= del;
				toHerey /= del;
			}
			else {
				toHerex = 0;
				toHerey = 1;
			}

			
			let angle_view = (Math.acos( toHerey ))/(Math.PI);
			if( toHerex < 0 ) angle_view = 1 - angle_view;
			//angle_view += strideangle;

	      const hx = Math.cos((here)*4*Math.PI);
			const hy = Math.sin((here)*4*Math.PI);

	      //const hx = Math.cos((here-(angle_view+strideangle))*2*Math.PI);
			//const hy = Math.sin((here-(angle_view+strideangle))*2*Math.PI);

	      //const hx = Math.cos((here+strideangle)*2*Math.PI);
			//const hy = Math.sin((here+strideangle)*2*Math.PI);


			//const dot = toHerex*nwstride + toHerey*nhstride;
			const dot = toHerex*hx + toHerey*hy;
			
			let angle = (	Math.acos( dot ))/(Math.PI);

	      const hx2 = Math.sin(strideangle);
			const hy2 = Math.cos(strideangle);
			const dot2 = hx*hx2 + hy*hy2;
			
			let angle2 = (	Math.acos( dot2 ))/(Math.PI);
			
			//if( toHerex < 0 ) angle = Math.PI*2 - angle;

			here = ((angle)*1);
			c1 = [here*255,angle2*255,0,255 - ( 5*drawNode.len )];

			//here = (here + angle/(2*Math.PI))%1;
			//here = ( here+strideangle)%1;
			//here = (here + (angle/(2*Math.PI)) - strideangle)%1


if (false) {
	for( var r = 1; r < RANGES_THRESH.length; r++ ) {
			if( here <= RANGES_THRESH[r] ) {
				c1 =ColorAverage( RANGES[r-1], RANGES[r+0], (here-RANGES_THRESH[r-1])/(RANGES_THRESH[r+0]-RANGES_THRESH[r-1]) * 1000, 1000 );
				break;
			}
	}
	if( r === RANGES_THRESH.length ) continue;

}


				plot( w, h, c1 );//ColorAverage( BASE_COLOR_WHITE,
			//plot( w, h, ColorAverage( BASE_COLOR_BLACK,
			//									 BASE_COLOR_LIGHTRED, (here) * 1000, 1000 ) );
			//console.log( "%d,%d  %g", w, h, data[ h * surface.width + w ] );

		for( let dir of dirs ) {
			
			if( (drawNode.x+dir[0]) >= 0 
			  && (drawNode.x+dir[0]) < _output.width
				&& (drawNode.y+dir[1]) >= 0 
			  && (drawNode.y+dir[1]) < _output.height ){
			 	if( !nodesChecked[drawNode.y+dir[1]][drawNode.x+dir[0]] ){
					let newDrawNode;
					if( drawNodes.length ){
						newDrawNode = drawNodes.pop();
						newDrawNode.x = drawNode.x+dir[0];
						newDrawNode.y = drawNode.y+dir[1];
						newDrawNode.len = drawNode.len+here;
					} else  {
						newDrawNode = {x:drawNode.x+dir[0], y:drawNode.y+dir[1],len:drawNode.len+angle2, dist: 0, next:null };
					}
					nodesChecked[newDrawNode.y][newDrawNode.x] = true;
					if( drawNode.len < 12 ) 
						drawList.push( newDrawNode );
					else
						drawNodes.push(newDrawNode );
				}
			}
		}
		drawNodes.push( drawNode ); 

		}
		
	}
	//console.log( "Rendered in:", h2, Date.now() - start );
	//h2+=1;

	}


	var now = Date.now();
	var delta = ( now - lastTick );
	if( !delta ) delta = 1;
	lastTick = now;


	hO += hstride * ( delta / 100 );
	wO += wstride * ( delta / 100 );
	
	if( h2 > h2Target ) {
		h2 = 0;
		h2Target += 640;
	}

}

	//if( h == 0 )
		stepDraw();
//	console.log( "Result is %g,%g", min, max );
	config.ctx.clearRect(0,0,128,128);
	{
		config.ctx.moveTo( 64,64);
		const x = Math.sin( strideangle);
		const y = Math.cos( strideangle);

		config.ctx.lineTo( 64+32*x, 64+32*y );  

		config.ctx.stroke();
	}
	config.ctx.putImageData(_output, 0,0);


}


export {noise}

document.body.addEventListener( "keydown", (evt)=> {
	if( evt.keyCode == 65 ) {
		strideangle += 0.02;
	      const hx = Math.sin(strideangle);
			const hy = Math.cos(strideangle);
			wstride = slen * hx;
			hstride = slen * hy;
	}
	if( evt.keyCode == 68 ) {
		strideangle -= 0.02;
	      const hx = Math.sin(strideangle);
			const hy = Math.cos(strideangle);
			wstride = slen * hx;
			hstride = slen * hy;
	}
	if( evt.keyCode == 83 ) {
		if( slen > 0.2 )
			slen -= 0.2;
		else
			slen = 0;
	      const hx = Math.sin(strideangle);
			const hy = Math.cos(strideangle);
			wstride = slen * hx;
			hstride = slen * hy;
	}
	if( evt.keyCode == 87 ) {
			slen += 0.02;
	      const hx = Math.sin(strideangle);
			const hy = Math.cos(strideangle);
			wstride = slen * hx;
			hstride = slen * hy;
	}
	console.log( "ke:", evt );
} );

// find nearest does a recusive search and finds nodes
// which may qualify for linking to the new node (to).
// from is some source point, in a well linked web, should be irrelavent which to start from
// paint is passed to show nodes touched during the (last)search.
