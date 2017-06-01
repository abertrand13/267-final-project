/**
 * @file Class for a standard renderer
 *
 * @author Hayato Ikoma <hikoma@stanford.edu>
 * @copyright The Board of Trustees of the Leland
 Stanford Junior University
 * @version 2017/03/28
 */


/**
 * StandardRenderer
 *
 * @class StandardRenderer
 * @classdesc Class for standard rendering.
 *
 * OpenGL / WebGL use special variables called "uniform variables" and "attribute
 * variables." Uniform variables have the same values for all vertices/fragments.
 * For example, model/view/projection matrices are uniform variables. On the other
 * hand, attribute variables are different among vertices/fragments. For example,
 * the position are different for all vertices/fragments.
 *
 * In our StandardRenderer class, we add the positions of vertex of teapots
 * to THREE.Scene to use them in vertex shaders and define a fuction to perform
 * rendering after parsing all uniforms per each rendering.
 *
 * @param  {THREE.WebGLRenderer} webglRenderer renderer
 * @param  {Array.<Teapot>} teapots       array of Teapot
 * @param  {StateController} sc            state controller
 * @param  {DisplayParameters} dispParams    display parameters
 */
var StandardRenderer = function ( webglRenderer, teapots, sc, dispParams ) {


	/***
	 * THREE.Scene and THREE.Camera are reuired for rendering with Three.js.
	 * THREE.Camera instance is generally used for computing and parsing view
	 * and projection matrices automatically. However, in our course material,
	 * we are computing the matrices by ourselves and attaching them to each
	 * Teapot instance as uniforms. This is a standard way for OpenGL/WebGL
	 *
	 * THREE.Scene is used for parsing the position of vertices, background color,
	 * etc.
	 *
	 * If you are interested in a general introduction of Three.js, David Lyons's
	 * slides are a helpful material to understand the general usage of Three.js.
	 * https://github.com/davidlyons/frontporch
	 */
	var camera = new THREE.Camera();

	var teapotScene = new THREE.Scene();

	/* add an axis object in the scene */
	var axisObject = new THREE.AxisHelper( 100 );

	axisObject.position.set( 0, 0, 0 );

	teapotScene.add( axisObject );


	/* add a grid object in the scene */
	var gridObject = new THREE.GridHelper( 10000, 20, "white", "white" );

	gridObject.position.set( 0, - 1700, 0 );

	teapotScene.add( gridObject );


	/* set the scene's background */
	teapotScene.background = new THREE.Color( "gray" );

	/* set up three teapots in the scene */
	for ( var i = 0; i < teapots.length; i ++ ) {

		teapotScene.add( teapots[ i ].mesh );

	}


	/* Create a scene that has only grid for unwarp-parameter search */
	var gridScene = new THREE.Scene();

	var grid = new THREE.GridHelper( 500, 10, "white", "white" );

	grid.material.linewidth = 3;

	grid.rotation.x = 90 * THREE.Math.DEG2RAD;

	gridScene.add( grid );


	/* Scene swithcing system */
	const TEAPOT_SCENE = 0;

	const GRID_SCENE = 1;

	var scene = teapotScene;

	var sceneSwitcher = TEAPOT_SCENE;

	$( "html" ).keydown( function ( e ) {

		/* Change the scene if space is pressed. */
		if ( e.which === 32 ) {

			if ( sceneSwitcher === TEAPOT_SCENE ) {

				scene = gridScene;
				sceneSwitcher = GRID_SCENE;

			} else {

				scene = teapotScene;
				sceneSwitcher = TEAPOT_SCENE;

			}

		}

	} );


	/***
	 * This sphere geometry for visualizing the position of point light source.
	 * It will be rendered through Three's built-in shader along with the axis
	 * and grid object.
	 */
	var sphere = new THREE.SphereGeometry( 1, 15, 10 );

	var pLightSpheres = [];


	/* updateUniforms - updaate all uniforms of Teapot  */
	function updateUniforms( modelMat, viewMat, projectionMat ) {

		var lights = sc.state.lights;

		for ( var i = 0; i < teapots.length; i ++ ) {

			/* Translate a teapot based on its initial position. */
			var positionTranslation = new THREE.Matrix4().
									makeTranslation( teapots[ i ].position.x,
													 teapots[ i ].position.y,
													 teapots[ i ].position.z );

			var _modelMat = new THREE.Matrix4().
				multiplyMatrices( positionTranslation, modelMat );

			var modelViewMat = new THREE.Matrix4().
									multiplyMatrices( viewMat, _modelMat );

			var normalMat = new THREE.Matrix3().
								getNormalMatrix( modelViewMat );

			/* Attach the computed model/view/projection matrices to the shaders. */
			teapots[ i ].mesh.material.uniforms.
					viewMat.value.copy( viewMat );

			teapots[ i ].mesh.material.uniforms.
					modelViewMat.value.copy( modelViewMat );

			teapots[ i ].mesh.material.uniforms.
					normalMat.value.copy( normalMat );

			teapots[ i ].mesh.material.uniforms.
					projectionMat.value.copy( projectionMat );

			teapots[ i ].mesh.material.uniforms.
				pointLights.value = sc.state.lights.pointLights;

			teapots[ i ].mesh.material.uniforms.
				directionalLights.value = sc.state.lights.directionalLights;

			teapots[ i ].updateShader( sc );

		}

		/**
		 * This part is for rendering the axis, point lights and grid objects
		 * with THREE's rendering pipeline by using the view and projection
		 * matrices computed by ourselves. This part is not used for rendering
		 * teapots. Please ignore this part for doing homework.
		 */
		camera.matrix.identity();

		camera.applyMatrix( new THREE.Matrix4().getInverse( viewMat ) );

		camera.projectionMatrix.copy( projectionMat );

		var pointLights = lights.pointLights;

		if ( pLightSpheres.length !== pointLights.length ) {

			var pLight = pointLights[ pointLights.length - 1 ];

			var sphereMesh = new THREE.Mesh( sphere,
				new THREE.MeshBasicMaterial( { color: pLight.color } ) );

			pLightSpheres.push( sphereMesh );

			scene.add( sphereMesh );

		}

		for ( var idx = 0; idx < pLightSpheres.length; idx ++ ) {

			var pos = pointLights[ idx ].position;

			pLightSpheres[ idx ].position.set( pos.x, pos.y, pos.z );

		}

	}


	/**
	 * render - peform rendering after updating uniforms
	 *
	 * @memberof StandardRenderer
	 * @param  {THREE.Matrix4} modelMat      model matrix
	 * @param  {THREE.Matrix4} viewMat       view matrix
	 * @param  {THREE.Matrix4} projectionMat projection matrix
	 */
	this.render = function ( modelMat, viewMat, projectionMat ) {

		updateUniforms( modelMat, viewMat, projectionMat );

		/***
		 * Render the scene!
		 * This part performs all renderings scheduled above on GPU.
		 */
	    console.log("here");	
        
        webglRenderer.render( scene, camera );

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


	/**
	 * renderOnTarget - peform rendering after updating uniforms on a specified
	 * buffer
	 *
	 * @memberof StandardRenderer
	 * @param  {THREE.WebGLRenderTarget} renderTarget a buffer for rendering
	 * @param  {THREE.Matrix4} modelMat      model matrix
	 * @param  {THREE.Matrix4} viewMat       view matrix
	 * @param  {THREE.Matrix4} projectionMat projection matrix
	 */
	this.renderOnTarget = function ( renderTarget, modelMat, viewMat, projectionMat ) {

		updateUniforms( modelMat, viewMat, projectionMat );

		/***
		 * Render the scene on the buffer for multipass renderings!
		 * This part performs all renderings scheduled above on GPU.
		 */
		webglRenderer.render( scene, camera, renderTarget, true );

	};


	/**
	 * setSize - resize the renderer
	 *
	 * @memberof StandardRenderer
	 * @param  {Number} width  width of a window
	 * @param  {Number} height height of a window
	 */
	this.setSize = function ( width, height ) {

		webglRenderer.setSize( width, height );

	};


	/* Automatic update of the renderer size when the window is resized. */
	var _this = this;

	$( window ).resize( function () {

		var size = webglRenderer.getSize();

		var pixelRatio = webglRenderer.getPixelRatio();

		if ( size.width == dispParams.canvasWidth * pixelRatio
			&& size.height == dispParams.canvasHeight * pixelRatio ) {

			dispParams.update();

		}

		_this.setSize( dispParams.canvasWidth, dispParams.canvasHeight );

	} );

};
