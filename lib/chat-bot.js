var io = require('socket.io-client'),
	argv = require('optimist')
		.usage('Usage: $0 -n [nick] -r [room] -p [port]')
		.default('n', 'server')
		.default('r', 'room1')
		.default('p', 8080)
		.argv;


var nick = argv.n;
var room = argv.r;
var port = argv.p;

var connectUri = "http://localhost:" + port;
console.log('connecting to ' + connectUri);
var socket = io.connect(connectUri);

socket.on('connect', function() {
	console.log('connected');
	socket.emit('join room', {
		nick: nick,
		room: room
	}, function(connectedUsers) {
		console.log('joined room ' + room + ' as ' + nick);
		setInterval(function() {
			socket.emit('chat message', 'i\'m a bot!', function() {});
		}, 5000);
	});
});

