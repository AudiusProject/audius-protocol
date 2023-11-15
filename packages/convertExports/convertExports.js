const glob = require('glob')
const fs = require('fs')

var getDirectories = function (src, callback) {
  glob(src + '/**/*', callback)
}

let result = ''
const sourcePath = '../common/src/store'
const resultPath = './store'

getDirectories(sourcePath, async function (err, res) {
  const camel = (await import('camelcase')).default
  res
    .filter((path) => path.match(/\/[^\/]+\.ts$/))
    .filter((path) => !path.match(/\/index\.ts$/))
    .forEach((path) => {
      const content = fs.readFileSync(path, { encoding: 'utf8', flag: 'r' })

      let regex = /export( \w+ )(\w+)[ (]/gm

      let matches = []
      let match = regex.exec(content)
      while (match != null) {
        matches.push(match[2])
        match = regex.exec(content)
      }
      const exports = matches.join(', ')

      //   result += `export { ${exports} } from '${path
      //     .replace(sourcePath, resultPath)
      //     .replace('.ts', '')}'\n`

      const slice = camel(path.match(/\/([^\/]+)\/[^\/]+.ts$/)[1])
      const cleanPath = path.replace(sourcePath, resultPath).replace('.ts', '')

      if (path.match(/\/slice\.ts$/)) {
        result += `export { default as ${slice}Reducer, actions as ${slice}Actions } from '${cleanPath}'\n`
      } else if (path.match(/\/selectors.ts$/)) {
        result += `import * as ${slice}SelectorsImport from '${cleanPath}'\n`

        result += `export const ${slice}Selectors = ${slice}SelectorsImport\n`
      } else if (path.match(/\/sagas\.ts$/)) {
        result += `export { default as ${slice}Sagas } from '${cleanPath}'\n`
      } else if (path.match(/\/actions\.ts$/)) {
        result += `import * as ${slice}ActionsImport from '${cleanPath}'\n`

        result += `export const ${slice}Actions = ${slice}ActionsImport \n`
      } else {
        result += `export { ${exports} } from '${cleanPath}'\n`
      }
    })

  console.log(result)
})
