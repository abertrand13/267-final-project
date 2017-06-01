/**
 * @file utility functions
 *
 * @author Hayato Ikoma <hikoma@stanford.edu>
 * @copyright The Board of Trustees of the Leland
 Stanford Junior University
 * @version 2017/03/28
 */

/**
 * @const {string} cardinalColor Our beautiful cardinal color!
 */
const cardinalColor = "rgb( 140, 21, 21 )";


/**
 * vector3ToString - convert THREE.Vector3 to string
 *
 * @param  {THREE.Vector3} v input vector i.e. [a,b,c]
 * @return {string}   output string i.e. "(a, b, c)"
 */
function vector3ToString( v ) {

	return "(" + v.x.toFixed( 1 ).toString()
			+ "," + v.y.toFixed( 1 ).toString()
			+ "," + v.z.toFixed( 1 ).toString() + ")";

}


 /**
  * vector2ToString - convert THREE.Vector2 to string
  *
  * @param  {THREE.Vector2} v input vector i.e. [a,b]
  * @return {string}   output string i.e. "(a, b)"
  */
function vector2ToString( v ) {

 	return "(" + v.x.toFixed( 5 ).toString()
 			   + "," + v.y.toFixed( 7 ).toString() + ")";

}


/**
 * quaternionToString - convert THREE.Quaternion to string
 *
 * @param  {THREE.Vector2} v input vector i.e. [a,b]
 * @return {string}   output string i.e. "(a, b)"
 */
function quaternionToString( q ) {

	return "(" + q.w.toFixed( 3 ).toString()
			   + "," + q.x.toFixed( 3 ).toString()
			   + "," + q.y.toFixed( 3 ).toString()
			   + "," + q.z.toFixed( 3 ).toString() + ")";

}
