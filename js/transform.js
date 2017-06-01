/**
 * @file functions to comptue model/view/projection matrices
 *
 * @author Hayato Ikoma <hikoma@stanford.edu>
 * @copyright The Board of Trustees of the Leland
Stanford Junior University
 * @version 2017/03/28
 */



 /**
  * MVPmat
  *
  * @class MVPmat
  * @classdesc Class for holding and computing model/view/projection matrices.
  *
  * @param  {StateController} sc            state controller
  * @param  {DisplayParameters} dispParams    display parameters
  */
var MVPmat = function ( sc, dispParams ) {

	var state = sc.state;

	this.modelMat = new THREE.Matrix4();

	this.stereoViewMat =
		{ L: new THREE.Matrix4(), R: new THREE.Matrix4() };

	this.stereoProjectionMat =
		{ L: new THREE.Matrix4(), R: new THREE.Matrix4() };

	var top, bottom;
	var rightL, rightR, leftL, leftR;
	var width, height;

	var viewerPosition = state.viewerPosition;

	var ipd = dispParams.ipd;
	var M = dispParams.lensMagnification;
	var d = dispParams.distanceScreenViewer;
	var headLength = dispParams.headLength;
	var neckLength = dispParams.neckLength;

	var clipNear = state.clipNear;
	var clipFar = state.clipFar;

	this.update = function () {

		/* Compute model matrix */
		this.modelMat.copy( this.computeModelTransform(
			state.modelTranslation, state.modelRotation ) );

		/* Compute view matrix */
		this.stereoViewMat.L.copy( this.computeViewTransformFromQuaternion(
			viewerPosition, state.viewerQuaternion, neckLength, headLength, ipd / 2 ) );

		this.stereoViewMat.R.copy( this.computeViewTransformFromQuaternion(
			viewerPosition, state.viewerQuaternion, neckLength, headLength, - ipd / 2 ) );


		/* Compute projection matrix */
		width = dispParams.canvasWidth * dispParams.pixelPitch;

		height = dispParams.canvasHeight * dispParams.pixelPitch;

		top = clipNear * M * height	/ 2 / d;

		bottom = - top;

		leftL = - clipNear * M * ( width - ipd ) / 2 / d;

		rightL = clipNear * M *	ipd / 2 / d;

		this.stereoProjectionMat.L.copy(
			this.computePerspectiveTransform(
				leftL, rightL, top, bottom, clipNear, clipFar ) );

		leftR = - clipNear * M * ipd / 2 / d;

		rightR = clipNear * M * ( width - ipd ) / 2 / d;

		this.stereoProjectionMat.R.copy(
			this.computePerspectiveTransform(
				leftR, rightR, top, bottom, clipNear, clipFar ) );

	};

};


/**
 * computeModelTransform - compute a model transform matrix
 *
 * @memberof MVPmat
 * @param  {THREE.Vector3} modelTranslation
 * @param  {THREE.Vector3} modelRotation
 * @return {THREE.Matrix4}      model matrix
 */
MVPmat.prototype.computeModelTransform = function ( modelTranslation, modelRotation ) {

	var translationMat
	   = new THREE.Matrix4().makeTranslation( modelTranslation.x,
											  modelTranslation.y,
											  modelTranslation.z );

	var rotationMatX =
	   new THREE.Matrix4().makeRotationX(
		   modelRotation.x * THREE.Math.DEG2RAD );

	var rotationMatY =
	   new THREE.Matrix4().makeRotationY(
		   modelRotation.y * THREE.Math.DEG2RAD );

	var rotationMatZ =
	   new THREE.Matrix4().makeRotationZ(
		   modelRotation.z * THREE.Math.DEG2RAD );

	var modelMatrix =
	   new THREE.Matrix4().premultiply( rotationMatX )
						  .premultiply( rotationMatY )
						  .premultiply( rotationMatZ )
						  .premultiply( translationMat );

	return modelMatrix;

};


/**
 * computeViewTransformFromQuaternion - compute a view transform matrix
 *
 * @memberof MVPmat
 * @param  {THREE.Vector3} viewerPosition viewer's position
 * @param  {THREE.Quaternion} viewerQuaternion quaternion data from IMU
 * @param  {Number} neckLength			  length of viewer's neckx`
 * @param  {Number} headLength 			  length of viewer's head
 * @param  {Number} halfIpdShift
 * @return {THREE.Matrix4}                view matrix
 */
MVPmat.prototype.computeViewTransformFromQuaternion = function (
	viewerPosition, viewerQuaternion, neckLength, headLength, halfIpdShift ) {

	if ( typeof neckLength === "undefined" ) {

		neckLength = 0;

	}

	if ( typeof headLength === "undefined" ) {

		headLength = 0;

	}

	/**
	 * TODO: Task 6
	 *
	 * Modify thie viewMat computation.
	 * Implement the rotation matrix computation and the head-and-neck model.
	 */

	var rotationMat = new THREE.Matrix4().makeRotationFromQuaternion(viewerQuaternion);
	rotationMat.getInverse(rotationMat, false);
	var translationMat
		= new THREE.Matrix4().makeTranslation( - viewerPosition.x,
											   - viewerPosition.y,
											   - viewerPosition.z );

	var headNeckMat = new THREE.Matrix4().makeTranslation(0, -dispParams.neckLength, -dispParams.headLength);
	var negHeadNeckMat = new THREE.Matrix4().makeTranslation(0, dispParams.neckLength, dispParams.headLength);

	var ipdTranslateMat
		= new THREE.Matrix4().makeTranslation( halfIpdShift, 0, 0 );

	var viewMat =
		new THREE.Matrix4().premultiply( translationMat )
						   .premultiply( ipdTranslateMat )
						   .premultiply( negHeadNeckMat )
						   .premultiply( rotationMat )
						   .premultiply( headNeckMat);

	return viewMat;

};


/**
 * computePerspectiveTransform - compute a perspective transform matrix
 *
 * @memberof MVPmat
 * @param {Number} left 	left edge
 * @param {Number} right 	right edge
 * @param {Number} top 		top edge
 * @param {Number} bottom 	bottom edge
 * @param {Number} clipNear near clipping plane
 * @param {Number} clipFar 	far clipping plane
 */
MVPmat.prototype.computePerspectiveTransform = function (
   left, right, top, bottom, clipNear, clipFar ) {

	return new THREE.Matrix4().makePerspective(
	   left, right, top, bottom, clipNear, clipFar );

};


/**
 * computeOrthographicTransform - compute a orthographic transform matrix
 *
 * @memberof MVPmat
 * @param {Number} left 	left edge
 * @param {Number} right 	right edge
 * @param {Number} top 		top edge
 * @param {Number} bottom 	bottom edge
 * @param {Number} clipNear near clipping plane
 * @param {Number} clipFar 	far clipping plane
 */
MVPmat.prototype.computeOrthographicTransform = function (
   left, right, top, bottom, clipNear, clipFar ) {

	return new THREE.Matrix4().makeOrthographic(
	   left, right, top, bottom, clipNear, clipFar );

};
