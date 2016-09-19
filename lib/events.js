const _ = require('lodash'),
	
	ircC = require('../data/irc_commands.json'),
	utils = require('./utils');

module.exports = function() {

let handlers = {
	[ircC.IRC_MOTD]: function(cmd, params, tags, prefix, raw, interp) {
		this.connected = true;
		this.emit('connected', this.conn.address);
	},
	[ircC.TMI_G_USERSTATE]: function(cmd, params, tags, prefix, raw, interp) {
		let state = utils.fixTags(tags);
		this.globaluserstate = state;
		this.emit('globaluserstate', state);
	},
	[ircC.TMI_HOSTTARGET]: function(cmd, params, tags, prefix, raw, interp) {
		let channel = interp.channel,
			target = params[1].split(' ')[0];
		this.channels[channel].hosting = target;
		this.emit('hosting', channel, target);
	},
	[ircC.TMI_JOIN]: function(cmd, params, tags, prefix, raw, interp) {
		let channel = interp.channel,
			username = prefix.nick;
		this.emit('join', channel, username, false);
		//this.channels[channel]._userJoined(username);
	},
	[ircC.TMI_PART]: function(cmd, params, tags, prefix, raw, interp) {
		let channel = interp.channel,
			username = prefix.nick;
		this.emit('part', channel, username, false);
		//this.channels[channel]._userParted(username);
	},
	[ircC.TMI_PING]: (cmd, params, tags, raw, interp) => {
		this.emit('ping');
		return this._sendRaw(`PONG :${params[0]}`);
	},
	[ircC.TMI_PRIVMSG]: function(cmd, params, tags, prefix, raw, interp) {
		let channel = interp.channel;
		this.channels[channel].hosting = target;
		this.emit('message', channel, target);
	},
	[ircC.TMI_ROOMSTATE]: function(cmd, params, tags, prefix, raw, interp) {
		let channel = interp.channel;
		this.channels[channel] = {
				roomstate: utils.fixTags(tags),
				hosting: null,
				moderators: []
			};
		this.emit('roomstate', this.channels[channel].roomstate);
	}
};

return {
		handlers: _.mapValues(handlers, f => f.bind(this))
	};

};
