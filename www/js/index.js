var Chat = function (url, nick, room) {
	this.messagesElement = $("#messages");
	this.nick = nick;
	this.room = room;
	this.socket = io.connect(url, {
		'force new connection': true
	});
	var me = this;
	this.socket.on('connect', function() {
		$('#clientId').text(me.socket.socket.sessionid);
	});
	
	this.socket.on('chat', function(data) {
		me.onChat(data);
	});

	this.socket.on('user entered', function(data) {
		me.onUserEntered(data.nick);
		me.notify(data.nick + " entered the room");
	});

	this.socket.on('user left', function(data) {
		me.onUserLeft(data.nick);
		me.notify(data.nick + " left the room");
	});
	
	this.socket.on('rejoin', function() {
		alert('rejoin');
	});
	
	this.renderChat = function(element) {
		var messagesElement = $("#messages");
		var scrollBottom = messagesElement.prop('scrollTop') + messagesElement.height();
		var shouldScroll = scrollBottom === messagesElement.prop('scrollHeight');
		
		messagesElement.append(element);

		if(shouldScroll) {
			messagesElement.prop({scrollTop: messagesElement.prop('scrollHeight')});
		}
	};
};

Chat.prototype.onRoomJoined = function(connectedUsers) {
	var me = this;
	$('#login').fadeOut();
	$('#chat').fadeIn();
	this.setConnectedUsers(connectedUsers);
	$('#roomName').text(this.room);
	$('#login').fadeOut();
};

Chat.prototype.joinRoom = function(cb) {
	var me = this;
	var joinData = {
		nick: this.nick,
		room: this.room
	};
	this.socket.emit('join room', joinData, cb);
	
};

Chat.prototype.onRoomLeft = function() {
	$('#messages > p').remove();
	$('#connected > li').remove();
	$('#chat').fadeOut();
	$('#login').fadeIn();
};

Chat.prototype.leaveRoom = function(cb) {
	var me = this;
	var leaveData = {
		nick: this.nick,
		room: this.room
	};
	this.socket.emit('leave room', leaveData, function() {
		me.socket.disconnect();
		cb();
	});
};

Chat.prototype.onChat = function (data) {
	var line = $('<p>');
	$('<span>').addClass('nick ' + data.nick).text(data.nick).appendTo(line); 
	$('<span>').addClass('message').text(data.message).appendTo(line);
	
	this.renderChat(line);
}; 

Chat.prototype.notify = function(text) {
	var line = $('<p>');
	$('<span>').addClass('notification').text(text).appendTo(line);
	
	this.renderChat(line);
};

Chat.prototype.onUserEntered = function(user) {
	var li = $('<li>').prop('id', 'connected-' + user).text(user);
	$('#connected').append(li);
};

Chat.prototype.onUserLeft = function(user) {
	$('#connected-' + user).remove();
};

Chat.prototype.sendMessage = function(message, cb) {
	this.socket.emit('chat message', message, cb);
};

Chat.prototype.setConnectedUsers = function(connectedUsers) {
	for(var i=0; i<connectedUsers.length; i++) {
		this.onUserEntered(connectedUsers[i]);
	}
};

function init() {
	$(document).ready(function () {	

		var chat;
		
		$('#join').click(function(e) {
			e.preventDefault();
			var nick = $('#nick').val();
			var room = $('#room').val();

			chat = new Chat('/', nick, room);
			chat.joinRoom(function(connectedUsers) {
				chat.onRoomJoined(connectedUsers);
			});
		});
		
		$('#leave').click(function(e) {
			e.preventDefault();
			
			chat.leaveRoom(function() {
				chat.onRoomLeft();
				chat = null;
			});
		});
		
		$('#send-message').click(function(e) {
			e.preventDefault();
			var message = $('#message').val();
			chat.sendMessage(message, function(){
				chat.onChat({
					nick: 'me',
					message: message
				});
			});
			$('#message').val('');
		});

	});
}