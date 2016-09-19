const _ = require('lodash'),
	
	ircC = require('../data/irc_commands.json'),
	
	keyToCamelCase = _.rearg(_.camelCase, 1),
	isNonEmptyString = _.overEvery([_.isString, n => !_.isEmpty(n)]),
	
	actionMessageRegex = /^\u0001ACTION ([^\u0001]+)\u0001$/,
	ignoredCommands = ['WELCOME','YOURHOST','CREATED','MYINFO','NAMREPLY',
		'ENDOFNAMES','MOTDSTART','ENDOFMOTD'].map(n => ircC[`IRC_${n}`])
		.concat(['CAP'].map(n => ircC[`TMI_${n}`]));

function fixTags(tags) {
	if(!_.isObject(tags)) {
		let error = 'Cannot fix tags of non-object.';
		throw new TypeError(error);
	}
	tags = _.mapKeys(tags, keyToCamelCase);
	return _.mapValues(tags, (n, k) => {
		let methods = {
					badges: parseBadges,
					emotes: parseEmotes
				},
			methodFunc = methods[k];
		if(_.isFunction(methodFunc)) {
			return methodFunc(n);
		}
		else if(n === '0') {
			return false;
		}
		else if(n === '1') {
			return true;
		}
		return n;
	});
}

function parseActionMessage(str) {
	if(!_.isString(str)) {
		return '';
	}
	let match = str.match(actionMessageRegex);
	return _.isNull(match) ? false : match[1];
}

function parseBadges(str) {
	if(!_.isString(str)) {
		return {};
	}
	str = str.split(',')
		.map(m => {
			m = m.split('/');
			m[1] = tryInteger(m[1]);
			return m;
		});
	return _.fromPairs(str);
}

function parseEmotes(str) {
	if(!_.isString(str)) {
		return [];
	}
	return str.split('/')
	.map(n => {
		let [id, indices] = n.split(':');
		indices = indices.split(',')
			.map(n => n.split('-').map(_.toInteger))
			.map(i => ({
					0: i[0], 1: i[1],
					in: i[0], out: i[1]
				}));
		return { id, indices };
	});
}

function tryInteger(val) {
	if(_.isNumber(val)) {
		return _.toInteger(val);
	}
	else if(!isNonEmptyString(val) || /[^\d\.\-]/g.test(val)) {
		return val;
	}
	let num = _.parseInt(val);
	return _.isNaN(num) ? val : num;
}

function username(str) {
	if(!isNonEmptyString(str)) {
		let error = 'Nothing to normalize.';
		throw new TypeError(error);
	}
	return str.replace(/\W+/g, '')
	.replace(/^_+/, '')
	.toLowerCase()
	.slice(0, 25);
}

module.exports = {
	channel: str => `#${username(str)}`,
	fixTags,
	genJustinFan: () => `justinfan${~~((Math.random() * 80000) + 1000)}`,
	keyToCamelCase,
	isNonEmptyString,
	parseActionMessage,
	parseBadges,
	parseEmotes,
	shouldIgnoreCommand: _.partial(_.includes, ignoredCommands),
	tryInteger,
	username
};
