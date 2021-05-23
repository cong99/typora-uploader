// fixed
const appPaths = require('../app-paths')

function getMajorVersion (version) {
  const matches = version.match(/^(\d)\./)
  return parseInt(matches[1], 10)
}

module.exports = function (pkgName, folder = appPaths.appDir) {
  try {
    const pkg = require(
      require.resolve(`${pkgName}/package.json`, {
        paths: [ folder ]
      })
    )

    return getMajorVersion(pkg.version)
  }
  catch (e) {}
}
