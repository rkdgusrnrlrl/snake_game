/**
 * Created by khk on 2016-06-22.
 */


var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res){
    res.sendfile('index.html');
});

function snakeInit() {
    var x = 0,
        y = 0,
        snak = [];

    for (var i = 0; i < 5 ; i ++) {
        snak.push({x:x,y:y});
        x += 5;
    }

    console.log("스네이크 데이너 init");



    return snak
}


io.on('connection', function(socket){
    console.log('a user connected');
    io.emit('drawNewSnake', snakeInit());
    console.log("스네이크 데이너 전송");

    socket.on('chat message', function(msg){
        console.log(msg);
        io.emit('msg', msg);
    });
});

http.listen(3000, function(){
    console.log('listening on *:3000');
});