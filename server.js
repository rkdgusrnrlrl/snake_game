/**
 * Created by khk on 2016-06-22.
 */


var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res){
    res.sendfile('index.html');
});

var foods = []

function foodInit() {
    while (true) {
        var foodX = Math.floor(Math.random() * MAX_WIDTH);
        var foodY = Math.floor(Math.random() * MAX_HEIGHT);
        var newFood =  square(foodX, foodY);
        if (foods.indexOf(newFood) < 0) {
            foods.push(newFood);
            if (foods.length > BODY_SIZE) break;
        }
    }
}

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

function square (sq) {
    return {
        x : sq.x || 0,
        y : sq.y || 0,
        getXY : function () {
            return {x : this.x, y : this.y};
        },
        isIn : function (other) {
            //위로 갈때
            if (((other.x <= this.x && this.x <= other.x + BODY_SIZE))
                || (other.x <= this.x+BODY_SIZE && this.x+BODY_SIZE <= other.x +BODY_SIZE)){
                if (other.y <= this.y && this.y <= other.y+BODY_SIZE) {
                    return true;
                }
            }
            //아래로 갈때
            if ((other.x <= this.x && this.x <= other.x + BODY_SIZE)
                || (other.x <= this.x+BODY_SIZE && this.x+BODY_SIZE <= other.x +BODY_SIZE)){
                if (other.y <= this.y +BODY_SIZE && this.y+BODY_SIZE <= other.y+BODY_SIZE) {
                    return true;
                }
            }

            //오른쪽로 갈때
            if ((other.y <= this.y && this.y <= other.y + BODY_SIZE)
                || (other.y <= this.y+BODY_SIZE && this.y+BODY_SIZE <= other.y +BODY_SIZE)){
                if (other.x <= this.x +BODY_SIZE && this.x+BODY_SIZE <= other.x+BODY_SIZE) {
                    return true;
                }
            }

            //왼쪽로 갈때
            if ((other.y <= this.y && this.y <= other.y + BODY_SIZE)
                || (other.y <= this.y+BODY_SIZE && this.y+BODY_SIZE <= other.y +BODY_SIZE)){
                if (other.x <= this.x && this.x <= other.x+BODY_SIZE) {
                    return true;
                }
            }
            return false;
        }
    }
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