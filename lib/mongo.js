var Store = require('socket.io').Store,
	util = require('util');

var Mongo = function(opts) {
	Store.prototype.call(this, opts);
};

util.inherits(Mongo, Store);