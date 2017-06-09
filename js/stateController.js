/**
 * @file Class for handling mouse movement
 *
 * @author Hayato Ikoma <hikoma@stanford.edu>
 * @copyright The Board of Trustees of the Leland
 Stanford Junior University
 * @version 2017/03/28
 */


/**
 * State_controller
 *
 * @class StateController
 * @classdesc Class holding the state of a model and a viewer.
 *		This class accumulates the total mouse movement.
 *
 * @param  {DisplayParameters} dispParams display parameters
 */
var StateController = function ( dispParams ) {

	/**
	 * Varibles required for the computation of movel/view/projection matrices.
	 *
	 * @memberof StateController
	 * @type {Object}
	 * @property {Number} clipNear z position of near clipping plane
	 * @property {Number} clipFar z position of far clipping plane
	 * @property {THREE.Vector3} modelTranslation (x,y,z) translations
	 * 		for models
	 * @property {THREE.Vector3} modelRotation rotations for models
	 * @property {THREE.Vector3} viewerPosition (x,y,z) positions of a viewer
	 * @property {THREE.Vector3} viewerRotation the viewer's (x,y,z) rotation
	 * (i.e. pitch/yaw/roll)
	 * @property {Object} lights specity light's color and position
	 * @property {Number} renderingMode switch between normal and undistorted
	 * stereo rendering
	 * @property {THREE.Vector2} lensDistortion the lens distortion parameters
	 * used in stereoUnwarpRenderer. [K_1, K_2] in the lecture slide.
	 * @property {THREE.Quaternion} viewerQuaternion the quaternion representation
	 * of the viewer's rotation streamed from the Teensy
	 */


	this.state = {

		clipNear: 1.0,

		clipFar: 100000.0,

		modelTranslation: new THREE.Vector3(),

		modelRotation: new THREE.Vector3(),

		viewerPosition:
			new THREE.Vector3( 0, 0, dispParams.distanceScreenViewer ),

		lights: {

			pointLights: [
				{

					position: new THREE.Vector3( 100, 100, 200 ),

					color: new THREE.Color( "red" ),

				}
			],

			directionalLights: [],

		},

		renderingMode: STEREO_MODE,

		lensDistortion: new THREE.Vector2( 0.0003, 0.0 ),

		viewerQuaternion: new THREE.Quaternion(),

		rgbBuffer: [],

        rgbBufferUpdate: false,
        
        depthBuffer: [],

        depthBufferUpdate: false

	};

	var state = this.state;

	var connectionMsg = false;

	/* Initialize WebSocket */
	var socket = new WebSocket( "ws://localhost:8081" );
	socket.binaryType = "arraybuffer";



	socket.onopen = function () {

		var openMsg = "WebSocket is opened.";

		socket.send( openMsg );

		console.log( openMsg );

		connectionMsg = "Connected!";

	};

	socket.onclose = function () {

		console.log( "WebSocket is closed." );

		connectionMsg = "Lost...";

	};

	socket.onmessage = function ( data ) {
        // keep track of when we've updated for the front end 
        state.rgbBuffer = data.data;
        state.rgbBufferUpdated = true; 
	};


	var socket2 = new WebSocket( "ws://localhost:8082" );
	socket2.binaryType = "arraybuffer";
	socket2.onopen = function () {

		var openMsg = "WebSocket is opened.";

		console.log( openMsg );
	};

	socket2.onclose = function () {

		console.log( "WebSocket2 is closed." );
	};

	socket2.onmessage = function ( data ) {
        state.depthBuffer = data.data;
        state.depthBufferUpdated = true; 
	};

	/**
	 * A variable to store mouse movement.
	 *
	 * @memberof StateController
	 * @property {THREE.Vector2} movement
	 */
	var movement = new THREE.Vector2();


	/**
	 * A variable to store the mouse position on the previous call.
	 *
	 * @memberof StateController
	 * @property {THREE.Vector2} movement
	 */
	var previousPosition = new THREE.Vector2();


	/**
	 * A variable to check the click status.
	 *
	 * @memberof StateController
	 * @property {Boolean} clickHold
	 */
	var clickHold = false;



	/**
	 * _onClick - called when the mouse is clicked.
	 *
	 * @memberof StateController
	 * @param  {Number} x the x position of the mouse cursor
	 * @param  {Number} y the x position of the mouse cursor
	 */
	this._onClick = function ( x, y ) {

		clickHold = true;

		previousPosition.set( x, y );

	};


	/**
	 * _releaseClick - called when the mouse click is released or the mouse
	 *  	cursor goes to the outside of the window.
	 *
	 * @memberof StateController
	 */
	this._releaseClick = function () {

		clickHold = false;

	};


	/**
	 * _onMove - called when the mouse cursor is moved.
	 *
	 * @memberof StateController
	 * @param  {Event} e event
	 * @param  {Number} x the x position of the mouse cursor
	 * @param  {Number} y the x position of the mouse cursor
	 */
	this._onMove = function ( e, x, y ) {

		/* Check the mouse is clicked. If not, do nothing. */
		if ( ! clickHold ) return;

		/***
 		 * In jQuery, the origin is at top-left.
 		 * Three.js/WebGL has its origin at bottom-left.
 		 * Store the mouse movement between frames
 		 */
		movement.set( x - previousPosition.x, previousPosition.y - y );

		previousPosition.set( x, y );

	};


	/**
	 * display- display the scene parameters
	 *
	 * @memberof StateController
	 */
	this.display = function () {

		$( "#positionVal" ).html(

			"<p>Viewer position: " +
				vector3ToString( this.state.viewerPosition ) + "</p>" +
			"<p>Lens distortion: " +
				vector2ToString( this.state.lensDistortion ) + "</p>" +
			"<p>Quaternion: " +
				quaternionToString( this.state.viewerQuaternion ) + "</p>" +
			"<p>WebSocket connection: " + connectionMsg + "</p>"

		);

	};


	/* Attach the functiones defined above to the buttons with jQuery. */
	var _this = this;

	$( ".renderCanvas" ).on( {

		"mousedown": function ( e ) {

			_this._onClick( e.pageX, e.pageY );

		},

		"mousemove": function ( e ) {

			_this._onMove( e, e.pageX, e.pageY );

			e.preventDefault();

		},

		"mouseout": function ( ) {

			_this._releaseClick();

		},

		"mouseup": function ( ) {

			_this._releaseClick();

		},

	} );

	function switchRenderingMode() {

		if ( _this.state.renderingMode === STEREO_MODE ) {

			_this.state.renderingMode = STEREO_UNWARP_MODE;

			$( "#renderingSwitchBtn" ).html( "Stereo Unwarp" );

		} else if ( _this.state.renderingMode === STEREO_UNWARP_MODE ) {

			_this.state.renderingMode = STEREO_MODE;

			$( "#renderingSwitchBtn" ).html( "Stereo" );

		}

	}


	var viewerPosition = this.state.viewerPosition;
	var lensDistortion = this.state.lensDistortion;

	$( "html" ).keydown( function ( e ) {

		switch ( e.which ) {

			case 87: /* Key w */

				/* Move forward */
				viewerPosition.z -= 10;

				break;

			case 83: /* Key s */

				/* Move backward */
				viewerPosition.z += 10;

				break;

			case 68: /* Key d */

				/* Move right */
				viewerPosition.x += 10;

				break;

			case 65: /* Key a */

				/* Move left */
				viewerPosition.x -= 10;

				break;

			case 49: /* Switch rendering mode: Key 1 */

				switchRenderingMode();

				break;

			case 50: /* Increase K_1: Key 2 */

				lensDistortion.x += 0.00001;

				break;

			case 51: /* Decrease K_1 of the distortion parameter: Key 3 */

				lensDistortion.x -= 0.00001;

				break;

			case 52: /* Increase K_2: Key 4 */

				lensDistortion.y += 0.0000001;

				break;

			case 53: /* Decrease K_2: Key 5 */

				lensDistortion.y -= 0.0000001;

				break;

		}

	} );


	/***
	 * By clicking the rendering switch botton, the rendering mode is changed.
	 */
	$( "#renderingSwitchBtn" ).click( function () {

		switchRenderingMode();

	} );

};
