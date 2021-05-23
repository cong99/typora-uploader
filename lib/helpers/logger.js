const { green, red } = require('chalk')
const pkg = require('../../package.json')

const logBanner = green(pkg.name)
const warnBanner = red(pkg.name)

module.exports.log = function (msg) {
	console.log(msg ? ` ${logBanner} ${msg}` : '')
}

module.exports.warn = function (msg) {
	console.warn(msg ? ` ${warnBanner} ⚠️  ${msg}` : '')
}

module.exports.fatal = function (msg) {
	console.error(msg ? ` ${warnBanner} ⚠️  ${msg}` : '')
	process.exit(1)
}
