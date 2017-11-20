/**
 * @author qiao / https://github.com/qiao
 * @author mrdoob / http://mrdoob.com
 * @author alteredq / http://alteredqualia.com/
 * @author WestLangley / http://github.com/WestLangley
 * @contributor d3x0r / http://github.com/d3x0r  - add enable/disable to allow disconnecting these events
 */
//var THREE = window.THREE;


THREE.OrbitControls = function ( object, clusterLookAt, domElement ) {
	// mode 1, is limited
	this.mode = 2;
	this.object = object;
	this.cluster = clusterLookAt;
	this.domElement = ( domElement !== undefined ) ? domElement : document;

	// API

	this.enabled = true;

	this.center = new THREE.Vector3();

	this.userZoom = true;
	this.userZoomSpeed = 0.10;

	this.userRotate = true;
	this.userRotateSpeed = 1.0;

	this.userPan = true;
	this.userPanSpeed = 2.0;

	this.autoRotate = false;
	this.autoRotateSpeed = 2.0; // 30 seconds per round when fps is 60

	this.minPolarAngle = 0; // radians
	this.maxPolarAngle = Math.PI; // radians

	this.minDistance = 0;
	this.maxDistance = Infinity;

	// 65 /*A*/, 83 /*S*/, 68 /*D*/
	this.keys = { LEFT: 37, UP: 38, RIGHT: 39, BOTTOM: 40, ROTATE: 65, ZOOM: 83, PAN: 68 };

	// internals

	var scope = this;

	var EPS = 0.000001;
	var PIXELS_PER_ROUND = 1800;

	var rotateStart = new THREE.Vector2();
	var rotateEnd = new THREE.Vector2();
	var rotateDelta = new THREE.Vector2();

	var zoomStart = new THREE.Vector2();
	var zoomEnd = new THREE.Vector2();
	var zoomDelta = new THREE.Vector2();

	var phiDelta = 0;
	var thetaDelta = 0;
	var scale = 3;

	var lastPosition = new THREE.Vector3();

	var STATE = { NONE: -1, ROTATE: 0, ZOOM: 1, PAN: 2 };
	var state = STATE.NONE;

	// events

	var changeEvent = { type: 'change' };


	this.rotateLeft = function ( angle ) {

		if ( angle === undefined ) {

			angle = getAutoRotationAngle();

		}

		thetaDelta -= angle;

	};

	this.rotateRight = function ( angle ) {

		if ( angle === undefined ) {

			angle = getAutoRotationAngle();

		}

		thetaDelta += angle;

	};

	this.rotateUp = function ( angle ) {

		if ( angle === undefined ) {

			angle = getAutoRotationAngle();

		}

		phiDelta -= angle;

	};

	this.rotateDown = function ( angle ) {

		if ( angle === undefined ) {

			angle = getAutoRotationAngle();

		}

		phiDelta += angle;

	};

	this.zoomIn = function ( zoomScale ) {

		if ( zoomScale === undefined ) {

			zoomScale = getZoomScale();

		}

		scale /= zoomScale;

	};

	this.zoomOut = function ( zoomScale ) {

		if ( zoomScale === undefined ) {

			zoomScale = getZoomScale();

		}

		scale *= zoomScale;
		
	};

	this.pan = function ( distance ) {

		distance.transformDirection( this.object.matrix );
		distance.multiplyScalar( scope.userPanSpeed );

		this.object.position.add( distance );
		this.center.add( distance );

	};

	this.update = function () {

		var position = this.object.position;
		var offset = position.clone().sub( this.center );

		// angle from z-axis around y-axis

		var theta = Math.atan2( offset.x, offset.z );

		// angle from y-axis

		var phi = Math.atan2( Math.sqrt( offset.x * offset.x + offset.z * offset.z ), offset.y );

		if ( this.autoRotate ) {

			this.rotateLeft( getAutoRotationAngle() );

		}

		if( this.mode == 2 ) {
			if( phiDelta || thetaDelta ) {
				this.object.matrix.rotateRelative( -phiDelta, thetaDelta, 0 );
				this.object.matrix.rotateRelative( 0, 0, -this.object.matrix.roll )
				var tmp = this.center.clone().addScaledVector( this.object.matrix.backward, offset.length() *(scale) );
				this.object.matrix.origin.copy( tmp );
				this.object.matrixWorldNeedsUpdate = true;
			}
		} else {
			theta += thetaDelta;
			phi += phiDelta;

			// restrict phi to be between desired limits
			phi = Math.max( this.minPolarAngle, Math.min( this.maxPolarAngle, phi ) );

			// restrict phi to be betwee EPS and PI-EPS
			phi = Math.max( EPS, Math.min( Math.PI - EPS, phi ) );

			var radius = offset.length() * scale;

			// restrict radius to be between desired limits
			radius = Math.max( this.minDistance, Math.min( this.maxDistance, radius ) );

			offset.x = radius * Math.sin( phi ) * Math.sin( theta );
			offset.y = radius * Math.cos( phi );
			offset.z = radius * Math.sin( phi ) * Math.cos( theta );

			position.copy( this.center ).add( offset );

	        //console.log( "update lookAt?", thetaDelta, phiDelta)

			this.object.lookAt( this.center );

	        this.object.matrixWorldNeedsUpdate = true;
		}
		thetaDelta = 0;
		phiDelta = 0;
		//scale = 1;

		if ( lastPosition.distanceTo( this.object.position ) > 0 ) {

			this.dispatchEvent( changeEvent );

			lastPosition.copy( this.object.position );

		}

	};


	function getAutoRotationAngle() {

		return 2 * Math.PI / 60 / 60 * scope.autoRotateSpeed;

	}

	function getZoomScale() {

		return Math.pow( 0.95, scope.userZoomSpeed );

	}

	function onMouseDown( event ) {

		if ( scope.enabled === false ) return;
		if ( scope.userRotate === false ) return;

		event.preventDefault();

		if ( state === STATE.NONE )
		{
			if ( event.button === 0 )
				state = STATE.ROTATE;
			if ( event.button === 1 )
				state = STATE.ZOOM;
			if ( event.button === 2 )
				state = STATE.PAN;
		}


		if ( state === STATE.ROTATE ) {

			//state = STATE.ROTATE;

			rotateStart.set( event.clientX, event.clientY );

		} else if ( state === STATE.ZOOM ) {

			//state = STATE.ZOOM;

			zoomStart.set( event.clientX, event.clientY );

		} else if ( state === STATE.PAN ) {

			//state = STATE.PAN;

		}

		document.addEventListener( 'mousemove', onMouseMove, false );
		document.addEventListener( 'mouseup', onMouseUp, false );

	}

	function onMouseMove( event ) {

		if ( scope.enabled === false ) return;

		event.preventDefault();



		if ( state === STATE.ROTATE ) {

			rotateEnd.set( event.clientX, event.clientY );
			rotateDelta.subVectors( rotateEnd, rotateStart );

			scope.rotateLeft( 2 * Math.PI * rotateDelta.x / PIXELS_PER_ROUND * scope.userRotateSpeed );
			scope.rotateUp( 2 * Math.PI * rotateDelta.y / PIXELS_PER_ROUND * scope.userRotateSpeed );

			rotateStart.copy( rotateEnd );

		} else if ( state === STATE.ZOOM ) {

			zoomEnd.set( event.clientX, event.clientY );
			zoomDelta.subVectors( zoomEnd, zoomStart );

			if ( zoomDelta.y > 0 ) {

				scope.zoomIn();

			} else {

				scope.zoomOut();

			}

			zoomStart.copy( zoomEnd );

			var position = scope.object.position;
			var offset = position.clone().sub( scope.center );

			var tmp = scope.center.clone().addScaledVector( scope.object.matrix.backward, offset.length() *(scale) );
			scope.object.matrix.origin.copy( tmp );

		        scope.object.matrixWorldNeedsUpdate = true;

		} else if ( state === STATE.PAN ) {

			var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
			var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

			scope.pan( new THREE.Vector3( - movementX, movementY, 0 ) );

		}

	}

	function onMouseUp( event ) {

		if ( scope.enabled === false ) return;
		if ( scope.userRotate === false ) return;

		document.removeEventListener( 'mousemove', onMouseMove, false );
		document.removeEventListener( 'mouseup', onMouseUp, false );

		state = STATE.NONE;

	}

	function onMouseWheel( event ) {

		if ( scope.enabled === false ) return;
		if ( scope.userZoom === false ) return;

		var delta = 0;

		if ( event.wheelDelta ) { // WebKit / Opera / Explorer 9

			delta = event.wheelDelta;

		} else if ( event.detail ) { // Firefox

			delta = - event.detail;

		}

		if ( delta > 0 ) {

			scope.zoomOut();

		} else {

			scope.zoomIn();
		}

	}

	function onKeyDown( event ) {

		if ( scope.enabled === false ) return;
		if ( scope.userPan === false ) return;
		event.preventDefault();
		switch ( event.keyCode ) {

			/*case scope.keys.UP:
				scope.pan( new THREE.Vector3( 0, 1, 0 ) );
				break;
			case scope.keys.BOTTOM:
				scope.pan( new THREE.Vector3( 0, - 1, 0 ) );
				break;
			case scope.keys.LEFT:
				scope.pan( new THREE.Vector3( - 1, 0, 0 ) );
				break;
			case scope.keys.RIGHT:
				scope.pan( new THREE.Vector3( 1, 0, 0 ) );
				break;
			*/
			case scope.keys.ROTATE:
				state = STATE.ROTATE;
				break;
			case scope.keys.ZOOM:
				state = STATE.ZOOM;
				break;
			case scope.keys.PAN:
				state = STATE.PAN;
				break;

		}

	}

	function onKeyUp( event ) {

		switch ( event.keyCode ) {

			case scope.keys.ROTATE:
			case scope.keys.ZOOM:
			case scope.keys.PAN:
				event.preventDefault();
				state = STATE.NONE;
				break;
		}

	}

	var ongoingTouches = [];

	function copyTouch(touch) {
	  return { identifier: touch.identifier, pageX: touch.pageX, pageY: touch.pageY };
	}
	function ongoingTouchIndexById(idToFind) {
	  for (var i = 0; i < ongoingTouches.length; i++) {
	    var id = ongoingTouches[i].identifier;

	    if (id == idToFind) {
	      return i;
	    }
	  }
	  return -1;    // not found
	}
	function onTouchDown(event) {
	  event.preventDefault();
	  var touches = event.changedTouches;
	  for( var i = 0; i < touches.length; i++ ) {

			if ( scope.enabled === false ) return;
			if ( scope.userRotate === false ) return;

			event.preventDefault();

			if ( state === STATE.NONE )
			{
				if ( event.button === 0 )
					state = STATE.ROTATE;
				if ( event.button === 1 )
					state = STATE.ZOOM;
				if ( event.button === 2 )
					state = STATE.PAN;
			}


			if ( state === STATE.ROTATE ) {
				rotateStart.set( touches[0].pageX, touches[0].pageY );
			} else if ( state === STATE.ZOOM ) {
				//state = STATE.ZOOM;
				zoomStart.set( touches[0].pageX, touches[0].pageY );
			} else if ( state === STATE.PAN ) {
				//state = STATE.PAN;
			}


	    console.log( `touch ${i}=${touches[i]}`);
	    ongoingTouches.push( copyTouch( touches[i] ) );

	  }
	}

	function onTouchUp(event) {
	  event.preventDefault();
		var touches = event.changedTouches;
	  for( var i = 0; i < touches.length; i++ ) {
	    var idx = ongoingTouchIndexById(touches[i].identifier);
	    if( idx >= 0 ) {
				ongoingTouches.splice(idx, 1);  // remove it; we're done
			}
		}
	}

	function onTouchMove(event) {
	  event.preventDefault();
	  var touches = event.changedTouches;
	  for( var i = 0; i < touches.length; i++ ) {
	    var idx = ongoingTouchIndexById(touches[i].identifier);
			console.log( `got touch ${idx}` );
	    if( idx >= 0 ) {

				if ( scope.enabled === false ) return;

				if ( state === STATE.ROTATE ) {

					rotateEnd.set( touches[i].pageX, touches[i].pageY );
					rotateDelta.subVectors( rotateEnd, rotateStart );

					scope.rotateLeft( 2 * Math.PI * rotateDelta.x / PIXELS_PER_ROUND * scope.userRotateSpeed );
					scope.rotateUp( 2 * Math.PI * rotateDelta.y / PIXELS_PER_ROUND * scope.userRotateSpeed );

					rotateStart.copy( rotateEnd );

				} else if ( state === STATE.ZOOM ) {

					zoomEnd.set( event.clientX, event.clientY );
					zoomDelta.subVectors( zoomEnd, zoomStart );

					if ( zoomDelta.y > 0 ) {

						scope.zoomIn();

					} else {

						scope.zoomOut();

					}

					zoomStart.copy( zoomEnd );

				} else if ( state === STATE.PAN ) {

					var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
					var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

					scope.pan( new THREE.Vector3( - movementX, movementY, 0 ) );

				}



				ongoingTouches[idx].pageX = touches[i].pageX;
				ongoingTouches[idx].pageY = touches[i].pageY;
	      //ongoingTouches.splice( idx, 1, copyTouch( touches[i] ) );
	    }
	  }
	}

	function onTouchCancel(event) {
	  event.preventDefault();
		  console.log("touchcancel.");
		  var touches = event.changedTouches;

		  for (var i = 0; i < touches.length; i++) {
				var idx = ongoingTouchIndexById(touches[i].identifier);
		    if( idx >= 0 ) {
		    	ongoingTouches.splice(i, 1);  // remove it; we're done
				}
		  }
		}




    function ignore(event) {
        event.preventDefault();
    }
    this.disable = function(camera) {
    	scope.domElement.removeEventListener( 'contextmenu', ignore, false );
			scope.domElement.removeEventListener( 'touchstart', onTouchDown, false );
	    scope.domElement.removeEventListener( 'touchend', onTouchUp, false );
	    scope.domElement.removeEventListener( 'touchcancel', onTouchCancel, false );
	    scope.domElement.removeEventListener( 'touchmove', onTouchMove, false );
    	scope.domElement.removeEventListener( 'mousedown', onMouseDown, false );
    	scope.domElement.removeEventListener( 'mousewheel', onMouseWheel, false );
    	scope.domElement.removeEventListener( 'DOMMouseScroll', onMouseWheel, false ); // firefox
    	window.removeEventListener( 'keydown', onKeyDown, false );
    	window.removeEventListener( 'keyup', onKeyUp, false );
    }

    this.enable = function(camera) {
	var inst = document.getElementById( "controlInstruct" );
	if( inst ) {
		inst.innerHTML = "click drag to rotate; S to set zoom mode";
	}
    	scope.domElement.addEventListener( 'contextmenu', ignore, false );
			scope.domElement.addEventListener( 'touchstart', onTouchDown, false );
	    scope.domElement.addEventListener( 'touchend', onTouchUp, false );
	    scope.domElement.addEventListener( 'touchcancel', onTouchCancel, false );
	    scope.domElement.addEventListener( 'touchmove', onTouchMove, false );
    	scope.domElement.addEventListener( 'mousedown', onMouseDown, false );
    	scope.domElement.addEventListener( 'mousewheel', onMouseWheel, false );
    	scope.domElement.addEventListener( 'DOMMouseScroll', onMouseWheel, false ); // firefox
    	window.addEventListener( 'keydown', onKeyDown, false );
    	window.addEventListener( 'keyup', onKeyUp, false );
	if( camera )
		camera.matrixAutoUpdate = false;
    }
    this.enable();

};

THREE.OrbitControls.prototype = Object.create( THREE.EventDispatcher.prototype );
