// fixed
const fs = require('fs')
const { normalize, resolve, join, sep } = require('path')
const { CONFIG_NAME, ELECTRON_NAME, SRC_NAME, ELECTRON_SCRIPT_NAME } = require('./constant')

function getAppDir() {
	let dir = process.cwd()

	while (dir.length && dir[dir.length - 1] !== sep) {
		if (fs.existsSync(join(dir, CONFIG_NAME))) {
			return dir
		}

		dir = normalize(join(dir, '..'))
	}

	const { fatal } = require('./helpers/logger')

	fatal(`Error. This command must be executed inside a project folder with ${CONFIG_NAME}.\n`)
}

const appDir = getAppDir()
const cliDir = resolve(__dirname, '..')
const srcDir = resolve(appDir, SRC_NAME)
const electronDir = resolve(appDir, ELECTRON_NAME)
const electronScriptDir = resolve(appDir, ELECTRON_SCRIPT_NAME)
const configPath = resolve(appDir, CONFIG_NAME)

module.exports = {
	// 目录
	cliDir,
	appDir,
	srcDir,
	electronDir,
	electronScriptDir,
	configPath,

	// 目录方法
	resolve: {
		cli: dir => join(cliDir, dir),
		app: dir => join(appDir, dir),
		src: dir => join(srcDir, dir),
		electron: dir => join(electronDir, dir),
		electronScript: dir => join(electronScriptDir, dir)
	}
}
