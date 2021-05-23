const ElectronRunner = require('./ElectronRunner')
const appPaths = require('./app-paths')
const { spawn } = require('./helpers/spawn')
const { merge, cloneDeep, omit, pick } = require('lodash')
const { log, warn } = require('./helpers/logger')
const fs = require('fs-extra')

const { CONFIG_NAME, ELECTRON_NAME, ELECTRON_MAIN_NAME } = require('./constant')
const pkg = require(appPaths.resolve.app('package.json'))

// 常量
const MODE = {
	BUILD: 'build',
	RUN: 'run'
}

// 解析运行参数
function normalizeParams() {
	const arguments = process.argv.splice(2)
	return {
		mode: arguments[0] === MODE.BUILD ? MODE.BUILD : MODE.RUN
	}
}

// 解析配置
function normalizeConfig() {
	const config = require(appPaths.configPath)
	return merge(
		{
			scripts: {
				serve: 'dev', // 开发环境服务器
				build: 'build' // 打包
			},
			server: {
				host: 'localhost', // 默认localhost
				port: 3000, // 前端运行端口
				useInProd: false // 生产环境随机获取端口
			},
			builder: {
				appId: pkg.name || 'easy-electron'
			}
		},
		config
	)
}

// 拷贝需要的文件到dist
function copyToDist(dist, dependencies = []) {
	const ePkg = omit(cloneDeep(pkg), ['scripts'])
	// 添加main主入口
	ePkg.main = `./${ELECTRON_NAME}/${ELECTRON_MAIN_NAME}`
	// 过滤dependencies
	ePkg.dependencies = pick(ePkg.dependencies, dependencies)
	// 删除掉devDependencies
	delete ePkg.devDependencies
	// 写出package.json
	fs.writeFileSync(appPaths.resolve.app(`${dist}/package.json`), JSON.stringify(ePkg, null, 2))
	// 拷贝electron background源码模板
	fs.copySync(appPaths.electronDir, appPaths.resolve.app(`${dist}/${ELECTRON_NAME}`))
	// 拷贝easy-electron配置文件
	fs.copySync(appPaths.configPath, appPaths.resolve.app(`${dist}/${CONFIG_NAME}`))
	log(`[SUCCESS] copy file to dist`)
}

// 主入口
async function main() {
	const cfg = normalizeConfig()
	const { mode } = normalizeParams()
	const { scripts, build, dependencies } = cfg

	const electronRunner = new ElectronRunner(cfg)

	if (mode === MODE.RUN) {
		// 运行前端
		const webPid = spawn(`npm run ${scripts.serve}`, [], { cwd: appPaths.appDir }, code => {
			warn(`Web process ended with code: ${code}\n`)
		})
		electronRunner.on('exit', async () => {
			log(`Shutting down Web process...`)
			warn(`目前无法完全退出npm run dev进程，请手动"Crtl + X"退出`)
			warn(`At present, NPM run dev process cannot be completely exited. Please manually "crtl + X" exit`)
			process.kill(webPid)
		})
		// 启动electron
		electronRunner.run()
	} else if (mode === MODE.BUILD) {
		// 前端打包
		await new Promise(resolve => {
			spawn(`npm run ${scripts.build}`, [], { cwd: appPaths.appDir }, () => {
				log(`[SUCCESS] web built the app`)
				resolve()
			})
		})
		// 拷贝文件
		copyToDist(build.inDir, dependencies)
		// electron打包
		electronRunner.build()
	}
}

main()
