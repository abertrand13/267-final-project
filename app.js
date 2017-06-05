var express = require('express');
var path = require('path');
var split = require('split');

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

	console.log( "The browser is connected to the serial port." );

	wssConnections.push( client );

	client.on( "close", function () {

		console.log( "The connection to the browser is closed." );

		var idx = wssConnections.indexOf( client );

		wssConnections.splice( idx, 1 );

	} );

} );

var net = require('net');

// var bufs = []
var server = net.createServer(function(socket) {
	socket.binaryType = "arraybuffer";
	var stream = socket.pipe(split());
	stream.on("data", function(data){
		// console.log(data);
		// console.log(data.toString());
		if (data.length > 0)
		{
			// bufs.push(data);
			var buf = Buffer.from(data.toString(), 'base64');
			// console.log(buf.toString())
			console.log(buf.length);
			wssConnections.forEach( function ( socket ) {

				socket.send(buf.toString());

			} );
		}
	});

	// stream.on("end", function() {
	// 	var img = Buffer.concat(bufs);
	// 	bufs = [];
	// 	wssConnections.forEach( function ( socket ) {

	// 		socket.send(img);

	// 	} );
	// });
});

server.listen(3490, '127.0.0.1', function(){
	console.log("listening on 3490");
});

