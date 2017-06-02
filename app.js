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
