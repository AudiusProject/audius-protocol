const glob = require('glob')
const fs = require('fs')

var getDirectories = function (callback) {
  glob('./common/src/**/*', callback)
}

getDirectories(async function (err, res) {
  res
    .filter((path) => path.match(/\/[^\/]+\.(ts|tsx|js|jsx)$/))
    .forEach((path) => {
      const content = fs.readFileSync(path, { encoding: 'utf8', flag: 'r' })

      let regex = new RegExp(
        `(from ')(audius-query|assets|hooks|models|schemas|services|store|utils)([^']*')`,
        'gm'
      )

      let newContent = content.replace(regex, (...args) => {
        return `${args[1]}~/${args[2]}${args[3]}`
      })

      fs.writeFileSync(path, newContent)
    })
})
