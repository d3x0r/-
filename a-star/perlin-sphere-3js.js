
import {SaltyRNG} from "./salty_random_generator.js"
import * as THREE  from "./three.js/build/three.module.js"
import {consts,Vector3Pool} from "./three.js/personalFill.js"
import {myPerspective} from './three.js/my_perspective.js'

import {TrackballControls} from "./three.js/TrackballControls.js"
import {noise} from "./perlin-sphere-3.js"
//import {

const sliders = [
	document.getElementById( "Slider1" ),
	document.getElementById( "Slider2" ),
	document.getElementById( "Slider3" ),
	document.getElementById( "Slider4" ),
]
const buttons = [
	document.getElementById( "Event1" ),
];

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
const RANGES_THRESH = [0, 0.25, 0.37, 0.44, 0.58, 0.67, 0.82, 0.99, 1.0 ];


var config = {
	patchSize : 128,
	seed_noise : null,
	gen_noise : null,
	nodes : [],  // trace of A*Path
	base : 0,
	generations : 6,
	seed : Date.now(),
	cache : [],
}

let renderer = null;
let sceneRoot = null;
let scene = null;
let scene2 = null;
let scene3 = null;
let camera = null;
let cameraControls = null;

const CUBE_ELEMENT_SIZE = 16
let height = noise( 1.0, config );

let heightScalar = 0.1;
let xOfs = 0;
let yOfs = 0;
let zOfs = 0;
let updateSphere = true;
init();


function getValues() {
	const v1 = sliders[0].value/100;
	const v2 = (sliders[1].value)/100;
	const v3 = sliders[2].value/100;
	const v4 = sliders[3].value/100;

	heightScalar = v1 * 0.4;
	xOfs = v2 * 2 - 1.0;
	yOfs = v3 * 2 - 1.0;
	zOfs = v4 * 2 - 1.0;
	updateSphere = true;
}

