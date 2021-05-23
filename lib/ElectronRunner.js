// fixed
const { log, warn, fatal } = require('./helpers/logger')
const { spawn } = require('./helpers/spawn')
const appPaths = require('./app-paths')
const getPackage = require('./helpers/get-package')
const chokidar = require('chokidar')
const { debounce } = require('lodash')
const fs = require('fs-extra')
const { ELECTRON_MAIN_NAME } = require('./constant')

class ElectronRunner {
	constructor(cfg = {}) {
		this.pid = 0
		this.mainWatcher = null
		this.cfg = cfg
		this.calls = {}
	}

	init() {}

	// 简易事件监听
	on(event, call) {
		this.calls[event] = call
	}

	async run() {
		if (this.pid) {
			return
		}

		log(`Building main & preload Electron processes...`)

		return new Promise(resolve => {
			this.mainWatcher = chokidar.watch(appPaths.electronDir).on(
				'all',
				debounce(async () => {
					log(`Load Electron processes...`)
					await this.__stopElectron()
					this.__startElectron()
					resolve() // resolve只会起一次效果
				}, 500)
			)
		})
	}

	stop() {
		return new Promise(async resolve => {
			if (this.mainWatcher) {
				await this.mainWatcher.close()
			}
			await this.__stopElectron()
			resolve()
		})
	}

	__startElectron(extraParams = []) {
		log(`Booting up Electron process...`)
		this.pid = spawn(
			getPackage('electron'),
			['--inspect=5858', appPaths.resolve.electron(ELECTRON_MAIN_NAME)].concat(extraParams),
			{ cwd: appPaths.appDir },
			async code => {
				if (this.killPromise) {
					// 开发中，重新加载electron
					this.killPromise()
					this.killPromise = null
				} else if (code) {
					await this._beforeExit()
					fatal(`Electron process ended with error code: ${code}\n`)
				} else {
					// else it wasn't killed by us
					await this._beforeExit()
					warn('Electron process was killed. Exiting...\n')
					process.exit()
				}
			}
		)
	}

	__stopElectron() {
		const pid = this.pid

		if (!pid) {
			return Promise.resolve()
		}

		log('Shutting down Electron process...')
		this.pid = 0
		return new Promise(resolve => {
			this.killPromise = resolve
			process.kill(pid)
		})
	}

	_beforeExit() {
		if (this.calls.exit) {
			return this.calls.exit()
		}
	}

	async build() {
		// 项目package
		const pkg = require(appPaths.resolve.app('package.json'))
		// 删除原本输出目录
		const outDir = appPaths.resolve.app(this.cfg.build.outDir)
		fs.removeSync(outDir)
		log(`Remove ${outDir}...`)

		// 打包
		// const bundlerName = this.cfg.bundler
		const bundlerName = 'builder'
		const bundlerConfig = this.cfg[bundlerName]
		// appId纠正
		bundlerConfig.appId = bundlerConfig.appId || pkg.name
		// 目录配置
		bundlerConfig.directories = {
			buildResources: appPaths.electronDir,
			app: appPaths.resolve.app(this.cfg.build.inDir),
			output: appPaths.resolve.app(this.cfg.build.outDir)
		}

		const bundler = require('./bundler').getBundler(bundlerName)
		const pkgName = `electron-${bundlerName}`

		return new Promise((resolve, reject) => {
			log(`Bundling app with electron-${bundlerName}...`)
			log()

			const bundlePromise = bundler.build({ config: bundlerConfig })

			bundlePromise
				.then(() => {
					log()
					log(`[SUCCESS] ${pkgName} built the app`)
					log()
					resolve()
				})
				.catch(err => {
					log()
					warn(`[FAIL] ${pkgName} could not build`)
					log()
					console.error(err + '\n')
					reject()
				})
		})
	}
}

module.exports = ElectronRunner
