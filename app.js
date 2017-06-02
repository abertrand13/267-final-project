const express = require('express');
const path = require('path');

const app = express();
app.use("/css", express.static(__dirname + '/css'));
app.use("/js", express.static(__dirname + '/js'));


app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/render.html'));
});


app.listen(3000, function() {
    console.log('Listening on port 3000');
});

var net = require('net');

var server = net.createServer(function(socket) {
	socket.write('Echo server\r\n');
	// socket.pipe(socket);
	socket.on("data", function(data){
		console.log(data.toString());
	});
});

server.listen(3490, '127.0.0.1', function(){
	console.log("listening on 3490");
});

