const Uploader = require('./uploader')

module.exports = class QQUploader extends Uploader {
	constructor(options = {}) {
		super(
			'qq',
			Object.assign(
				{
					url: new URL('https://doc.qmail.com/docs/p/imgUpload'),
					key: 'uploadfile',
					maxSize: 5 * 1024 * 1024, // 5MB
					ext: /(png|gif|jpg|jpeg)$/,
					convert: {
						type: 'png', // 没什么用，qq文档还是会将png转成jpg，透明还是会变成全黑
						options: {}
					}
				},
				options
			)
		)
	}
}
