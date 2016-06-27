/**
 * Created by khk on 2016-06-22.
 */


var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res){
    res.sendfile('index.html');
});


var snake = [];
/*
* 게임에 활용되는 상수
* */

var BODY_SIZE = 5;
var MAX_WIDTH = 600;
var MAX_HEIGHT = 600;

var MAX_TAIL = 10;

var FRAME_LENGTH = 100; //new frame every 0.5 seconds

var UP = {x: 0, y : -BODY_SIZE};
var DOWN = {x: 0, y : BODY_SIZE};
var RIGHT = {y: 0, x : BODY_SIZE};
var LIFT = {y: 0, x : -BODY_SIZE};

var DIRECTION_ARRAY = [DOWN, RIGHT, UP, LIFT];

function foodInit() {
    var foods = [];
    while (true) {
        var foodX = Math.floor(Math.random() * MAX_WIDTH);
        var foodY = Math.floor(Math.random() * MAX_HEIGHT);
        var newFood =  {x:foodX, y:foodY};
        if (foods.indexOf(newFood) < 0) {
            foods.push(newFood);
            if (foods.length > BODY_SIZE) break;
        }
    }
    return foods;
}

function snakeInit() {
    var x = 0,
        y = 0,
        snak = {drec: RIGHT, bodys : []};

    for (var i = 0; i < 5 ; i ++) {
        snak.bodys.push({x:x,y:y});
        x += 5;
    }

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
function lastIdx(snak) {
    return snak.length-1;
}

function putNewHead(snak) {
    var snakeBodys = snak.bodys;
	var drec = snak.drec;
    var prevHead = snakeBodys[lastIdx(snakeBodys)];
    var newHead = {     x :prevHead.x + drec.x
                        , y :prevHead.y + drec.y };
    snakeBodys.push(newHead);
    return newHead;
}

var snakes = {};
var socketList = [];

function clearTail(snak){
    var tail = snak.bodys.splice(0,1)[0];
    return tail;
}

function moveHead(snake, key) {
	var way;
	switch (key) {
		case 39:
			way = -1;
			break;
		case 37:
			way = 1;
			break;
		default:
			return;
	}
	var idx = DIRECTION_ARRAY.indexOf(snake.drec);
	
	var newIdex = moveIndex(idx + way, DIRECTION_ARRAY.length);
	snake['drec'] = DIRECTION_ARRAY[newIdex];
}

function moveIndex(direct, len) {
	var val = direct % len;
	if (val <0 ) {
		val = len + val;
	}
	return val;
}



var isStart = false;
io.on('connection', function(socket){
    console.log('a user connected');
    var snake = snakeInit();
    var foods = foodInit();
    snakes[socket.id] = snake
    socketList.push(socket.id);

    socket.emit('gameInit', {snake : snake.bodys, foods : foods});
    console.log("스네이크 데이너 전송");

    socket.on('move snake', function(msg){
		var snake = snakes[socket.id];
		moveHead(snake, msg);
    });

    if (isStart) {

    } else {
        (function gameLoop () {
            //소켓 리스트에서 아이디를 꺼낸뒤 그 아이디로 해당 뱀을 꺼내줌
            socketList.forEach(function (socketId){
				console.log(socketList);
                var snake = snakes[socketId];
                var head = putNewHead(snake);
                var tail = clearTail(snake);
                io.emit('gameLoop', { newHead: head, tail : tail });
            });
            setTimeout(gameLoop, 500);
        })();
        isStart = true;
    }

    socket.on('disconnect', function(){
        console.log(this.id);
        removeVal(socketList, this.id);
        delete snakes[this.id];
        io.emit('removeSnake', snake.bodys);
        console.log('user disconnected');
    });
});

function removeVal(arr, val){
    var idx = arr.indexOf(val);
    arr.splice(idx,1)[0];
}

http.listen(3000, function(){
    console.log('listening on *:3000');
});
