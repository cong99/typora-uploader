/* eslint-disable */
const fs = require('fs')
const FormData = require('form-data')
const http = require('http')


const ORIGIN = 'https://doc.qmail.com'
const HOST = 'doc.qmail.com'
const PATH = '/docs/p/imgUpload'
const KEY = 'uploadfile'
const IMG_MAX = 5 * 1024 * 1024
const matchReg = /(https:|http:)\/\/wework.qpic.cn.*?\}/gi


function upload(imgPath) {
  var form = new FormData()
  form.append(KEY, fs.createReadStream(imgPath))
  var headers = form.getHeaders()
  headers.Origin = ORIGIN
  var fileSize = 0
  if (fileSize > IMG_MAX) {
    return Promise.reject(new Error('size over ' + IMG_MAX + ' KB'))
  } else {
    return new Promise((resolve, reject) => {
      var request = http.request({
        method: 'post',
        host: HOST,
        path: PATH,
        headers: headers
      }, function(res) {
        var str = ''
        res.on('data', function(buffer) {
          str += buffer
        })
        res.on('end', function() {
          var matchList = str.match(matchReg)
          if (matchList) {
            var imgUrl = matchList[0] || ''
            if (imgUrl) {
              imgUrl = imgUrl.substring(0, imgUrl.length - 2)
            }
            resolve({
              url: imgUrl
            })
          } else {
            reject(new Error('imgae type error'))
          }
        })
      })
      form.pipe(request)
    })
  }
}

module.exports = upload