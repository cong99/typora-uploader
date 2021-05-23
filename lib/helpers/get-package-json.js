// fixed
const appPaths = require('../app-paths')

module.exports = function (pkgName, folder = appPaths.appDir) {
  try {
    return require(
      require.resolve(`${pkgName}/package.json`, {
        paths: [ folder ]
      })
    )
  }
  catch (e) {}
}
