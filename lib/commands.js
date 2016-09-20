const _ = require('lodash'),
	
	utils = require('./utils');

function parseState(state, on, off) {
	if(_.isUndefined(state) || _.includes([true, 'enable', 'on'], state)) {
		return on || '';
	}
	return off || 'off';
}

module.exports = function() {
let methods = {
	action: function(channel, message) {
		return this.say(channel, message, true);
	},
	ban: function(channel = '', username = '', reason = '', un = false) {
		return Promise.resolve().then(() => {
			username = utils.username(username);
			if(_.isUndefined(reason) || _.isNull(reason)) {
			}
			else if(!_.isString(reason)) {
				let error = 'Reason is not a string.';
				throw new Error(error);
			}
			un = parseState(un, 'un', '');
		})
		.then(() => this.say(channel, `/${un}ban ${username} ${reason}`));
	},
	clear: function(channel = '') {
		return this.say(channel, `/clear`);
	},
	color: function(color = '') {
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
		.then(() => this.say('#jtv', `/color ${color}`));
	},
	commerical: function(channel = '', seconds = 30) {
		return Promise.resolve().then(() => {
			seconds = utils.tryInteger(seconds);
			if(!_.isInteger(seconds)) {
				let error = 'Seconds is not a number.';
				throw new TypeError(error);
			}
		})
		.then(() => this.say(channel, `/commercial ${color}`));
	},
	emoteonly: function(channel = '', state = true) {
		return Promise.resolve().then(() => {
			state = parseState(state);
		})
		.then(() => this.say(channel, `/emoteonly${state}`));
	},
	emoteonlyoff: function(channel = '') {
		return this.emoteonly(channel, false);
	},
	host: function(channel = '', target = '', un = false) {
		return Promise.resolve().then(() => {
			target = utils.username(target);
			un = parseState(un, 'un', '');
		})
		.then(() => this.say(channel, `/${un}host ${un ? '' : target}`));
	},
	join: function(channel = '') {
		return Promise.resolve().then(() => {
			channel = utils.channel(channel);
		})
		.then(() => this._sendRaw(`JOIN ${channel}`));
	},
	mod: function(channel = '', username = '', un = false) {
		return Promise.resolve().then(() => {
			username = utils.username(username);
			un = parseState(un, 'un', '');
		})
		.then(() => this.say(channel, `/${un}mod ${username}`));
	},
	mods: function(channel = '', username = '') {
		return Promise.resolve().then(() => {
			username = utils.username(username);
		})
		.then(() => this.say(channel, `/mod ${username}`));
	},
	part: function(channel = '') {
		return Promise.resolve().then(() => {
			channel = utils.channel(channel);
		})
		.then(() => this._sendRaw(`PART ${channel}`));
	},
	ping: function(address = '') {
		return Promise.resolve().then(() => {
			if(utils.isNonEmptyString(address)) {
				address = ' :' + address;
			}
		})
		.then(() => this._sendRaw(`PONG${address}`));
	},
	r9kbeta: function(channel = '', state = true) {
		return Promise.resolve().then(() => {
			state = parseState(state);
		})
		.then(() => this.say(channel, `/r9kbeta${state}`));
	},
	r9kbetaoff: function(channel = '') {
		return this.r9kbeta(channel, false);
	},
	say: function(channel = '', message = '', asAction = false) {
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
	slow: function(channel = '', seconds = 120, state = true) {
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
			state = parseState(state);
		})
		.then(() => this.say(channel, `/slow${state} ${seconds}`));
	},
	slowoff: function(channel = '') {
		return this.slow(channel, false);
	},
	subscribers: function(channel = '', state = true) {
		return Promise.resolve().then(() => {
			state = parseState(state);
		})
		.then(() => this.say(channel, `/subscribers${state}`));
	},
	subscribersoff: function(channel = '') {
		return this.subscribers(channel, false);
	},
	timeout: function(channel = '', username = '', seconds = 1, reason = '') {
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
		.then(() => this.say(channel,
				`/timeout ${username} ${seconds} ${reason}`)
			);
	},
	unban: function(channel = '', username = '') {
		return this.ban(channel, username, null, true);
	},
	unhost: function(channel = '') {
		return this.host(channel, null, true);
	},
	unmod: function(channel = '', username = '') {
		return this.mod(channel, username, true);
	},
	whisper: function(username, message) {
		return this.say('jtv', `/w ${username} ${message}`);
	}
};
_.forEach(methods, (f, k) => this[k] = f);
};
