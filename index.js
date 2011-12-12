var ConnectedUsers = require('./lib/connected-users'),
	express = require('express'), 
	app = express.createServer(),
	socketIo = require('socket.io');

var store = new socketIo.RedisStore();	
var io;

function setUserdata(socket, data, cb) {
	var encoded = JSON.stringify(data);
	socket.set('userdata', encoded, cb);
}

function getUserdata(socket, cb) {
	socket.get('userdata', function (err, data) {
		if(err) {
			cb(err, null);
			return;
		}
		
		if(data) {
			var parsed = JSON.parse(data);
			cb(null, parsed);
		} else {
			socket.emit('rejoin');
		}
	});
}

var clients = [store.pub, store.sub, store.cmd];
clients.forEach(function(redis) {
	redis.on('error', function(err) {
		console.error('redis error: ' + err);
	});	
});

var reconnecting = false;

store.sub.on('reconnecting', function() {
	reconnecting = true;
});

store.sub.on('connect', function() {
	if(reconnecting && store.manager) {
		console.log('re-subscribing store');
		store.manager.initStore();
	}
	
	reconnecting = true;
});
	
io = require('socket.io').listen(app, {
	store: store
});

app.set('view options', {
  layout: false
});	
	
app.use(express.static(__dirname + '/www'));
app.get('/', function(req, res) {
	res.render('index.jade');
});

var port = 8080;
if(process.argv.length > 2) {
	port = process.argv[2];
}

app.listen(port);

io.sockets.on('connection', function (socket) {
	
	socket.on('join room', function(data, cb) {
		socket.join(data.room);
		setUserdata(socket, data, function() {
			socket.broadcast.to(data.room).emit('user entered', {
				nick: data.nick
			});
			
			var connected = new ConnectedUsers(io, data.room);
			connected.getUsers(cb);
		});
	});
	
	socket.on('leave room', function(data, cb) {
		socket.leave(data.room);
		socket.del('userdata', function(err) {
			if(!err) {
				socket.broadcast.to(data.room).emit('user left', {
					nick: data.nick
				});
				cb();
			}
			
		});
	});
	
	socket.on('chat message', function(message, cb) {
		getUserdata(socket, function (err, data) {
			socket.broadcast.to(data.room).emit('chat', {
				nick: data.nick,
				message: message
			});
			cb();
		});
		
	});
	
	socket.on('disconnect', function() {
		getUserdata(socket, function (err, data) {
			if (err) {
				console.error(err);
			} else if(data){
				socket.broadcast.to(data.room).emit('user left', {
					nick: data.nick
				});
			}
		});
	});
	
});