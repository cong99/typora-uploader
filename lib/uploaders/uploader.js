const fs = require('fs')
const path = require('path')
const request = require('request')
const sharp = require('sharp')
const FormData = require('form-data')
const http = require('http')
const { warn } = require('../helpers/logger')

const regExp = /((https|http):\/\/wework.qpic.cn.*?)("\})/i

module.exports = class Uploader {
	constructor(name, options = {}) {
		this.name = name
		this.options = Object.assign(
			{
				url: new URL('http://image2upload.url'), // 这个地址并不存在，占位而已
				key: 'uploadfile',
				maxSize: 5 * 1024 * 1024, // 5MB
				ext: /.*/,
				convert: false // 图片转换
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
		// 网络图片，需要将图片先下载下来
		let inputStream,
			stats = { path: imagePath, temp: path.join(__dirname, Math.random().toString(36) + '.jpg') }
		if (/^(http|https)\:/.test(imagePath)) {
			// 网络图片下载本身就是个流，没必要写到硬盘上，直接推送到图床上；所以网络图片不做校验，由图床（上传）去做校验
			// 但是无法判断这个流的到底有多大（也可以自己计算大小拦截，但是没必要，目标图床如果承受不了上传就自动失败了）
			stats = { ext: path.extname(new URL(imagePath).pathname), ...stats }
			inputStream = request(imagePath)
		} else {
			// imagePath = path.resolve(iamPath)
			// 本地文件
			if (!fs.existsSync(imagePath)) {
				throw new Error(`image ${imagePath} not exists`)
			}
			// 图片信息
			stats = { ext: path.extname(imagePath), ...stats, ...fs.statSync(imagePath) }

			// 校验
			this.validate(stats)

			inputStream = fs.createReadStream(imagePath)
		}

		try {
			// 转码
			const outputStream = await this.transform(inputStream, stats)
			// 上传
			return await this.upload(outputStream, stats)
		} finally {
			// 处理临时文件
			if (fs.existsSync(stats.temp)) {
				fs.unlinkSync(stats.temp)
			}
		}
	}

	// 上传图片请求
	upload(stream, stats) {
		// 创建上传表单
		const form = new FormData()
		form.append(this.options.key, stream)
		// 请求头部信息
		const headers = form.getHeaders()
		headers.Origin = this.origin

		// 请求及后处理
		return new Promise((resolve, reject) => {
			const request = http.request(
				{
					method: 'post',
					host: this.host,
					path: this.pathname,
					headers: headers
				},
				function (res) {
					let str = ''
					res.on('data', function (buffer) {
						str += buffer
					})
					res.on('end', function () {
						const match = regExp.exec(str)
						if (match && match[1]) {
							resolve(match[1])
						} else {
							reject(new Error('imgae upload error'))
						}
					})
				}
			)
			form.pipe(request)
		})
	}

	// 图片转格式、可能还有之后的其他功能，截取、打码
	async transform(inputStream, stats) {
		const { ext, temp } = stats
		const { convert, ext: extRegexp } = this.options
		if (!convert || extRegexp.test(ext)) {
			// 不用转换 或者 转换，但是本身就符合上传的格式了，直接返回原本的流
			return inputStream
		} else {
			// 为什么写成这个样子，不直接流接流？
			// form-data问题: Buffer类型上传会失败，必须用stream，而且是fs.ReadStream类型，stream.Readable也会报错
			return new Promise((resolve, reject) => {
				// 图片转换使用的是sharp(https://www.npmjs.com/package/sharp)
				const { type = 'png', options = {} } = convert
				const tempStream = inputStream.pipe(sharp()[type](options)).pipe(fs.createWriteStream(temp))
				tempStream.on('finish', () => {
					resolve(fs.createReadStream(temp))
				})
				tempStream.on('error', err => {
					reject(err)
				})
			})
		}
	}

	// 校验图片
	validate(stats) {
		const { size, path, ext } = stats
		const { convert, ext: extRegexp, maxSize } = this.options
		// 验证后缀
		if (!convert && !extRegexp.test(ext)) {
			throw new Error(`image "${path}" ext not match expected, ${extRegexp.toString()} required`)
		}
		// 文件大小验证
		if (size && size > maxSize) {
			throw new Error(`image "${path}" over ${Math.floor(maxSize / 1024)}KB`)
		}
	}
}
