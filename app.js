var express = require('express');
var path = require('path');
var split = require('split');
var net = require('net');

var app = express();
app.use("/css", express.static(__dirname + '/css'));
app.use("/js", express.static(__dirname + '/js'));


app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/render.html'));
});

app.listen(3000, function() {
    console.log('Listening on port 3000');
});

var WebSocketServer = require("ws").Server;
var wss = new WebSocketServer( {port: 8081});
var wssConnections = [];


/* Event listner of the WebSocketServer.*/
wss.on( "connection", function ( client ) {

	console.log( "The browser is connected to 8081." );

	wssConnections.push( client );

	client.on( "close", function () {

		console.log( "The connection to the browser is closed." );

		var idx = wssConnections.indexOf( client );

		wssConnections.splice( idx, 1 );

	} );

} );


var wss2 = new WebSocketServer( {port: 8082});
var wss2Connections = [];

wss2.on( "connection", function ( client ) {

	console.log( "The browser is connected to 8082." );

	wss2Connections.push( client );

	client.on( "close", function () {

		console.log( "The connection to the browser is closed." );

		var idx = wss2Connections.indexOf( client );

		wss2Connections.splice( idx, 1 );

	} );

} );



// Establish socket for camera image data
var rgbBufs = [];
var rgbLen = 0;
var server = net.createServer(function(socket) {
	socket.binaryType = "arraybuffer";
	socket.on("data", function(data){
		if (data.length > 0)
		{
			rgbLen += data.length;
			rgbBufs.push(data);
			if (rgbLen > 480*640*3) {
			    // once we have a full frame, concatenate and send to front end
                wssConnections.forEach( function ( socket ) {
					socket.send(Buffer.concat(rgbBufs, 480*640*3));
					rgbBufs = [];
					rgbLen = 0;
				} );
			}
		}
	});
});



// Establish socket to for camera depth data
var depthBufs = [];
var server2 = net.createServer(function(socket) {
	socket.binaryType = "arraybuffer";
	var totalLength = 0;
	socket.on("data", function(data){
		if (data.length > 0)
		{
			totalLength += data.length;
			depthBufs.push(data);
			if (totalLength > 640*480) {
				wss2Connections.forEach( function ( socket ) {
				    // once we have a full frame, concatenate and send to front end
                    socket.send(Buffer.concat(depthBufs, 640*480));
					depthBufs = [];
					totalLength = 0;
				} );
			}
		}
	});
});



server.listen(3490, '127.0.0.1', function(){
	console.log("listening on 3490");
});


server2.listen(3491, '127.0.0.1', function(){
	console.log("listening on 3491");
});

