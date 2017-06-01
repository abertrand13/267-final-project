/**
 * @file Unwarp fragment shader
 *
 * @author Hayato Ikoma <hikoma@stanford.edu>
 * @author Robert Konrad <rkkonrad@stanford.edu>
 * @author Nitish Padmanaban <nit@stanford.edu>
 * @copyright The Board of Trustees of the Leland
Stanford Junior University
 * @version 2017/03/28
 */

var shaderID = "fShaderUnwarp";

var shader = document.createTextNode( `
/**
 * WebGL doesn't set any default precision for fragment shaders.
 * Precision for vertex shader is set to "highp" as default.
 * Do not use "lowp". Some mobile browsers don't support it.
 */

precision mediump float;

varying vec2 textureCoords;

/* texture rendered in the first rendering pass */
uniform sampler2D map;

/***
 * center of lens for un-distortion
 * in normalized coordinates between 0 and 1
 */
uniform vec2 centerCoordinate;

/* size of viewport in [mm] */
uniform vec2 viewportSize;

/* lens distortion parameters [K_1, K_2] */
uniform vec2 K;

void main() {

    /* distance from center */
	float radius = distance( viewportSize * textureCoords.xy,
							 viewportSize * centerCoordinate.xy );

	/* compute undistorted texture coordinates */
	vec2 textureCoordsUndistorted = ( textureCoords - centerCoordinate ) *
		( 1.0 + K[0] * pow( radius, 2.0 ) + K[1] * pow( radius, 4.0 ) )
		+ centerCoordinate;

	if ( textureCoordsUndistorted.x < 1.0 && textureCoordsUndistorted.x > 0.0
		&& textureCoordsUndistorted.y < 1.0 && textureCoordsUndistorted.y > 0.0 ) {

    	gl_FragColor = texture2D( map, textureCoordsUndistorted );

	} else {

		gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );

	}

}
` );


var shaderNode = document.createElement( "script" );

shaderNode.id = shaderID;

shaderNode.setAttribute( "type", "x-shader/x-fragment" );

shaderNode.appendChild( shader );

document.body.appendChild( shaderNode );
