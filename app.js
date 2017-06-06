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
		    console.log("rgb", buf.length);
			
			// lets just do a for loop amigos!!!!!!!!!!!!!!
			var str="";
			for (i = 0; i < buf.length; i++) {
				str+=String.fromCharCode(buf[i]);
			}
			wssConnections.forEach( function ( socket ) {
			socket.send(str);

			} );
		}
	});

});




var server2 = net.createServer(function(socket) {
	socket.binaryType = "arraybuffer";
	var stream = socket.pipe(split());
	stream.on("data", function(data){
		
		if (data.length > 0)
		{
			// bufs.push(data);
			var buf = Buffer.from(data.toString(), 'base64');
		    console.log("depth", buf.length);
			
			// lets just do a for loop amigos!!!!!!!!!!!!!!
			var str="";
			for (i = 0; i < buf.length; i++) {
				str+=String.fromCharCode(buf[i]);
			}
			wss2Connections.forEach( function ( socket ) {
			socket.send(str);

			} );
		}
	});

});



server.listen(3490, '127.0.0.1', function(){
	console.log("listening on 3490");
});


server2.listen(3491, '127.0.0.1', function(){
	console.log("listening on 3491");
});

