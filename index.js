var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var session = require('express-session');

var Player = require('./Player');
var Room = require('./Room');

var PokerManager = require('./PokerManager');
var pokerManager = new PokerManager();

var PokerHelper = require('./PokerHelper');
var pokerHelper = new PokerHelper();

var sessionMiddleWare = session({
	secret: 'puppyyyuan',
	cookie: {
		maxAge: 1800000
	},
	resave: false,
	saveUninitialized: true,
});

app.use(sessionMiddleWare);

app.get('/', function (req, res) {
	res.send('Hello World');
});

io.use(function (socket, next) {
	sessionMiddleWare(socket.request, socket.request.res, next);
});


var rooms = [];

function getEmptyRoom() {

	if (rooms.length > 0) {
		for (var i = 0, len = rooms.length; i < len; i++) {
			if (rooms[i].isEmpty()) {
				return rooms[i];
			}
		}
	}

	var room = new Room(rooms.length);
	rooms.push(room);
	return room;
}

io.on('connection', function (socket) {
	var sessionId = socket.request.session.id;
	console.log('用户: ' + sessionId + ',连接成功');

	// 连接成功返回sessionId
	socket.emit('connectNotify', sessionId);

	// 登录
	socket.on('login', function (msg) {

		var player = new Player(sessionId, msg, socket.id);
		socket.request.session.player = player;
		console.log('用户：' + sessionId + ', 用户名：' + msg + ', 登录成功');

		socket.emit('loginNotify', '登录成功');
	});

	// 加入房间
	socket.on('level1Join', function () {
		var player = socket.request.session.player;
		var room = getEmptyRoom();
		room.join(player);
		player.roomNum = room.roomNum;

		let msg = '用户：' + sessionId + ', 用户名：' + player.name + ', 加入房间：' + room.name + '成功'
		socket.join(room.name);
		console.log(msg);

		let returnObj = {
			msg: msg,
			isFull: !room.isEmpty,
			roomIndex: player.index,
			roomNum: room.roomNum,
		}

		socket.emit('level1JoinNotify', returnObj);
		io.to(room.name).emit('roomJoinBroadcast', returnObj);
	});

	// 准备
	socket.on('ready', function () {
		var player = socket.request.session.player;
		player.ready = true;

		let msg = '用户：' + player.name + '准备成功';
		console.log(msg);

		var room = rooms[player.roomNum];
		room.addReady();
		socket.emit('readyNotify', msg);
		io.to(room.name).emit('roomReadyBroadcast', msg);

		if (room.readyCount == 3) {
			dealCards(room);
		}
	});

	// 叫地主
	socket.on('call', function (msg) {
		var player = socket.request.session.player;
		var room = rooms[player.roomNum];

		room.lastCallIndex = player.index;
		room.callCount--;
		console.log('用户：' + player.name + '叫地主');

		let nextIndex = player.index + 1 == 3 ? 0 : player.index + 1;

		if (room.callCount > 0) {
			socket.emit('callNotify');
			io.to(room.name).emit('roomCallBroadcast', nextIndex);
		} else {

			var resultObj = {};
			for (var i = 0, len = room.players.length; i < len; i++) {

				let player = room.players[i];
				if (i === room.lastCallIndex) {
					player.pokerList = player.pokerList.concat(room.lordPokers);
				}

				resultObj.lord = (i === room.lastCallIndex ? true : false);
				resultObj.lordIndex = room.lastCallIndex;
				resultObj.lordPokers = room.lordPokers;

				io.to(player.socketId).emit('callResult', resultObj);
			}

			room.currentPlayIndex = room.lastCallIndex;
			room.resetCall();
		}

	});

	// 不叫地主
	socket.on('uncall', function (msg) {
		var player = socket.request.session.player;
		var room = rooms[player.roomNum];

		room.callCount--;
		room.uncallCount++;
		console.log('用户：' + player.name + '不叫地主');

		let nextIndex = player.index + 1 == 3 ? 0 : player.index + 1;
		if (room.callCount > 0) {

			if (room.uncallCount > 2) {
				room.resetCall();
				dealCards(room);
				return;
			}

			socket.emit('uncallNotify');
			io.to(room.name).emit('roomCallBroadcast', nextIndex);

		} else {

			var resultObj = {};
			for (var i = 0, len = room.players.length; i < len; i++) {

				let player = room.players[i];
				if (i === room.lastCallIndex) {
					player.pokerList = player.pokerList.concat(room.lordPokers);
				}

				resultObj.lord = (i === room.lastCallIndex ? true : false);
				resultObj.lordIndex = room.lastCallIndex;
				resultObj.lordPokers = room.lordPokers;

				io.to(player.socketId).emit('callResult', resultObj);
			}

			room.currentPlayIndex = room.lastCallIndex;
			room.resetCall();
		}
	});

	// 出牌
	socket.on('play', function (pokerList) {
		var player = socket.request.session.player;
		var room = rooms[player.roomNum];
		console.dir(pokerList);
		if (player.index !== room.currentPlayIndex) {
			socket.emit('playNotify', '还不到你出牌！');
			return;
		}

		if (!pokerList || pokerList.length == 0) {
			socket.emit('playNotify', '请选择你要出的牌');
			return;
		}

		try {
			var pokerWrapper = pokerHelper.getPokerWrapper(pokerList);
			console.dir(pokerWrapper);

			var result = pokerWrapper.follow([ 39, 38, 37, 35 ]);
			console.dir(result);

		} catch (err) {
			
			socket.emit('playNotify', err);
			return;
		}

		arrayPokerDifference(player.pokerList, pokerList);

	});

	// 离开游戏
	socket.on('leave', function (msg) {

	});

	// 退出
	socket.on('disconnect', function (msg) {

	});

});

http.listen(3000, function () {
	console.log('server started listen on: ' + 3000);
});

function dealCards(room) {
	var pokerMap = pokerManager.genAllPokers();
	console.dir(pokerMap);

	room.lordPokers = pokerMap[3];

	var lordIndex = Math.round(Math.random() * 10) % 3;

	for (var i = 0, len = room.players.length; i < len; i++) {
		var player = room.players[i];
		var index = player.index;

		player.pokerList = pokerMap[i];

		var rightIndex = index + 1 > 2 ? 0 : index + 1;
		var leftIndex = index + 2 > 2 ? 0 : index + 2;
		var obj = {
			myCards: player.pokerList,
			right: pokerMap[rightIndex].length,
			left: pokerMap[leftIndex].length,
			lord: lordIndex == i
		};
		io.to(player.socketId).emit('dealCards', obj);
	}
}

function arrayPokerDifference(a, b) {
	var map = {};

	for (var i = 0; i < b.length; i++) {
		var pokerB = b[i];
		map[pokerB] = pokerB;
	}

	var flag = true;
	while (flag) {
		var index = -1;
		for (var j = 0; j < a.length; j++) {
			var pokerA = a[i];
			if (map[pokerA]) {
				index = i;
				flag = true;
				break;
			}
		}

		if (index == -1) {
			flag = false;
		} else {
			a.splice(index, 1);
		}
	}
}