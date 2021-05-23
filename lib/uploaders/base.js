const fs = require('fs')
const { warn } = require('../helpers/logger')

module.exports = class Uploader {
	constructor(name, options = {}) {
		this.name = name
		this.options = Object.assign(
			{
				url: new URL('https://doc.qmail.com/docs/p/imgUpload'),
				key: 'uploadfile',
				maxSize: 5 * 1024 * 1024 // 5MB
			},
			options
		)
	}

	get url() {
		return this.options.url
	}

	get host() {
		return this.url.host
	}

	get pathname() {
		return this.url.pathname
	}

	get origin() {
		return this.url.origin
	}

	async push(imagePath) {
		if (typeof imagePath === 'string') {
			// 上传单张
			return this._push(imagePath)
		} else if (Array.isArray(imagePath)) {
			// 上传多张
			return Promise.all(
				imagePath.map(item =>
					this._push(item).catch(err => {
						// 多张图片上传，部分图片上传失败不影响整体上传结果
						warn(err.message)
						return Promise.resolve('')
					})
				)
			)
		}
	}

	// 往服务器上传单张图片
	async _push(imagePath) {
		if (!fs.existsSync(imagePath)) {
			throw new Error(`image ${imagePath} not exists`)
		}

		let stats = fs.statSync(imagePath)
		stats = {
			...stats,
			path: imagePath
		}
		// 校验
		this.validate(stats)

		// 转码
		const readStream = this.transform(stats, fs.createReadStream(imagePath))

		// 上传
		return this.upload(stats, readStream)
	}

	// 实际上传图片请求
	upload(stats, stream) {
		// 返回图片线上地址
		return ''
	}

	// 图片转格式、可能还有之后的其他功能，截取、打码
	transform(stats, stream) {
		return stream
	}

	// 校验图片
	validate(stats) {
		const { size, path } = stats
		const { maxSize } = this.options
		if (size > maxSize || size <= 0) {
			throw new Error(`image "${path}" over ${Math.floor(maxSize / 1024)}KB`)
		}
	}
}
