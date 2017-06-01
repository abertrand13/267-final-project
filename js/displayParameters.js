/**
 * @file Class for display parameters
 *
 * @author Hayato Ikoma <hikoma@stanford.edu>
 * @copyright The Board of Trustees of the Leland
 Stanford Junior University
 * @version 2017/03/28
 */

/**
 * DisplayParameters
 *
 * @class DisplayParameters
 * @classdesc A class to hold display parameters.
 * 		The height and width holds the size fo a window in pixel.
 * 		These values are automatically updated when the window is resized.
 */
var DisplayParameters = function () {

	/* screen width in [mm] */
	var screenWidth = 132.48;

	/* horizontal screen resolution */
	var screenWidthResolution = 1920;

	/* Pixel pitch of the screen */
	this.pixelPitch = screenWidth / screenWidthResolution;

	/* Vertical resolution of the current window in [pixel] */
	this.canvasHeight = window.innerHeight;

	/* Horizontal resolution of the current window in [pixel] */
	this.canvasWidth = window.innerWidth;

	/* Interpupillnary distance */
	this.ipd = 60;

	/* distance between lens and screen in [mm] */
	this._d = 42;

	/* Focal length of the lens in [mm] */
	this._f = 45;

	/* distance between lens and screen in [mm] */
	this._d = 42;

	/* Eye relief in [mm] */
	this._eyeRelief = 10;

	/* Head length in [mm] */
	this.headLength = 200;

	/* Neck length in [mm] */
	this.neckLength = 400;

	/* Magnification of the lens*/
	this.lensMagnification = this.computeLensMagnification();

	/* Distance between the viewer and the virtual screen in [mm] */
	this.distanceScreenViewer = this.computeDistanceScreenViewer();

	var _this = this;

	$( window ).resize( function () {

		_this.update();

	} );

};


/**
 * computeLensMagnification - compute lens magnification
 *
 * @memberof DisplayParameters
 * @return {Number}  lens magnification
 */
DisplayParameters.prototype.computeLensMagnification = function () {

	return this._f / ( this._f - this._d );

};


/**
 * computeDistanceScreenViewer - compute distance between the virtual screen
 * and viewer
 *
 * @memberof DisplayParameters
 * @return {Number}  distance
 */
DisplayParameters.prototype.computeDistanceScreenViewer = function () {

	return 1.0 / ( ( 1 / this._d ) - ( 1 / this._f ) ) + this._eyeRelief;

};


DisplayParameters.prototype.update = function () {

	this.canvasHeight = window.innerHeight;

	this.canvasWidth = window.innerWidth;

};
