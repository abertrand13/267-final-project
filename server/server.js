/**
 * @file Serial to WebSocket communication
 * This program achieve the serial communication between Arduino and browsers
 * through WebSocket connections. It allows multiple/non WebSocket connections.
 *
 * Please change the port name and also the port number for your environement.
 *
 * This code is based on the article written by Prof. Tom Igoe at
 * NYU Tische School of the Arts. The code example is copied and modified to
 * achieve the communication between Arduino and browsers with the permission
 * of Prof. Igoe.
 *
 * Reference:
 * https://itp.nyu.edu/physcomp/labs/labs-serial-communication/lab-serial-communication-with-node-js/
 *
 * @author Hayato Ikoma <hikoma@stanford.edu>
 * @copyright The Board of Trustees of the Leland
Stanford Junior University
 * @version 2017/03/28
 *
 */

/* Import serialport library */
const SerialPort = require( "serialport" );

/* Put your serial port name here */
const portName = "/dev/cu.usbmodem2815011";

/* Instanciate SerialPort */
const serialPort = new SerialPort( portName, {

	baudRate: 115200,

	/***
	 * The output of Arduino's println() ends with \r\n.
	 * https://www.arduino.cc/en/serial/println
	 */
	parser: SerialPort.parsers.readline( "\n" ),

} );

/* Import WebSocketServer */
const WebSocketServer = require( "ws" ).Server;

/* Instanciate the WebSocket server with port 8081 */
const wss = new WebSocketServer( { port: 8081 } );

/**
 * List of WebSocket connections
 * It is useful to use it as a contanair even if we assume 1 WebSocket connection
 * at most because we don't want to close the serial port even when we don't have
 * any WebSocket connections.
 */
var wssConnections = [];


/**
 * Keyboard input to Arduino through stdin.
 * By setting it to be raw mode, the data is sent without hitting enter.
 */
var stdin = process.openStdin();

stdin.setRawMode( true );

stdin.setEncoding( "utf8" );

stdin.on( "data", function ( key ) {

	if ( key === '\u0003' ) {

		process.exit();

	}

	serialPort.write( key );

} );

/* Set up event listeners on the serial port */
serialPort.on( "open", function () {

	console.log( "The serial port is opened." );

} );

serialPort.on( "close", function () {

	console.log( "The serial port is closed." );

} );

serialPort.on( "error", function ( err ) {

	console.log( "Serial port error: " + err );

} );

/* For checking the data without any connection */
serialPort.on( "data", function ( data ) {

	console.log( data );

	wssConnections.forEach( function ( socket ) {

		socket.send( JSON.stringify( data ) );

	} );

} );


/* Event listner of the WebSocketServer.*/
wss.on( "connection", function ( client ) {

	console.log( "The browser is connected to the serial port." );

	wssConnections.push( client );

	client.on( "close", function () {

		console.log( "The connection to the browser is closed." );

		var idx = wssConnections.indexOf( client );

		wssConnections.splice( idx, 1 );

	} );

} );
