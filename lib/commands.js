const _ = require('lodash'),
	
	utils = require('./utils'),
	
	aliases = {
			part: ['leave'],
			r9kbeta: ['r9kmode'],
			r9kbetaoff: ['r9kmodeoff'],
			slow: ['slowmode'],
			slowoff: ['slowmodeoff']
		};

function parseCommandState(state, on, off) {
	if(_.isUndefined(state) || _.includes([true, 'enable', 'on'], state)) {
		return on || '';
	}
	return off || 'off';
}

module.exports = function() {
let methods = {
	_sayCommand: function(channel, command, ...args) {
		return Promise.resolve().then(() => {
			if(!utils.isNonEmptyString(command)) {
				let error = 'No command to send.';
				throw new TypeError(error);
			}
		})
		.then(() => this.say(channel, `/${cmd} ${args.join(' ')}`, false));
	},
	
	join: function(channel) {
		return Promise.resolve().then(() => {
			channel = utils.channel(channel);
		})
		.then(() => this._sendRaw(`JOIN ${channel}`));
	},
	part: function(channel) {
		return Promise.resolve().then(() => {
			channel = utils.channel(channel);
		})
		.then(() => this._sendRaw(`PART ${channel}`));
	},
	ping: function(address) {
		return Promise.resolve().then(() => {
			if(utils.isNonEmptyString(address)) {
				address = ' :' + address;
			}
		})
		.then(() => this._sendRaw(`PONG${address}`));
	},
	
	action: function(channel, message) {
		return this.say(channel, message, true);
	},
	say: function(channel, message, asAction = false) {
		return Promise.resolve().then(() => {
			channel = utils.channel(channel);
			if(!_.isString(message) || _.isEmpty(message)) {
				let error = 'No message.';
				throw new Error(error);
			}
			if(asAction) {
				message = `\u0001ACTION ${message}\u0001`;
			}
		})
		.then(() => this._sendRaw(`PRIVMSG ${channel} :${message}`));
	},
	
	ban: function(channel, username = '', reason = '', un = false) {
		let cmd = 'ban';
		return Promise.resolve().then(() => {
			username = utils.username(username);
			if(!_.isUndefined(reason) && !_.isNull(reason) &&
			 		!utils.isNonEmptyString(reason)) {
				let error = 'Reason is not a string.';
				throw new Error(error);
			}
			un = parseCommandState(un, 'un', '');
		})
		.then(() => this._sayCommand(channel, un + cmd, username, reason));
	},
	clear: function(channel) {
		let cmd = 'clear';
		return this._sayCommand(channel, cmd);
	},
	color: function(color = '') {
		let cmd = 'color';
		return Promise.resolve().then(() => {
			if(!utils.isNonEmptyString(reason)) {
				let error = 'No color to send.';
				throw new TypeError(error);
			}
			else if(color[0] !== '#') {
				color = '#' + color;
			}
			if(/^#[a-fA-F0-9]{6}$/.test(color)) {
				let error = 'Malformed color string.';
				throw new Error(error);
			}
		})
		.then(() => this._sayCommand('jtv', cmd, color));
	},
	commerical: function(channel, seconds = 30) {
		let cmd = 'commercial';
		return Promise.resolve().then(() => {
			seconds = utils.tryInteger(seconds);
			if(!_.isInteger(seconds)) {
				let error = 'Seconds is not a number.';
				throw new TypeError(error);
			}
		})
		.then(() => this._sayCommand(channel, cmd, color));
	},
	emoteonly: function(channel, state = true) {
		let cmd = 'emoteonly';
		return Promise.resolve().then(() => {
			state = parseCommandState(state);
		})
		.then(() => this._sayCommand(channel, cmd + state));
	},
	emoteonlyoff: function(channel) {
		return this.emoteonly(channel, false);
	},
	host: function(channel, target = '', un = false) {
		let cmd = 'host';
		return Promise.resolve().then(() => {
			target = utils.username(target);
			un = parseCommandState(un, 'un', '');
		})
		.then(() => this._sayCommand(channel, un + cmd, un ? '' : target));
	},
	mod: function(channel, username = '', un = false) {
		let cmd = 'mod';
		return Promise.resolve().then(() => {
			username = utils.username(username);
			un = parseCommandState(un, 'un', '');
		})
		.then(() => this._sayCommand(channel, un + cmd, username));
	},
	mods: function(channel) {
		let cmd = 'mods';
		return this._sayCommand(channel, cmd);
	},
	r9kbeta: function(channel = '', state = true) {
		let cmd = 'r9kbeta';
		return Promise.resolve().then(() => {
			state = parseCommandState(state);
		})
		.then(() => this.say(channel, cmd + state));
	},
	r9kbetaoff: function(channel = '') {
		return this.r9kbeta(channel, false);
	},
	slow: function(channel = '', seconds = 120, state = true) {
		let cmd = 'slow';
		return Promise.resolve().then(() => {
			if(_.isNumber(seconds)) {
				if(seconds <= 0) {
					state = false;
				}
				else {
					state = true;
				}
				seconds = _.toInteger(seconds);
			}
			else {
				state = seconds;
				seconds = 120;
			}
			state = parseCommandState(state);
		})
		.then(() => this._sayCommand(channel, cmd + state, seconds));
	},
	slowoff: function(channel = '') {
		return this.slow(channel, false);
	},
	subscribers: function(channel = '', state = true) {
		let cmd = 'subscribers';
		return Promise.resolve().then(() => {
			state = parseCommandState(state);
		})
		.then(() => this.say(channel, cmd + state));
	},
	subscribersoff: function(channel = '') {
		return this.subscribers(channel, false);
	},
	timeout: function(channel = '', username = '', seconds = 1, reason = '') {
		let cmd = 'timeout';
		return Promise.resolve().then(() => {
			username = utils.username(username);
			if(!_.isNumber(seconds)) {
				seconds = utils.tryInteger(seconds || 1);
				if(!_.isNumber(seconds)) {
					seconds = 1;
				}
			}
			if(seconds <= 0) {
				seconds = 1;
			}
			if(!_.isString(reason)) {
				reason = '';
			}
		})
		.then(() => this._sayCommand(channel, cmd, username, seconds, reason));
	},
	unban: function(channel, username) {
		return this.ban(channel, username, null, true);
	},
	unhost: function(channel) {
		return this.host(channel, null, true);
	},
	unmod: function(channel, username) {
		return this.mod(channel, username, true);
	},
	whisper: function(username, message) {
		let cmd = 'w';
		return this._sayCommand('jtv', cmd, username, message);
	}
};
_.forEach(methods, (f, k) => {
		this[k] = f;
		if(_.has(aliases, k)) {
			aliases[k].forEach(n => this[n] = f);
		}
	});
};
