const EventEmitter = require('events'),
	url = require('url'),
	
	_ = require('lodash'),
	ircMessage = require('irc-message'),
	ircPrefixParser = require('irc-prefix-parser'),
	WebSocket = require('ws'),
	
	events = require('./events'),
	ircC = require('../data/irc_commands.json'),
	utils = require('./utils'),
	
	readyStatesClosed = [WebSocket.CLOSED, WebSocket.CLOSING],
	readyStatesOpen = [WebSocket.OPEN, WebSocket.OPENING];

class Client extends EventEmitter {
	constructor(opts = {}) {
		super();
		this.opts = opts;
		this.opts.conn = this.opts.conn || {};
		this.opts.identity = this.opts.identity || {};
		
		this.ws = null;
		this.conn = {
				protocol: this.opts.conn.protocol || null,
				hostname: this.opts.conn.hostname || null,
				port: this.opts.conn.port || null,
				secure: this.opts.conn.secure || true,
				events: {
					open: this._onOpen.bind(this),
					close: this._onClose.bind(this),
					message: this._onMessage.bind(this),
					error: this._onError.bind(this)
				}
			};
		
		this.identity = {
				username: this.opts.identity.username || utils.genJustinFan(),
				password: this.opts.identity.password || null
			};
		
		this.globaluserstate = null;
		this.channels = {
				'jtv': null
			};
		
		this._events = events.call(this);
		this._events.handlers = _.mapValues(this._events.handlers,
				f => f.bind(this));
		
		if(!this.conn.protocol) {
			this.conn.protocol = this.conn.secure ? 'wss' : 'ws';
		}
		if(!this.conn.hostname) {
			this.conn.hostname = 'irc-ws.chat.twitch.tv';
		}
		if(!this.conn.port) {
			this.conn.port = this.conn.secure ? 443 : 80;
		}
	}
	
	get readyState() {
		if(_.isNull(this.ws)) {
			return 3;
		}
		return this.ws.readyState;
	}
	get connected() {
		return !_.isNull(this.ws) && this.readyState === WebSocket.OPEN;
	}
	
	connect() {
		if(!_.isNull(this.ws) && (this.ws.connected || !this.readyState)) {
			let error = 'Connection already open.';
			return Promise.reject(new Error(error));
		}
		let events = ['open', 'close', 'message', 'error'];
		return new Promise((resolve, reject) => {
			let { protocol, hostname, port } = this.conn;
			this.conn.address = url.format({ protocol, hostname, port });
			
			this.ws = new WebSocket(this.conn.address, 'irc');
			
			this.ws.once('open', resolve);
			this.ws.once('error', reject);
			
			_.forEach(events, e => this.ws.on(e, this.conn.events[e]));
		})
		.then(() => {
			let args = [this.conn.address];
			this.emit('connected', ...args);
			return args;
		})
		.catch(error => {
			let arg = error;
			this.emit('error', arg);
			throw arg;
		});
	}
	disconnect() {
		if(!this.connected || this.readyState === 3) {
			let error = 'Connection already closed.';
			return Promise.reject(new Error(error));
		}
		return new Promise((resolve, reject) => {
			this.ws.disconnect();
			this.ws.once('close', (code, message) => resolve());
		});
	}
	
	_sendRaw(msg) {
		if(_.isNull(this.ws)) {
			let error = 'Connection not open.';
			return Promise.reject(new Error(error));
		}
		else if(!_.isString(msg)) {
			let error = 'Message is not a string.';
			return Promise.reject(new TypeError(error));
		}
		return new Promise((resolve, reject) => {
			this.ws.send(msg, err => {
				if(err) {
					return reject(err);
				}
				resolve();
			});
		});
	}
	_onOpen() {
		console.log('Open');
		let caps = ['tags', 'commands', 'membership']
				.map(n => `twitch.tv/${n}`).join(' '),
			ident = this.identity;
		
		this._sendRaw(`CAP REQ :${caps}`);
		if(ident.password) {
			this.ws.send(`PASS ${ident.password}`);
		}
		this._sendRaw(`NICK ${ident.username}`);
		this._sendRaw(`USER ${ident.username} 8 * :${ident.username}`);
	}
	_onClose(code, message) {
		console.log('Close', code, message);
		this.emit('close', code, message);
	}
	_onMessage(_data, flags) {
		return _data.split('\r\n')
		.filter(n => n)
		.map(n => {
			let data = ircMessage.parse(n),
				command = data.command,
				params = data.params,
				tags = utils.fixTags(data.tags),
				prefix = ircPrefixParser(data.prefix),
				raw = data.raw,
				interp = {
						channel: utils.channel(params[0])
					},
				args = [command, params, tags, prefix, raw, interp];
			data.tags = tags;
			data.prefix = prefix;
			this.emit('raw', ...args);
			this._handleMessage(...args);
			return data;
		});
	}
	_onError(error) {
		console.log('Error', error);
		this.emit('error', error);
	}
	
	_handleMessage(cmd = '', params = [], tags = {}, prefix = {}, raw = '') {
		let methodFunc = this._events.handlers[cmd];
		if(utils.shouldIgnoreCommand(cmd)) {
		}
		else if(_.isFunction(methodFunc)) {
			methodFunc(cmd, params, tags, prefix, raw);
		}
		else { // Not handled
			let cmdName = _.findKey(ircC, n => n === cmd) || cmd;
			this.emit('unknowncommand', cmdName, params, tags, prefix, raw);
			return false;
		}
		return true;
	}
	
	join(channel = '') {
		return Promise.resolve().then(() => {
			channel = utils.channel(channel);
		})
		.then(() => this._sendRaw(`JOIN ${channel}`));
	}
	part(channel = '') {
		return Promise.resolve().then(() => {
			channel = utils.channel(channel);
		})
		.then(() => this._sendRaw(`PART ${channel}`));
	}
	
	say(channel = '', message = '', asAction = false) {
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
	}
	action(channel, message) {
		return this.say(channel, message, true);
	}
	
	ban(channel = '', username = '', reason = '') {
		return Promise.resolve().then(() => {
			channel = utils.channel(channel);
			username = utils.username(username);
			if(!_.isUndefined(reason) && !utils.isNonEmptyString(reason)) {
				let error = 'Message is not string.';
				throw new Error(error);
			}
		})
		.then(() => this.say(channel, `/ban ${username} ${reason}`));
	}
	
	clear(channel = '') {
		return Promise.resolve().then(() => {
			channel = utils.channel(channel);
		})
		.then(() => this.say(channel, `/ban ${username} ${reason}`));
	}
}

module.exports = Client;
