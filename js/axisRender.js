/**
 * @file axisRender.js
 * This program renders the axis object based on the data received through
 * serial communication. The data is either Euler angles or Quaternion.
 *
 * @author Hayato Ikoma <hikoma@stanford.edu>
 * @copyright The Board of Trustees of the Leland
Stanford Junior University
 * @version 2017/03/28
 */

/* set up a renderer and a scene */
var renderer = new THREE.WebGLRenderer( { antialias: true } );

$( ".renderCanvas" ).prepend( renderer.domElement );

renderer.setSize( window.innerWidth, window.innerHeight );

var scene = new THREE.Scene();

scene.background = new THREE.Color( "gray" );


/* set up a performance monitor */
var stats = new Stats();

$( ".renderCanvas" ).prepend( stats.dom );


/* set up an axis object */
var axisObject = new THREE.AxisHelper( 100 );
axisObject.position.set( 0, 0, 0 );
scene.add( axisObject );


/* set up a camera */
var camera = new THREE.PerspectiveCamera(
	75, window.innerWidth / window.innerHeight, 10, 10000 );

camera.lookAt( new THREE.Vector3( .0, .0, .0 ) );
camera.position.y = 100;
camera.position.z = 300;


/* Initialize WebSocket */
var socket = new WebSocket( "ws://localhost:8081" );

socket.onopen = openSocket;

socket.onmessage = updateRotation;


/* Start rendering */
animate();


function openSocket() {

	socket.send( "WebSocket is opened." );

}


function updateRotation( result ) {

	var data = result.data.replace( /"/g, "" ).split( " " );

	if ( data[ 0 ] == "EC" ) {

		/* data: [EC pitch yaw roll] */
		axisObject.setRotationFromEuler(
			new THREE.Euler( data[ 1 ] * THREE.Math.DEG2RAD,
				data[ 2 ] * THREE.Math.DEG2RAD, data[ 3 ] * THREE.Math.DEG2RAD, "YXZ" )
		);

	} else 	if ( data[ 0 ] == "QC" ) {

		/* data: QC q[0] q[1] q[2] q[3] */
		var q = new THREE.Quaternion(
			data[ 2 ], data[ 3 ], data[ 4 ], data[ 1 ] );

		axisObject.setRotationFromQuaternion( q.normalize()	);

	} else {

		console.log( "Invarid data!" );

	}

}


function animate() {

	requestAnimationFrame( animate );

	stats.begin();

	renderer.render( scene, camera );

	stats.end();

}


$( window ).resize( function () {

	renderer.setSize( window.innerWidth, window.innerHeight );

	camera.aspect = window.innerWidth / window.innerHeight;

	camera.updateProjectionMatrix();

} );
