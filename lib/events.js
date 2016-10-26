const _ = require('lodash'),
	
	ircC = require('../data/irc_commands.json'),
	utils = require('./utils');

module.exports = function() {

let handlers = {
	[ircC.IRC_MOTD]: function(params, tags, prefix, raw, interp) {
		this.connected = true;
		this.emit('connected', this.conn.address);
	},
	[ircC.TMI_G_USERSTATE]: function(params, tags, prefix, raw, interp) {
		let state = utils.fixTags(tags);
		this.globaluserstate = state;
		this.emit('globaluserstate', state);
	},
	[ircC.TMI_HOSTTARGET]: function(params, tags, prefix, raw, interp) {
		let channel = interp.channel,
			target = params[1].split(' ')[0];
		this.channels[channel].hosting = target;
		this.emit('hosting', channel, target);
	},
	[ircC.TMI_JOIN]: function(params, tags, prefix, raw, interp) {
		let channel = interp.channel,
			username = prefix.nick;
		this.emit('join', channel, username, false);
	},
	[ircC.TMI_MODE]: function(params, tags, prefix, raw, interp) {
		let channel = interp.channel,
			mode = params[1],
			username = params[2];
		if(mode === '+o') {
			this.channels[channel].moderators.add(username);
		}
		else if(mode === '-o') {
			this.channels[channel].moderators.delete(username);
		}
	},
	[ircC.TMI_NOTICE]: function(params, tags, prefix, raw, interp) {
		let channel = interp.channel,
			msgId = tags.msgId,
			message = params[1],
		if(!handler) {
			console.log(`Unhandled notice: [${channel}] ${msgId} - ${message}`);
			this.emit('notice', channel, msgId, message);
			return false;
		}
		else if(handler.emitNotice) {
			this.emit('notice', channel, msgId, message);
		}
		if(handler.func) {
			let group = _.findKey(handler.msgIds, n => _.includes(n, msgId));
			return handler.func(msgId, group, ...arguments.slice(1));
		}
	},
	[ircC.TMI_PART]: function(params, tags, prefix, raw, interp) {
		let channel = interp.channel,
			username = prefix.nick;
		this.emit('part', channel, username, false);
	},
	[ircC.TMI_PING]: (params, tags, raw, interp) => {
		this.emit('ping');
		return this.ping(params[0]);
	},
	[ircC.TMI_PRIVMSG]: function(params, tags, prefix, raw, interp) {
		let channel = interp.channel,
			userstate = _.clone(tags),
			message = params[1],
			actionMessage = utils.parseActionMessage(message);
		userstate.username = prefix.nick;
		userstate.name = userstate.displayName || userstate.username;
		if(actionMessage) {
			message = actionMessage;
		}
		this.emit('message', channel, userstate, message, false);
	},
	[ircC.TMI_ROOMSTATE]: function(params, tags, prefix, raw, interp) {
		let channel = interp.channel,
			roomstate = utils.fixTags(tags);
		this._updateChannel(channel, { roomstate });
		this.emit('roomstate', channel, this.channels[channel].roomstate);
	},
	[ircC.TMI_USERSTATE]: function(params, tags, prefix, raw, interp) {
		let channel = interp.channel,
			userstate = utils.fixTags(tags);
		this._updateChannel(channel, { userstate });
		this.emit('userstate', channel, userstate);
	}
};

return {
		handlers: _.mapValues(handlers, f => f.bind(this))
	};

};
