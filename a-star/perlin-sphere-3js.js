
import {SaltyRNG} from "./salty_random_generator.js"
import * as THREE  from "./three.js/build/three.module.js"
import {consts,Vector3Pool} from "./three.js/personalFill.js"
import {myPerspective} from './three.js/my_perspective.js'

import {TrackballControls} from "./three.js/TrackballControls.js"



var config = {
	patchSize : 128,
	seed_noise : null,
	gen_noise : null,
	nodes : [],  // trace of A*Path
	base : 0,
	generations : 6,
	seed : Date.now(),
}

let renderer = null;
let sceneRoot = null;
let scene = null;
let scene2 = null;
let scene3 = null;
let camera = null;
let cameraControls = null;

const CUBE_ELEMENT_SIZE = 16

init();
animate();

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
	camera = new THREE.PerspectiveCamera( 90, rect.width / rect.height, 0.001, 10000 );
	//myPerspective( camera.projectionMatrix, 90, rect.width / rect.height, 0.01, 10000 );

	{
   	renderer = new THREE.WebGLRenderer( { canvas : config.canvas } );
		renderer.autoClear = true;
		renderer.autoClearColor = true;
		
		if(0)
		{
			renderer.setSize( window.innerWidth, window.innerHeight );
			window.addEventListener( "resize", ()=>{
				var rect = config.canvas.getBoundingClientRect();
				myPerspective( camera.projectionMatrix, 90, rect.width/rect.height, 0.01, 10000 );
				renderer.setSize( rect.width, rect.height ) 
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
		camera.position.z = 1.5;
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



		const geometry = new THREE.BoxGeometry( 1, 1, 1 );
		// create the Cube
				//cube = new THREE.Mesh( new THREE.CubeGeometry( 200, 200, 200 ), new THREE.MeshNormalMaterial() );
		//				cube.position.y = 150;
		const material2 = new THREE.MeshNormalMaterial();
		const material = new THREE.MeshBasicMaterial( {color: 0x00ff00} );
		const cube = new THREE.Mesh( geometry, material2 );
		scene.add( cube )
}



		

		// animation loop
		function animate() {

			// loop on request animation loop
			// - it has to be at the begining of the function
			// - see details at http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
			requestAnimationFrame( animate );

			// do the render
			render();

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

