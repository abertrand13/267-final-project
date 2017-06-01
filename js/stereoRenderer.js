/**
 * @file Class for a stereo renderer
 *
 * @author Hayato Ikoma <hikoma@stanford.edu>
 * @copyright The Board of Trustees of the Leland
 Stanford Junior University
 * @version 2017/03/28
 */


/**
 * StereoRenderer
 *
 * @class StereoRenderer
 * @classdesc Class for stereo rendering.
 * This class should be used for adding some post effets on a pre-rendered scene.
 *
 *
 * @param  {THREE.WebGLRenderer} webglRenderer renderer
 * @param  {StateController} sc            state controller
 * @param  {DisplayParameters} dispParams    display parameters
 */
var StereoRenderer = function ( webglRenderer, sc, dispParams ) {

	var camera = new THREE.Camera();

	var sceneL = new THREE.Scene();

	var sceneR = new THREE.Scene();

	var renderParams = {

		minFilter: THREE.LinearFilter,

		magFilter: THREE.LinearFilter,

		format: THREE.RGBAFormat,

		stencil: false,

		depth: false,

		antialias: true,

	};

	var size = webglRenderer.getSize();

	/* For left eye */
	this.renderTargetL = new THREE.WebGLRenderTarget(
							size.width, size.height, renderParams );

	var materialL = new THREE.RawShaderMaterial( {

		uniforms: {

			map: { value: this.renderTargetL.texture },

		},

		vertexShader: $( "#vShaderPassThrough" ).text(),

		fragmentShader: $( "#fShaderPassThrough" ).text()

	} );

	var meshL = new THREE.Mesh( new THREE.PlaneBufferGeometry( 2, 2 ), materialL );

	sceneL.add( meshL );

	/* For right eye */
	this.renderTargetR = new THREE.WebGLRenderTarget(
						   size.width, size.height, renderParams );

	var materialR = new THREE.RawShaderMaterial( {

		uniforms: {

			map: { value: this.renderTargetR.texture },

		},

		vertexShader: $( "#vShaderPassThrough" ).text(),

		fragmentShader: $( "#fShaderPassThrough" ).text()

	} );

	var meshR = new THREE.Mesh( new THREE.PlaneBufferGeometry( 2, 2 ), materialR );

	sceneR.add( meshR );


	this.render = function () {

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

		webglRenderer.setViewport( 0, 0, size.width, size.height );

        console.log("here"); 
        renderWaddleDee();

	};


    function renderWaddleDee() {
        var mtlLoader = new THREE.MTLLoader();
        mtlLoader.setPath( 'models/waddledee' );
        mtlLoader.load( 'waddledee.mtl', function( materials ) {
            materials.preload();
            var objLoader = new THREE.OBJLoader();
            objLoader.setMaterials( materials );
            objLoader.setPath( 'models/waddledee' );
            objLoader.load( 'waddledee.obj', function ( object ) {
                object.position.y = - 95;
                scene.add( object );
            }, onProgress, onError );
        });
    }


	this.setSize = function ( width, height ) {

		webglRenderer.setSize( width, height );

		size = webglRenderer.getSize();

		this.renderTargetL.setSize( size.width, size.height );

		this.renderTargetR.setSize( size.width, size.height );

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
