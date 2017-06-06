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
	var testCamera = new THREE.Camera();
	gridScene.background = new THREE.Color("gray");
	var grid = new THREE.GridHelper( 500, 10, "white", "white" );

    var light2 = new THREE.AmbientLight(0xffffff, .8);
    light2.position.set(0,10,0);
    gridScene.add(light2);
	
    /* ALEX FUCKING AROUND HERE */ 
	var imageWidth = 640;
	var imageHeight = 480;
    var temp = Array(640*480*3).fill(0);
    var dataTexture = new THREE.DataTexture(
            Uint8Array.from(temp),
            imageWidth,
            imageHeight,
            THREE.RGBFormat,
            THREE.UnsignedByteType,
            THREE.UVMapping);
    dataTexture.needsUpdate = true;

    var dataMaterial = new THREE.MeshBasicMaterial({ 
        map: dataTexture
    });
    dataMaterial.needsUpdate = true;
    
	var testTextureGeo = new THREE.PlaneGeometry(imageWidth, imageHeight);
	var testTextureMesh = new THREE.Mesh(testTextureGeo, dataMaterial);
    testTextureMesh.renderOrder = 0;
    testTextureMesh.position.z = -50;
	gridScene.add(testTextureMesh);

    // add a light so you can see the waddle dees
    var light = new THREE.AmbientLight(0xffffff, .8);
    light.position.set(0,10,0);
    teapotScene.add(light); 

	/* Scene swithcing system */
	const TEAPOT_SCENE = 0;

	const GRID_SCENE = 1;

	var scene = gridScene;

	var sceneSwitcher = GRID_SCENE;

    /*Adding in our stuff*/
     
    // Adding in the occluding blocks
    //~ addOccludingBlock();
    var occludingBlocks = [];
    addBlocksToScene();
    
    // add the waddle dees! 
    var waddleDees = [];
    addWaddleDee();

    
    
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

        if( e.which === 87 ) {
            addWaddleDee();
            addOccludingBlock();
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

        /* UPDATE WADDLE DEE */
        // consider moving this to the right structure (see render.js)
        for(var i = 0;i < waddleDees.length; i++) {
            var curr = waddleDees[i];
            curr.obj.position.x += curr.vx;
            curr.obj.position.y += curr.vy;
            curr.obj.position.z += curr.vz;
            if(Math.abs(curr.obj.position.x) > 150) {
                curr.vx *= -1;
            }

            if(Math.abs(curr.obj.position.y) > 150) {
                curr.vy *= -1;
            }

            if(Math.abs(curr.obj.position.z) > 150 || curr.obj.position.z < 0) {
                curr.vz *= -1;
            }

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
	
        updateDataTexture();
        updateDepthArray();
        
		/***
		 * Render the scene!
		 * This part performs all renderings scheduled above on GPU.
		 */

        webglRenderer.render( scene, camera );

	};

    function updateDataTexture() {
    	if(sc.state.rgbBuffer.length != 0 && sc.state.rgbBufferUpdated) {
            var split = sc.state.rgbBuffer.split("");
            var dataArray = Uint8Array.from(split.map(function(x) { return x.charCodeAt(0); }));
            const dataTexture2 = new THREE.DataTexture(
                dataArray,
                imageWidth,
                imageHeight,
                THREE.RGBFormat,
                THREE.UnsignedByteType,
                THREE.UVMapping);
            dataTexture2.needsUpdate = true;

            dataMaterial.map = dataTexture2;
            testTextureMesh.material.needsUpdate = true;
            sc.state.rgbBufferUpdated = false;
        }
    }
    
    
 
    
    function averageDepthValues(x, y, dataArray) {
		var sum = 0;
		for (var i = 0; i < 24; i++) {
			for (var j = 0; j < 32; j++) {
				sum += dataArray[y*32 + x*24+ j + 24*i];
			}
		}
		
		//~ console.log(sum);
		//~ console.log(sum);
		return sum / (24*32);
	}
    
    function updateDepthArray() {
		if (sc.state.depthBuffer.length != 0 && sc.state.depthBufferUpdated) {
			var split = sc.state.depthBuffer.split("");
			
            var dataArray = Uint8Array.from(split.map(function(x) {return x.charCodeAt(0); }))
			//~ var depthArray = new Uint8Array(400);
			for (var i = 0; i < 20; i++)
			{
				for (var j = 0; j < 20; j++)
				{
					var thisBlock = occludingBlocks[i*20 + j];
					thisBlock.position.z = -2*averageDepthValues(i, j, dataArray) + 50;
					//~ console.log(thisBlock.position.z);
					//~ console.log(thisBlock.position.z);
					thisBlock.needsUpdate = true;
				}
			}
			sc.state.depthBufferUpdated = false;
		}
		
	}

    function addOccludingBlock() {
        var box = new THREE.BoxGeometry(100, 100, 1);
        var mesh = new THREE.Mesh(box, new THREE.MeshBasicMaterial());
        mesh.material.color.set(0x0000ff);
        mesh.material.colorWrite = false; // make invisible
        mesh.renderOrder = 2; // render before the waddle dees
        mesh.position.z = 200;
        scene.add(mesh);
    }
    
    
    function addOccludingBlockCoords(x, y, z) {
        var box = new THREE.BoxGeometry(32, 24, 1);
        var mesh = new THREE.Mesh(box, new THREE.MeshBasicMaterial());
        mesh.material.color.set(0x0000ff);
        //~ mesh.material.colorWrite = false; // make invisible
        mesh.renderOrder = 2; // render before the waddle dees
        mesh.position.x = x;
        mesh.position.y = y;
        mesh.position.z = z;
        occludingBlocks.push(mesh);
        scene.add(mesh);
    }
    
    function addBlocksToScene() {
		for (var i = 0; i < 20; i++)
		{
			for (var j = 0; j < 20; j++)
			{
				addOccludingBlockCoords(j*32 - 320, i*24-240, 0);
			}
		}
		
	}
	
   
    
    function addWaddleDee() {
        var mtlLoader = new THREE.MTLLoader();
        mtlLoader.setPath( 'js/models/waddledee/' );
        mtlLoader.load( 'waddledee.mtl', function( materials ) {
            materials.preload();
            var objLoader = new THREE.OBJLoader();
            objLoader.setMaterials( materials );
            objLoader.setPath( 'js/models/waddledee/' );
            objLoader.load( 'waddledee.obj', function ( object ) {
                object.scale.set(3,3,3);
                for(var i = 0;i < object.children.length;i++) {
                    object.children[i].renderOrder = 3;
                }
                scene.add(object);
                waddleDees.push({
                    obj: object,
                    vx: Math.random() * 3,
                    vy: Math.random() * 3,
                    vz: Math.random() * 5
                    /*vx: 0,
                    vy: 0,
                    vz: 0*/
                });
            });
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
