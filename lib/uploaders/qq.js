const Uploader = require('./base')
const FormData = require('form-data')
const http = require('http')

const regExp = /((https|http):\/\/wework.qpic.cn.*?)("\})/i

module.exports = class QQUploader extends Uploader {
	constructor(options = {}) {
		super(
			'qq',
			Object.assign(
				{
					url: new URL('https://doc.qmail.com/docs/p/imgUpload'),
					key: 'uploadfile',
					maxSize: 5 * 1024 * 1024 // 5MB
				},
				options
			)
		)
	}

	// 实际上传图片请求
	upload(stats, stream) {
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
}
