4
import {SaltyRNG} from "./salty_random_generator.js"
import * as THREE  from "./three.js/build/three.module.js"
import {consts,Vector3Pool} from "./three.js/personalFill.js"
import {myPerspective} from './three.js/my_perspective.js'

import {TrackballControls} from "./three.js/TrackballControls.js"
import {noise} from "./perlin-sphere-3.js"
import {lnQuat} from "./lnQuatSq.js"
//import {

const sliders = [
	document.getElementById( "Slider1" ),
	document.getElementById( "Slider2" ),
	document.getElementById( "Slider3" ),
	document.getElementById( "Slider4" ),
	document.getElementById( "Slider5" ),
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
	generations : 5,
	seed : Date.now(),
}

let renderer = null;
let sceneRoot = null;
let scene = null;
let scene2 = null;
let scene3 = null;
let camera = null;
let cameraControls = null;

let height = noise( 1.0, config );
let rough = noise( 1.0, config );

let heightScalar = 0.1;
let heightOffset = 0;
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
	const v5 = sliders[4].value/100;

	heightScalar = v1 * 0.4;
	heightOffset = v5 * 0.6 - 0.3;
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
		const geometry = new THREE.IcosahedronGeometry( 0, 5 );
		const geometryWater = new THREE.Geometry( );
		const geometrySquare = new THREE.Geometry( );
		// create the Cube
				//cube = new THREE.Mesh( new THREE.CubeGeometry( 200, 200, 200 ), new THREE.MeshNormalMaterial() );
		//				cube.position.y = 150;
		const update2 = mangleGeometry( geometry, geometryWater );
		
		// 32 = 13068, 24576, 
		// 64 = 50700, 98304,
		const update = computeBall( geometrySquare, 40 );

		sliders[0].addEventListener( "input", getValues );
		sliders[1].addEventListener( "input", getValues );
		sliders[2].addEventListener( "input", getValues );
		sliders[3].addEventListener( "input", getValues );
		sliders[4].addEventListener( "input", getValues );

		buttons[0].addEventListener("click",()=>{
			config.seed = new Date();
			config.cache = [];
			height = noise( 1.0, config );
			rough = noise( 1.0, config );
			update.newSeed();
		})


		const materialNormal = new THREE.MeshNormalMaterial();
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


		const ball = new THREE.Mesh( geometrySquare, material );
		const cube = new THREE.Mesh( geometry, material );
		const water = new THREE.Mesh( geometryWater, materialWater );

		scene.add( ball )
		scene.add( cube )
		cube.add( water )
		cube.position.set(3.0, 0.0, 0.0);


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
				update2.newSeed();
			}
			// update stats
			//stats.update();
		}

		// render the scene
		function render() {
			// update camera controls
			cameraControls.update();

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


function getColor2( here ) {
	here = (here - 0.8)/0.4;
	for( var r = 1; r < RANGES_THRESH.length; r++ ) {
			if( here <= RANGES_THRESH[r] ) {
				return ColorAverage( RANGES[r-1], RANGES[r+0], (here-RANGES_THRESH[r-1])/(RANGES_THRESH[r+0]-RANGES_THRESH[r-1]) * 1000, 1000 );
			}
	}
	// somehow out of range.
	return BASE_COLOR_WHITE;
}

function getColor( here ) {
	//here = (here - 0.8)/0.4;
	for( var r = 1; r < RANGES_THRESH.length; r++ ) {
			if( here <= RANGES_THRESH[r] ) {
				return ColorAverage( RANGES[r-1], RANGES[r+0], (here-RANGES_THRESH[r-1])/(RANGES_THRESH[r+0]-RANGES_THRESH[r-1]) * 1000, 1000 );
			}
	}
	// somehow out of range.
	return BASE_COLOR_WHITE;
}

function deg2rad(x) { return x * Math.PI / 180.0 }

function computeBall( geometry, size ) {
	const vertices = geometry.vertices;
	const faces = geometry.faces;
	const norms = geometry.normals;
	const colors = geometry.colors;
	const lnQ = new lnQuat();
	const latStep = deg2rad(60) / size; // 180/3 / size
	const lngStep = deg2rad(60) / size; // 360/6 / size

	const lngOfs = lngStep/2;

	let latBase = 0;
	let priorLen = 0;
	let priorRow = vertices.length;
	let thisLen = 0;
	let thisRow = vertices.length;

	addVerts( true ) ;
	function addVerts(addFaces) {
		function fn(x,y,z,a) {
			//const r = rough.get2( 10+x*r_spanx, y*r_spanz, z*r_spanz, 0 );
			//const r2 = ( Math.acos( r*2-1 ) ) /Math.PI;
			//const h = (height.get2( x*spanx, y*spany, z*spanz, 0 )-0.44)*(r2)+0.44;
			const h = height.get2( (x+xOfs)*90, (y+yOfs)*90, (z+zOfs)*90, 0 );
			const out = (1-Math.cos( h * Math.PI )) /2;
			const r = (1.0-heightScalar) + ( out * (heightScalar*2) );
			return r + heightOffset;//0.8 + ( out * 0.4 );
		}


		let v = 0;


		for( let lat = 0; lat <= size; lat++ ) {
			priorRow = thisRow;
			priorLen = thisLen;
			thisRow = vertices.length;
			const len = thisLen = lat *2+1;
			const midlen = (lat+1);
			for(let pp = 0; pp < 3; pp++ )
				for( let lng = 0; lng < len; lng++ ){

					const qlat = lat * deg2rad(60)/size;
					const qlng = (pp * deg2rad(120)) + lng * (deg2rad(30)/(lat||1)*2);

					const basis = lnQ.set( {lat:qlat, lng:qlng}, true ).getBasis();
					const up2 = { x:-basis.up.x, y:-basis.up.y, z:-basis.up.z } ;
					const h = fn( basis.up.x, basis.up.y, basis.up.z, 0 );
					const color1 = getColor2( h );
					const h2 = fn( -basis.up.x, -basis.up.y, -basis.up.z, 0 );
					const color2 = getColor2( h2 );
					if( addFaces ) {					
						vertices.push( new THREE.Vector3( basis.up.x, basis.up.y, basis.up.z  ).multiplyScalar(h) );
						colors.push( new THREE.Color( color1[0], color1[1],color1[2]))
						vertices.push( new THREE.Vector3( -basis.up.x, -basis.up.y, -basis.up.z  ).multiplyScalar(h2) );
						colors.push( new THREE.Color( color2[0], color2[1],color2[2]))
					}else{
						const c1 = colors[v];
						const v1 = vertices[v++];
						const c2 = colors[v];
						const v2 = vertices[v++];
						c1.r = color1[0];
						c1.g = color1[1];
						c1.b = color1[2];
						v1.x = basis.up.x*h;
						v1.y = basis.up.y*h;
						v1.z = basis.up.z*h;
						
						c2.r = color2[0];
						c2.g = color2[1];
						c2.b = color2[2];
						v2.x = -( basis.up.x*h2);
						v2.y = -( basis.up.y*h2);
						v2.z = -( basis.up.z*h2);
					}
					if( addFaces ){
						let f, fp1,fp2,fp3;
						if( lng < lat ) {
							// before the bend... 
							if( lng ) {
								// emmit a 4 face...
								//if( true ) continue;
								faces.push( f = new THREE.Face3( fp1=priorRow +( lng + pp*priorLen)*2,fp2=priorRow +( lng-1+ pp*priorLen)*2,fp3=thisRow+(lng + pp*thisLen)*2) );
								f.vertexColors.push( colors[fp1] );
								f.vertexColors.push( colors[fp2] );
								f.vertexColors.push( colors[fp3] );
								
								f.normal.copy( basis.up );
								faces.push( f = new THREE.Face3( fp1=priorRow +( lng-1+ pp*priorLen)*2,fp2=thisRow + (lng-1+ pp*thisLen)*2,fp3=thisRow+(lng+ pp*thisLen )*2) );
								f.vertexColors.push( colors[fp1] );
								f.vertexColors.push( colors[fp2] );
								f.vertexColors.push( colors[fp3] );
								f.normal.copy( basis.up );

								faces.push( f = new THREE.Face3( fp1=priorRow +( lng-1+ pp*priorLen)*2+1,fp2=priorRow +( lng + pp*priorLen)*2+1,fp3=thisRow+(lng + pp*thisLen)*2+1) );
								f.vertexColors.push( colors[fp1] );
								f.vertexColors.push( colors[fp2] );
								f.vertexColors.push( colors[fp3] );
								f.normal.copy( up2 );
								faces.push( f = new THREE.Face3( fp1=thisRow + (lng-1+ pp*thisLen)*2+1,fp2=priorRow +( lng-1+ pp*priorLen)*2+1,fp3=thisRow+(lng+ pp*thisLen )*2+1  ));
								f.vertexColors.push( colors[fp1] );
								f.vertexColors.push( colors[fp2] );
								f.vertexColors.push( colors[fp3] );
								f.normal.copy( up2 );
							}
						} else if( lng < midlen ){
							// on the corner... do the point, no face yet.
						} else if( lng === midlen ){
							// this is around the bend.
							//if(true)continue;
							faces.push( f = new THREE.Face3( fp1=priorRow + (lng-2+ pp*priorLen)*2,fp2=thisRow + (lng-2+ pp*thisLen)*2,fp3=thisRow+(lng-1+ pp*thisLen)*2 ) );
							f.vertexColors.push( colors[fp1] );
							f.vertexColors.push( colors[fp2] );
							f.vertexColors.push( colors[fp3] );
							f.normal.copy( basis.up );
							faces.push( f = new THREE.Face3( fp1=priorRow + (lng-2+ pp*priorLen)*2,fp2=thisRow + (lng-1+ pp*thisLen)*2,fp3=thisRow+(lng+ pp*thisLen)*2 ) );
							f.vertexColors.push( colors[fp1] );
							f.vertexColors.push( colors[fp2] );
							f.vertexColors.push( colors[fp3] );
							f.normal.copy( basis.up );

							faces.push( f = new THREE.Face3( fp1=thisRow + (lng-2+ pp*thisLen)*2+1,fp2=priorRow + (lng-2+ pp*priorLen)*2+1,fp3=thisRow+(lng-1+ pp*thisLen)*2+1 ) );
							f.vertexColors.push( colors[fp1] );
							f.vertexColors.push( colors[fp2] );
							f.vertexColors.push( colors[fp3] );
							f.normal.copy( up2 );
							faces.push( f = new THREE.Face3( fp1=thisRow + (lng-1+ pp*thisLen)*2+1,fp2=priorRow + (lng-2+ pp*priorLen)*2+1,fp3=thisRow+(lng+ pp*thisLen)*2+1 ) );
							f.vertexColors.push( colors[fp1] );
							f.vertexColors.push( colors[fp2] );
							f.vertexColors.push( colors[fp3] );
							f.normal.copy( up2 );

						} else {
							//if(true)continue;
							// past the bend, going up...
							faces.push( f = new THREE.Face3( fp1=priorRow + (lng-3+1+pp*priorLen)*2,fp2=priorRow + (lng-3+pp*priorLen)*2,fp3=thisRow+(lng-1 + pp*thisLen)*2 ) );
							f.vertexColors.push( colors[fp1] );
							f.vertexColors.push( colors[fp2] );
							f.vertexColors.push( colors[fp3] );
							f.normal.copy( basis.up );
							faces.push( f = new THREE.Face3( fp1=thisRow + (lng+pp*thisLen)*2,fp2=priorRow + (lng-2+pp*priorLen)*2,fp3=thisRow+(lng-1+pp*thisLen)*2 ) );
							f.vertexColors.push( colors[fp1] );
							f.vertexColors.push( colors[fp2] );
							f.vertexColors.push( colors[fp3] );
							f.normal.copy( basis.up );

							faces.push( f = new THREE.Face3( fp1=priorRow + (lng-3+pp*priorLen)*2+1,fp2=priorRow + (lng-3+1+pp*priorLen)*2+1,fp3=thisRow+(lng-1 + pp*thisLen)*2+1 ) );
							f.vertexColors.push( colors[fp1] );
							f.vertexColors.push( colors[fp2] );
							f.vertexColors.push( colors[fp3] );
							f.normal.copy( up2 );
							faces.push( f = new THREE.Face3( fp1=thisRow + (lng-1+pp*thisLen)*2+1,fp2=priorRow + (lng-2+pp*priorLen)*2+1,fp3=thisRow+(lng+pp*thisLen)*2+1 ) );
							f.vertexColors.push( colors[fp1] );
							f.vertexColors.push( colors[fp2] );
							f.vertexColors.push( colors[fp3] );
							f.normal.copy( up2 );
					}
					}
				}
		}

		
		const sqStep = deg2rad(60) / (size); // 360/6 / size
		for( let eqp = 0; eqp < 6; eqp++ ) {
			const eqStart = vertices.length;
			//console.log( "vertices start at:", eqStart );
			for( let lat = 0; lat <= size; lat++ ) {
				const thisRow = eqStart + (lat-1)*(size+1);
				const nextRow = eqStart + (lat)*(size+1);
				for( let lng = 0; lng <= size; lng++ ) {
					// 0, 2  (1, 3)  120, 40
					const basis = lnQ.set( {lat:deg2rad(60) + sqStep * lat, lng:deg2rad(60)*eqp + lng*sqStep }, true ).getBasis();
					const h = fn( basis.up.x, basis.up.y, basis.up.z, 0 );
					const color1 = getColor2( h );
					if( addFaces ){
						vertices.push( new THREE.Vector3( basis.up.x, basis.up.y, basis.up.z  ).multiplyScalar(h) );
						colors.push( new THREE.Color( color1[0], color1[1],color1[2]))
					} else{
						const c1 = colors[v];
						const v1 = vertices[v++];
						c1.r = color1[0];
						c1.g = color1[1];
						c1.b = color1[2];
						v1.x = basis.up.x*h;
						v1.y = basis.up.y*h;
						v1.z = basis.up.z*h;
					}

					if( lat && lng && addFaces ){
						let f, fp1,fp2,fp3;

						// 0, 2  (1, 3)  120, 40
						//const v1 = vertices[eqStart + lat*size*6 + lng]
						faces.push( f = new THREE.Face3(  fp1 = thisRow+lng-1, fp2 = nextRow+lng-1, fp3 = thisRow+(lng)  ) );
						f.vertexColors.push( colors[fp1] );
						f.vertexColors.push( colors[fp2] );
						f.vertexColors.push( colors[fp3] );
						f.normal.copy( basis.up );
						faces.push( f = new THREE.Face3(  fp1 = nextRow+lng-1, fp2 = nextRow+(lng), fp3 = thisRow+(lng)  ) );
						f.vertexColors.push( colors[fp1] );
						f.vertexColors.push( colors[fp2] );
						f.vertexColors.push( colors[fp3] );
						f.normal.copy( basis.up );
					}
		
				}
			}

		}

		
		if(1)
		{
			var cb = new THREE.Vector3(), ab = new THREE.Vector3();
			for (var i=0; i<geometry.faces.length; ++i) {
				var f = geometry.faces[i];
				var vA = geometry.vertices[f.a];
				var vB = geometry.vertices[f.b];
				var vC = geometry.vertices[f.c];
				cb.subVectors(vC, vB);
				ab.subVectors(vA, vB);
				cb.cross(ab);
				cb.normalize();
				if (geometry.faces[i].length == 3) {
					continue;
				}

				if( cb.length() < 0.001 ){
					cb.subVectors(vB, vA);
					ab.subVectors(vC, vA);
					cb.cross(ab);
					cb.normalize();
					if (geometry.faces[i].length == 3) {
						continue;
					}

				}

				// quad
				if (f.d /*cb.isZero()*/) {
					// broken normal in the first triangle, let's use the second triangle
					var vA = geometry.vertices[f.a];
					var vB = geometry.vertices[f.c];
					var vC = geometry.vertices[f.d];
					//if( !vA || !vB || !vC ) debugger;
					cb.subVectors(vC, vB);
					ab.subVectors(vA, vB);
					cb.cross(ab);
					cb.normalize();
				}
				f.normal.copy(cb);
			}
		}
	}
	function updateVerts() {

	}

	return {
		update() {
			//vertices.length = 0;
			//uvs[0].length = 0;
			addVerts( false );
			geometry.colorsNeedUpdate = true;
			geometry.verticesNeedUpdate  = true;
			geometry.elementsNeedUpdate   = true;
		},
		newSeed() {
			//faces.length = 0;
			//vout.length = 0;
			//vertices.length = 0;
			//uvs[0].length = 0;
			addVerts( false );
			geometry.colorsNeedUpdate = true;
			geometry.verticesNeedUpdate  = true;
			geometry.elementsNeedUpdate   = true;
		}
	}

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
	land.colorsNeedUpdate = true;

	function updateVerts() {
		//const start = Date.now();
		const newUpdate = !vout.length;


		const spanx = 90;
		const spany = 90;
		const spanz = 90;

		const r_spanx = 28;
		const r_spany = 28;
		const r_spanz = 28;
	
		function fn(x,y,z,a) {
				//const r = rough.get2( 10+x*r_spanx, y*r_spanz, z*r_spanz, 0 );
				//const r2 = ( Math.acos( r*2-1 ) ) /Math.PI;
				//const h = (height.get2( x*spanx, y*spany, z*spanz, 0 )-0.44)*(r2)+0.44;
				const h = height.get2( x*spanx, y*spany, z*spanz, 0 );
				const out = (1-Math.cos( h * Math.PI )) /2;
				const r = (1.0-heightScalar) + ( out * (heightScalar*2) ) + heightOffset;
				return r;
		if(0)
				if( h < 0.7 && h > 0.3 ) {
					const out = ( Math.acos( h*2-1 ) ) /(Math.PI);
					return out;
				} else {
					if( h < 0.5 ) {
						const out = (1+Math.cos( h * Math.PI )) /2 ;
						return out;
					}else {
						const out = (1+Math.cos( h * Math.PI )) /2 + 0.2;
						return out;
					}
				}

		}


		for( var n = 0; n < checkFaces; n++ ) {
			const f = faces[n];	
			const p1 = verts[f.a];
			const p2 = verts[f.b];
			const p3 = verts[f.c];
			let addOne = false;
			let newF = 0;
			f.vertexColors.length = 0;
			{
				const h = fn( (p1.x+xOfs), (p1.y+yOfs), (p1.z+zOfs), 0 );
				if( h < RANGES_THRESH[3] )
					addOne = true;
				//const h = Math.random();
				const color = getColor2( h );
				f.vertexColors.push( new THREE.Color( color[0], color[1], color[2], color[3] ) );
			}
			{
				const h = fn( (p2.x+xOfs), (p2.y+yOfs), (p2.z+zOfs), 0 );
				if( h < RANGES_THRESH[3] )
					addOne = true;
				//const h = Math.random();
				const color = getColor2( h );
				f.vertexColors.push( new THREE.Color( color[0], color[1], color[2], color[3] ) );
			}
			{
				const h = fn( (p3.x+xOfs), (p3.y+yOfs), (p3.z+zOfs), 0 );
				if( h < RANGES_THRESH[3] )
					addOne = true;
				//const h = Math.random();
				const color = getColor2( h );
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
			const h = fn( (v.x+xOfs), (v.y+yOfs), (v.z+zOfs), 0 );

			const r = h;//(1.0-heightScalar) + ( h * (heightScalar*2) ) + heightOffset;
			if( newUpdate )
				vout.push( new THREE.Vector3().copy(v).multiplyScalar( r ) );
			else 
				vout[n].copy(v).multiplyScalar( r );
		}

		if(1)
		{
			const geometry = land;
			var cb = new THREE.Vector3(), ab = new THREE.Vector3();
			for (var i=0; i<geometry.faces.length; ++i) {
				var f = geometry.faces[i];
				var vA = geometry.vertices[f.a];
				var vB = geometry.vertices[f.b];
				var vC = geometry.vertices[f.c];
				cb.subVectors(vC, vB);
				ab.subVectors(vA, vB);
				cb.cross(ab);
				cb.normalize();
				if (geometry.faces[i].length == 3) {
					continue;
				}

				if( cb.length() < 0.001 ){
					cb.subVectors(vB, vA);
					ab.subVectors(vC, vA);
					cb.cross(ab);
					cb.normalize();
					if (geometry.faces[i].length == 3) {
						continue;
					}

				}

				// quad
				if (f.d /*cb.isZero()*/) {
					// broken normal in the first triangle, let's use the second triangle
					var vA = geometry.vertices[f.a];
					var vB = geometry.vertices[f.c];
					var vC = geometry.vertices[f.d];
					//if( !vA || !vB || !vC ) debugger;
					cb.subVectors(vC, vB);
					ab.subVectors(vA, vB);
					cb.cross(ab);
					cb.normalize();
				}
				f.vertexNormals.length = 0;
				f.normal.copy(cb);
			}
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
 