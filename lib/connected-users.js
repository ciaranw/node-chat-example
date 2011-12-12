var EventEmitter = require('events').EventEmitter;

var ConnectedUsers = function(io, room) {
	var me = this;
	this.io = io;
	this.room = room;
	this.connected = [];
	this.emitter = new EventEmitter();
	this.emitter.on('user', function(user) {
		me.connected.push(user.nick);
	});
};

ConnectedUsers.prototype.getUsers = function(cb) {
	var clients = this.io.sockets.clients(this.room);
	
	this.collect(clients, cb);
};

ConnectedUsers.prototype.collect = function(clients, cb) {
	var me = this;
	var seen = 0;
	clients.forEach(function (client) {
		client.get('userdata', function(err, data) {
			if(data) {
				me.emitter.emit('user', JSON.parse(data));
			}
			seen++;
			if(seen === clients.length) {
				cb(me.connected);
			}
		});
	});
};

module.exports = ConnectedUsers;