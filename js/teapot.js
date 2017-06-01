/**
 * @file Class for teapot
 *
 * @author Hayato Ikoma <hikoma@stanford.edu>
 * @copyright The Board of Trustees of the Leland
 Stanford Junior University
 * @version 2017/03/28
 */


/**
 * Our Teapot class
 *
 * @class Teapot
 * @classdesc Class to hold all uniforms and shaders for a teapot
 *
 * @param  {THREE.Vector3} position position of a teapot
 * @param  {string} vShader  vertex shader
 * @param  {string} fShader  fragment shader
 */
var Teapot = function ( position, vShader, fShader ) {

	var matrixUniforms = {

		viewMat: { value: new THREE.Matrix4() },

		projectionMat: { value: new THREE.Matrix4() },

		modelViewMat: { value: new THREE.Matrix4() },

		normalMat: { value: new THREE.Matrix3() },

	};

	var materialUniforms = {

		attenuation: { value: new THREE.Vector3( 2.0, 0.0, 0.0 ) },

		ambient: { value: new THREE.Vector3( 0.3, 0.3, 0.3 ) },

		diffuse: { value: new THREE.Vector3( 1.0, 1.0, 1.0 ) },

		specular: { value: new THREE.Vector3( 1.0, 1.0, 1.0 ) },

		shininess: { value: 120.0 },

	};

	var lightUniforms = {

		ambientLightColor: { value: new THREE.Vector3( 1, 1, 1 ) },

		pointLights: { value: [], properties: {

			color: { },

			position: { },

		}, },

		directionalLights: { value: [], properties: {

			direction: {},

			color: {},

		} },

	};

	var material = new THREE.RawShaderMaterial( {

		uniforms: THREE.UniformsUtils.merge( [

			matrixUniforms,

			materialUniforms,

			lightUniforms,

		] ),

		vertexShader: vShader,

		fragmentShader: fShader,

		/***
		 * When needsUpdate is true, shaders are recompiled. Upon the compilation
		 * needsUpdate is updated to false.
		 */
		needsUpdate: true,

	} );

	this.mesh = new THREE.Mesh( this.geometry, material );

	this.position = position;

	this.vertexShader = vShader;

	this.fragmentShader = fShader;

	this.numPointLights = 0;

	this.numDirectionalLights = 0;

};



/**
 * Geometry of a teapot holding vertex's coordinates.
 * See js/libs/TeapotBufferGeometry.js for details.
 */
Teapot.prototype.geometry = new THREE.TeapotBufferGeometry(
								40, 3, true, true, true, false, true );



/**
 * updateShader
 * Update the shaders based on the number of existing lights. By setting
 * material.needsUpdate to be true, the updated shaders are recompiled.
 *
 * @memberof Teapot
 * @param  {StateController} sc state controller for fetching the lighting condition
 */
Teapot.prototype.updateShader = function ( sc ) {

	var lights = sc.state.lights;

	if ( this.numPointLights !== lights.pointLights.length
		|| this.numDirectionalLights !== lights.directionalLights.length ) {

		this.mesh.material.vertexShader = replaceNumLights( this.vertexShader, lights );

		this.mesh.material.fragmentShader = replaceNumLights( this.fragmentShader, lights );

		this.mesh.material.needsUpdate = true;

		this.numPointLights = lights.pointLights.length;

		this.numDirectionalLights = lights.directionalLights.length;

	}

};



/**
 * replaceNumLights
 * Repalce NUM_POINT_LIGHTS and NUM_DIR_LIGHTS in the shaders to the number of
 * existing lights respectively. By doing this, we can define the size of an
 * array of struct (e.g. pointLights[NUM_POINT_LIGHTS]) in the shaders and can
 * avoid using the uniforms in the main function for compilation. After
 * replacing the variables to hard-coded numbers, the shaders have to be
 * recompiled.
 *
 * @param  {string} shader description
 * @param  {object} lights an object that holds the state of existing lights
 */
function replaceNumLights( shader, lights ) {

	return shader.replace( /NUM_POINT_LIGHTS/g, lights.pointLights.length )
	 .replace( /NUM_DIR_LIGHTS/g, lights.directionalLights.length );

}
