const glob = require('glob')
const fs = require('fs')

var getDirectories = function (callback) {
  glob('./web/src/**/*', callback)
}

const DIRECTORY = 'utils'
const EXPORTS = [
  'newTrackMetadata',
  'newCollectionMetadata',
  'newUserMetadata',
  'createRemixOfMetadata',
  'emailSchemaMessages',
  'emailSchema',
  'passwordSchema',
  'pickHandleErrorMessages',
  'pickHandleSchema',
  'finishProfileSchema',
  'selectableGenres',
  'selectGenresSchema',
  'createLoginDetailsSchema',
  'selectArtistsSchema',
  'messages',
  'signInSchema',
  'signInErrorMessages',
  'confirmEmailSchema',
  'formatOtp',
  'confirmEmailErrorMessages'
]

getDirectories(async function (err, res) {
  res
    .filter((path) => path.match(/\/[^\/]+\.(ts|tsx|js|jsx)$/))
    .forEach((path) => {
      const content = fs.readFileSync(path, { encoding: 'utf8', flag: 'r' })

      let matches = []
      let newContent = content
      EXPORTS.forEach((exportName) => {
        let regex = new RegExp(
          `(import[^{]*{[^}]* )(${exportName}( as [^,]*)*[, \\n])([^}]*}\\s*from '@audius/common')`
        )

        let match = content.match(regex)?.[2]

        if (match) {
          matches.push(exportName)

          // Delete old import
          newContent = newContent.replace(regex, '$1$4')
        }
      })

      // Add new imports
      if (matches.length) {
        console.log('matches', matches)
        const matchesList = matches.join(', ')
        newContent = `import { ${matchesList} } from '@audius/common/${DIRECTORY}'
     ${newContent}`

        fs.writeFileSync(path, newContent)
      }
    })
})
