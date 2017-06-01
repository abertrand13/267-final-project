/**
 * @file Class for a stereo unwarap renderer
 *
 * @author Hayato Ikoma <hikoma@stanford.edu>
 * @copyright The Board of Trustees of the Leland
 Stanford Junior University
 * @version 2017/03/28
 */


/**
 * StereoUnwarpRenderer
 *
 * @class StereoUnwarpRenderer
 * @classdesc Class for stereo unwarp rendering.
 * This class should be used for adding some post effets on a pre-rendered scene.
 *
 *
 * @param  {THREE.WebGLRenderer} webglRenderer renderer
 * @param  {StateController} sc            state controller
 * @param  {DisplayParameters} dispParams    display parameters
 */
var StereoUnwarpRenderer = function ( webglRenderer, sc, dispParams ) {

	var camera = new THREE.Camera();

	var sceneL = new THREE.Scene();

	var sceneR = new THREE.Scene();

	var size = webglRenderer.getSize();

	/* For left eye */
	this.renderTargetL = new THREE.WebGLRenderTarget( size.width, size.height );

	var materialL = new THREE.RawShaderMaterial( {

		uniforms: {

			map: { value: this.renderTargetL.texture },

			centerCoordinate: { value: new THREE.Vector2() },

			K: { value: sc.state.lensDistortion },

			viewportSize: { value: new THREE.Vector2() },

		},

		vertexShader: $( "#vShaderUnwarp" ).text(),

		fragmentShader: $( "#fShaderUnwarp" ).text()

	} );

	var meshL = new THREE.Mesh( new THREE.PlaneBufferGeometry( 2, 2 ), materialL );

	sceneL.add( meshL );

	/* For right eye */
	this.renderTargetR = new THREE.WebGLRenderTarget( size.width, size.height );

	var materialR = new THREE.RawShaderMaterial( {

		uniforms: {

			map: { value: this.renderTargetR.texture },

			centerCoordinate: { value: new THREE.Vector2() },

			K: { value: sc.state.lensDistortion },

			viewportSize: { value: new THREE.Vector2() },

		},

		vertexShader: $( "#vShaderUnwarp" ).text(),

		fragmentShader: $( "#fShaderUnwarp" ).text()

	} );

	var meshR = new THREE.Mesh( new THREE.PlaneBufferGeometry( 2, 2 ), materialR );

	sceneR.add( meshR );

	const halfIpd = dispParams.ipd / 2 / dispParams.pixelPitch;

 	var p = dispParams.pixelPitch;

	function updateUniforms() {

		materialL.uniforms.centerCoordinate.value.set(
			1.0 - halfIpd / ( size.width / 2 ), 1 / 2 );

		materialR.uniforms.centerCoordinate.value.set(
			halfIpd / ( size.width / 2 ), 1 / 2 );

		materialL.uniforms.viewportSize.value.set(
			p * size.width / 2, p * size.height );

		materialR.uniforms.viewportSize.value.set(
			p * size.width / 2, p * size.height );

	}

	updateUniforms();


	this.render = function () {

		webglRenderer.setScissorTest( true );

		/* Render for left eye on the left side */
		webglRenderer.setScissor( 0, 0, size.width / 2, size.height );

		webglRenderer.setViewport( 0, 0, size.width / 2, size.height );

		webglRenderer.render( sceneL, camera );

		/* Render for right eye on the right side */
		webglRenderer.setScissor(
			size.width / 2, 0, size.width / 2, size.height );

		webglRenderer.setViewport(
			size.width / 2, 0, size.width / 2, size.height );

		webglRenderer.render( sceneR, camera );

		webglRenderer.setScissorTest( false );
	};


	this.setSize = function ( width, height ) {

		webglRenderer.setSize( width, height );

		size = webglRenderer.getSize();

		this.renderTargetL.setSize( size.width, size.height );

		this.renderTargetR.setSize( size.width, size.height );

		updateUniforms();

	};


	/* Automatic update of the renderer size when the window is resized. */
	var _this = this;

	$( window ).resize( function () {

		size = webglRenderer.getSize();

		var pixelRatio = webglRenderer.getPixelRatio();

		if ( size.width == dispParams.canvasWidth * pixelRatio
			&& size.height == dispParams.canvasHeight * pixelRatio ) {

			dispParams.update();

		}

		_this.setSize( dispParams.canvasWidth, dispParams.canvasHeight );

	} );

};
