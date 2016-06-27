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

var STATUS = {
    CRUSHED : "crushed",
    IS_LIVE : "isLive",
    IS_DEAD : "isDead"
};

function snakeInit() {
    var x = 0,
        y = 0,
        snak = {drec: RIGHT, status : STATUS.IS_LIVE ,bodys : []};

    for (var i = 0; i < 5 ; i ++) {
        snak.bodys.push({x:x,y:y});
        x += 5;
    }

    return snak
}

function checkTwoX(x2, x) {
    return (x2 <= x && x <= x2 + BODY_SIZE)
        || (x2 <= x + BODY_SIZE && x + BODY_SIZE <= x2 + BODY_SIZE);
}
function checkTwoY(y2, y) {
    return (y2 <= y && y <= y2 + BODY_SIZE)
        || (y2 <= y + BODY_SIZE && y + BODY_SIZE <= y2 + BODY_SIZE);
}

function isCrushWall(head) {
    var x = head.x,
        y = head.y;

    if (x < 0 || x > MAX_WIDTH
        || y < 0 || y > MAX_HEIGHT) {
        return true;
    }
    return false;
}
function getFnIsNotCrush(some) {
    return function isCrush(other) {
        var x = some.x;
        var y = some.y;

        var x2 = other.x;
        var y2 = other.y;

        //위로 갈때
        if (checkTwoX(x2, x)){
            if (y2 <= y && y <= y2+BODY_SIZE) {
                return false;
            }
        }
        //아래로 갈때
        if (checkTwoX(x2, x)){
            if (y2 <= y +BODY_SIZE && y+BODY_SIZE <= y2+BODY_SIZE) {
                return false;
            }
        }

        //오른쪽로 갈때
        if (checkTwoY(y2, y)){
            if (x2 <= x +BODY_SIZE && x+BODY_SIZE <= x2+BODY_SIZE) {
                return false;
            }
        }

        //왼쪽로 갈때
        if (checkTwoY(y2, y)){
            if (x2 <= x && x <= x2+BODY_SIZE) {
                return false;
            }
        }
        return true;
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
var sockets = {};


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

function printSocketList(){
    cosole.log(socketList.map((socket) => { return socket.id }));
}



var isStart = false;
io.on('connection', function(socket){
    console.log('a user connected');
    var snake = snakeInit();
    var foods = foodInit();
    snakes[socket.id] = snake
    socketList.push(socket);

    printSocketList();
    socket.join('gaming');
    socket.emit('gameInit', {snake : snake.bodys, foods : foods});
    console.log("스네이크 데이너 전송");

    socket.on('move snake', function(msg){
        console.log(msg);
        var snake = snakes[socket.id];
		moveHead(snake, msg);
    });

    if (isStart) {

    } else {
        (function gameLoop () {
            //소켓 리스트에서 아이디를 꺼낸뒤 그 아이디로 해당 뱀을 꺼내줌
            socketList.forEach(function (socket){
                var snake = snakes[socket.id];
                var head = putNewHead(snake);
                var tail = clearTail(snake);
                switch (snake.status) {
                    case STATUS.CRUSHED:
                        snake.status = STATUS.IS_DEAD;
                        console.log(socket.id+"가 죽었습니다.");
                        socket.leave('gaming');
                        break;
                    case STATUS.IS_DEAD:
                        break;
                    default:
                        var isCrushThan = getFnIsNotCrush(head);


                        if (isCrushWall(head)) {
                            snake.status = STATUS.CRUSHED;
                            socket.emit('crushed', "LOST");
                        } else {
                            var isFine = socketList.every(function (_socket) {
                                if (socket.id !== _socket.id) {
                                    var _snake = snakes[_socket.id];
                                    return _snake.bodys.every(isCrushThan)
                                }
                                return true;
                            });

                            if (isFine) {
                                io.to('gaming').emit('gameLoop', { newHead: head, tail : tail });
                            } else {
                                snake.status = STATUS.CRUSHED;
                                socket.emit('crushed', "LOST");
                            }
                        }
                }
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
