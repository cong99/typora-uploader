const appPaths = require('../app-paths')
const fs = require('fs')

// 添加打包输出目录到gitignore
function addToGitIgnore(path, annotation = '') {
	let exit = false
	const ignoreFilePath = appPaths.resolve.app('.gitignore')
	if (fs.existsSync(ignoreFilePath)) {
		const ignores = fs.readFileSync(ignoreFilePath, 'utf-8').split('\n')
		exit = ignores.some(line => {
			return line.trim() === path
		})
	}
	if (!exit) {
		annotation && fs.appendFileSync(ignoreFilePath, `\n${annotation}`)
		fs.appendFileSync(ignoreFilePath, `\n${path}\n`)
	}
}

module.exports.addToGitIgnore = addToGitIgnore
