const { spawnSync } = require('./spawn')
const appPaths = require('../app-paths')
const { log, warn } = require('./logger')
const nodePackager = require('./node-packager')

// 安装包
function installPackage(package, { dev, packager } = {}) {
	packager = packager || nodePackager
	let cmdParam = packager === 'npm' ? ['install', '--save'] : ['add']
	if (dev) {
		cmdParam = packager === 'npm' ? ['install', '--save-dev'] : ['add', '--dev']
	}

	log(`Installing required ${package}...`)
	spawnSync(
		packager,
		cmdParam.concat([package]),
		{ cwd: appPaths.appDir, env: { ...process.env, NODE_ENV: 'development' } },
		() => warn(`Failed to install ${package}`)
	)
}

module.exports.installPackage = installPackage