function init() {
	if( typeof document !== "undefined" ) {
		config.canvas = document.getElementById( "test3d" );
	} else {
		config.lib = true;
	}


	if( !sceneRoot )
		sceneRoot = new THREE.Scene();

	if( !scene ) {
		//sceneRoot.add(
			scene = new THREE.Scene()
		// );
		//sceneRoot.add( scene2 = new THREE.Scene() );
		//sceneRoot.add( scene3 = new THREE.Scene() );
	}
		// for phong hello world test....
	//	light = new THREE.PointLight( 0xffFFFF, 1, 10000 );
	//	light.position.set( 0, 0, 1000 );
  //		scene.add( light );

	var rect = config.canvas.getBoundingClientRect();
//	camera = new THREE.PerspectiveCamera( 15, rect.width / rect.height, 0.001, 10000 );
	camera = new THREE.PerspectiveCamera( 15, window.innerWidth/window.innerHeight, 0.1, 1000 );

	//myPerspective( camera.projectionMatrix, 90, rect.width / rect.height, 0.01, 10000 );

	{
   	renderer = new THREE.WebGLRenderer( { canvas : config.canvas } );

		
		if(1)
		{
			renderer.setSize( window.innerWidth, window.innerHeight );
			window.addEventListener( "resize", ()=>{
				var rect = config.canvas.getBoundingClientRect();
				myPerspective( camera.projectionMatrix, 15, window.innerWidth/window.innerHeight, 0.01, 10000 );
				renderer.setSize( window.innerWidth,window.innerHeight ) 
			} );
		}
		else {
			renderer.setSize( rect.width, rect.height );
		}
		//document.body.appendChild( renderer.domElement );

		//controls.setDOM( renderer.domElement );

		camera.matrixAutoUpdate = false;
		camera.position.y = 3.3;
		camera.position.x = 1.5;
		camera.position.z = 6.5;
		camera.matrix.origin.copy( camera.position );

		if ( !renderer.extensions.get('WEBGL_depth_texture') ) {
			supportsExtension = false;
			//document.querySelector('#error').style.display = 'block';
			//return;
		}
		renderer.setClearColor( 0xBBBBBB, 1 );
		//THREEx.WindowResize.bind(renderer, camera);

		camera.matrixAutoUpdate = true;
		//scene.add( controls.game.casting.mesh );

	}

		cameraControls	= new TrackballControls( camera, config.canvas );



//		const geometry = new THREE.BoxGeometry( 1, 1, 1 );
		const geometry = new THREE.IcosahedronGeometry( 0, 4 );
		const geometryWater = new THREE.Geometry( );
		// create the Cube
				//cube = new THREE.Mesh( new THREE.CubeGeometry( 200, 200, 200 ), new THREE.MeshNormalMaterial() );
		//				cube.position.y = 150;
		const update = mangleGeometry( geometry, geometryWater );

		sliders[0].addEventListener( "input", getValues );
		sliders[1].addEventListener( "input", getValues );
		sliders[2].addEventListener( "input", getValues );
		sliders[3].addEventListener( "input", getValues );

		buttons[0].addEventListener("click",()=>{
			config.seed = new Date();
			config.cache = [];
			height = noise( 1.0, config );
			update.newSeed();
		})

		geometry.colorsNeedUpdate = true;

		const material2 = new THREE.MeshNormalMaterial();
		const material = new THREE.MeshPhongMaterial( {vertexColors:THREE.VertexColors, color: 0x80808080} );
		material.transparent = false
		//material.vertexColors = true;
		//material.vertexColors = THREE.FaceColors;
		material.needsUpdate = true;     

		const materialWater = new THREE.MeshPhongMaterial( {vertexColors:THREE.VertexColors, color: 0x80808080} );
		materialWater.transparent = true
		materialWater.opacity = 0.2;
		//material.vertexColors = true;
		//material.vertexColors = THREE.FaceColors;
		materialWater.needsUpdate = true;     

		const cube = new THREE.Mesh( geometry, material );
		const water = new THREE.Mesh( geometryWater, materialWater );

		scene.add( cube )
		cube.add( water )


			// here you add your objects
			// - you will most likely replace this part by your own
			var light	= new THREE.AmbientLight( 0.8 * 0xffffff );
			scene.add( light );
			var light	= new THREE.PointLight( 0.8 * 0xffffff );
			//light.position.set( Math.random(), Math.random(), Math.random() ).normalize();
			light.position.set( Math.random(), Math.random(), Math.random() ).normalize();
			light.position.multiplyScalar(40);
			scene.add( light );

			var light2	= new THREE.PointLight( 0.8 * 0xffffff );
			//light.position.set( Math.random(), Math.random(), Math.random() ).normalize();
			light2.position.copy( light.position );
			light2.position.z = -light2.position.z;
			light2.position.y = -light2.position.y;
			light2.position.x = -light2.position.x;
			scene.add( light2 );



		animate();
		return;

		// animation loop
		function animate() {

			// loop on request animation loop
			// - it has to be at the begining of the function
			// - see details at http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
			requestAnimationFrame( animate );

			// do the render
			render();
			if( updateSphere ){
				updateSphere = false;
				update.newSeed();
			}
			// update stats
			//stats.update();
		}

		// render the scene
		function render() {
			// variable which is increase by Math.PI every seconds - usefull for animation
			var PIseconds	= Date.now() * Math.PI;

			// update camera controls
			cameraControls.update();

		  //surfacemesh.visible = document.getElementById("showfacets").checked;
		  //wiremesh.visible = document.getElementById("showedges").checked;

			// actually render the scene
			renderer.render( scene, camera );
		}





function ColorAverage( a, b, i,m) {

    var c = [ (((b[0]-a[0])*i/m) + a[0])/255,
        (((b[1]-a[1])*i/m) + a[1])/255,
        (((b[2]-a[2])*i/m) + a[2])/255,
		(((b[3]-a[3])*i/m) + a[3])/255
             ]
    //c[3] -= c[1];
    //console.log( "color: ", a, b, c, i, ((b[1]-a[1])*i/m)|0, a[1], ((b[1]-a[1])*i/m) + a[1] )
    return c;//`#${(c[0]<16?"0":"")+c[0].toString(16)}${(c[1]<16?"0":"")+c[1].toString(16)}${(c[2]<16?"0":"")+c[2].toString(16)}`
}

				const c1r1 = 0.10;
				const c1r2 = 0.36;
				const c1r3 = 0.50;
				const c1r4 = 0.63;
				const c1r5 = 0.90;

function getColor( here ) {
	let c1;
	for( var r = 1; r < RANGES_THRESH.length; r++ ) {
			if( here <= RANGES_THRESH[r] ) {
				//plot( w, h, ColorAverage( RANGES[r-1], RANGES[r+0], (here-RANGES_THRESH[r-1])/(RANGES_THRESH[r+0]-RANGES_THRESH[r-1]) * 1000, 1000 ) );
				return ColorAverage( RANGES[r-1], RANGES[r+0], (here-RANGES_THRESH[r-1])/(RANGES_THRESH[r+0]-RANGES_THRESH[r-1]) * 1000, 1000 );
				break;
			}
	}
				{
					if( here <= 0.10 )
						c1 = ColorAverage( BASE_COLOR_WHITE,
														 BASE_COLOR_BLACK, (here)/(c1r1) * 1000, 1000 );
					else if( here <= 0.36 )
						c1=ColorAverage( BASE_COLOR_BLACK,
														 BASE_COLOR_LIGHTBLUE, (here-c1r1)/(c1r2-c1r1) * 1000, 1000 );
					else if( here <= 0.5 )
						c1=ColorAverage( BASE_COLOR_LIGHTBLUE,
														 BASE_COLOR_LIGHTGREEN, (here-c1r2)/(c1r3-c1r2) * 1000, 1000 );
					else if( here <= 0.63 )
						c1=ColorAverage( BASE_COLOR_LIGHTGREEN,
														 BASE_COLOR_LIGHTRED, (here-c1r3)/(c1r4-c1r3) * 1000, 1000 ) ;
					else if( here <= 0.90 )
						c1=ColorAverage( BASE_COLOR_LIGHTRED,
														 BASE_COLOR_WHITE, (here-c1r4)/(c1r5-c1r4) * 1000, 1000 ) ;
					else //if( here <= 4.0 / 4 )
						c1=ColorAverage( BASE_COLOR_WHITE,
														 BASE_COLOR_BLACK, (here-c1r5)/(1.0-c1r5) * 10000, 10000 );
				}
   	
   	return c1;
}



function mangleGeometry( land, water ) {
	const verts_w = water.vertices;
	const uvs_w = water.faceVertexUvs;
	const faces_w = water.faces;

	const verts = land.vertices;
	const faces = land.faces;
	const uvs = land.faceVertexUvs;
	const vout = land.vertices = [];

	const checkVerts = verts.length;
	const checkFaces = faces.length;

	function updateVerts() {
		//const start = Date.now();
		const newUpdate = !vout.length;



		//	const colors = land.colors;
			const spanx = 64;
			const spany = 64;
			const spanz = 64;
	if(1)
		for( var n = 0; n < checkFaces; n++ ) {
			const f = faces[n];	
			const p1 = verts[f.a];
			const p2 = verts[f.b];
			const p3 = verts[f.c];
			let addOne = false;
			let newF = 0;
			f.vertexColors.length = 0;
			{
				const h = height.get2( (1+p1.x+xOfs)*spanx, (1+p1.y+yOfs)*spany, (1+p1.z+zOfs)*spanz, 0 );
				if( h < RANGES_THRESH[3] )
					addOne = true;
				//const h = Math.random();
				const color = getColor( h );
				f.vertexColors.push( new THREE.Color( color[0], color[1], color[2], color[3] ) );
			}
			{
				const h = height.get2( (1+p2.x+xOfs)*spanx, (1+p2.y+yOfs)*spany, (1+p2.z+zOfs)*spanz, 0 );
				if( h < RANGES_THRESH[3] )
					addOne = true;
				//const h = Math.random();
				const color = getColor( h );
				f.vertexColors.push( new THREE.Color( color[0], color[1], color[2], color[3] ) );
			}
			{
				const h = height.get2( (1+p3.x+xOfs)*spanx, (1+p3.y+yOfs)*spany, (1+p3.z+zOfs)*spanz, 0 );
				if( h < RANGES_THRESH[3] )
					addOne = true;
				//const h = Math.random();
				const color = getColor( h );
				f.vertexColors.push( new THREE.Color( color[0], color[1], color[2], color[3] ) );
			}

			if( addOne ) {
				if( !newUpdate ){

					const f2 = faces_w[newF++];
					 verts_w[f2.a].copy( verts[f.a] ).multiplyScalar( 1.0 - 0.06 * (heightScalar*2) ) ;
					 verts_w[f2.b].copy( verts[f.b] ).multiplyScalar( 1.0 - 0.06 * (heightScalar*2) ) ;
					 verts_w[f2.c].copy( verts[f.c] ).multiplyScalar( 1.0 - 0.06 * (heightScalar*2) ) ;

					const r = BASE_COLOR_DARK_BLUEGREEN[0]/255.0;//0.1;
					const g = BASE_COLOR_DARK_BLUEGREEN[1]/255.0;//0.8;
					const b = BASE_COLOR_DARK_BLUEGREEN[2]/255.0;//0.2;
	
	
					f2.vertexColors[0].setRGB(r,g,b);//.push( new THREE.Color( r,g,b, 0.2 ) );
					f2.vertexColors[1].setRGB(r,g,b);//.push( new THREE.Color( r,g,b, 0.2 ) );
					f2.vertexColors[2].setRGB(r,g,b);//.push( new THREE.Color(  r,g,b, 0.2 ) );
	
					//uvs_w[0].push( uvs[0][n] );
					//faces_w.push(f2);
				}else {
					const f2 = new THREE.Face3( f.a, f.b, f.c, f.normal, f.color );
					f2.a = verts_w.push( new THREE.Vector3().copy( verts[f.a] ).multiplyScalar( 1.0 - 0.06 * (heightScalar*2) ) )-1;
					f2.b = verts_w.push( new THREE.Vector3().copy( verts[f.b] ).multiplyScalar( 1.0 - 0.06 * (heightScalar*2) ) )-1;
					f2.c = verts_w.push( new THREE.Vector3().copy( verts[f.c] ).multiplyScalar( 1.0 - 0.06 * (heightScalar*2) ) )-1;
					//const r = BASE_COLOR_LIGHT_TAN[0]/255.0;//0.1;
					//const g = BASE_COLOR_LIGHT_TAN[1]/255.0;//0.8;
					//const b = BASE_COLOR_LIGHT_TAN[2]/255.0;//0.2;
					const r = BASE_COLOR_DARK_BLUEGREEN[0]/255.0;//0.1;
					const g = BASE_COLOR_DARK_BLUEGREEN[1]/255.0;//0.8;
					const b = BASE_COLOR_DARK_BLUEGREEN[2]/255.0;//0.2;


					f2.vertexColors.push( new THREE.Color( r,g,b, 0.2 ) );
					f2.vertexColors.push( new THREE.Color( r,g,b, 0.2 ) );
					f2.vertexColors.push( new THREE.Color(  r,g,b, 0.2 ) );

					uvs_w[0].push( uvs[0][n] );
					faces_w.push(f2);
				}
			}
		}

		const tmp = new THREE.Vector3();
		for( var n = 0; n < checkVerts; n++ ) {
			const v = verts[n];
			const h = height.get2( (1+v.x+xOfs)*spanx, (1+v.y+yOfs)*spany, (1+v.z+zOfs)*spanz, 0 );
			//const h = Math.random();
	//		const color = getColor( h );
	//		colors.push( new THREE.Color( color[0], color[1], color[2], color[3] ) );

			//const r = 0.95 + ( h * 0.1 );
			const r = (1.0-heightScalar) + ( h * (heightScalar*2) );
			if( newUpdate )
				vout.push( new THREE.Vector3().copy(v).multiplyScalar( r ) );
			else 
				vout[n].copy(v).multiplyScalar( r );
		}

		land.colorsNeedUpdate = true;
		land.verticesNeedUpdate  = true;
		land.elementsNeedUpdate   = true;

		water.colorsNeedUpdate = true;
		water.verticesNeedUpdate  = true;
		water.elementsNeedUpdate   = true;
		//console.log( "Update took:", (Date.now()-start)/1000)
	}
	updateVerts();
	return {
		update() {
			updateVerts();
		},
		newSeed() {
			faces_w.length = 0;
			vout.length = 0;
			verts_w.length = 0;
			uvs_w[0].length = 0;
			updateVerts();
		}
	}
}



}
 