const glob = require('glob')
const fs = require('fs')

var getDirectories = function (callback) {
  glob('./common/dist/utils/**/*', callback)
}

getDirectories(async function (err, res) {
  let exports = []
  res
    .filter((path) => path.match(/\/[^\/]+\.(d.ts)$/))
    .forEach((path) => {
      const content = fs.readFileSync(path, { encoding: 'utf8', flag: 'r' })

      let regex = new RegExp('export (type|interface) ([^ ]+)', 'gm')

      let match
      while ((match = regex.exec(content)) !== null) {
        const exportName = match[2]
        exports.push(exportName)
      }
    })

  console.dir(exports, { maxArrayLength: null })
})
