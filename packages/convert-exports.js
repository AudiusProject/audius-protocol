const glob = require('glob')
const fs = require('fs')

var getDirectories = function (callback) {
  glob('./web/src/**/*', callback)
}

const DIRECTORY = 'api'
const EXPORTS = [
  'useGetRelatedArtists',
  'relatedArtistsApiReducer',
  'useGetTrackById',
  'useGetTrackByPermalink',
  'useGetTracksByIds',
  'useGetUserTracksByHandle',
  'trackApiFetch',
  'trackApiReducer',
  'useGetPlaylistByPermalink',
  'useGetPlaylistById',
  'collectionApiReducer',
  'useGetUserById',
  'useGetUsersByIds',
  'useGetUserByHandle',
  'useGetTracksByUser',
  'useGetUSDCTransactions',
  'useGetUSDCTransactionsCount',
  'userApiReducer',
  'userApiFetch',
  'userApiActions',
  'DEVELOPER_APP_DESCRIPTION_MAX_LENGTH',
  'DEVELOPER_APP_NAME_MAX_LENGTH',
  'developerAppSchema',
  'useGetDeveloperApps',
  'useAddDeveloperApp',
  'useDeleteDeveloperApp',
  'developerAppsApiReducer',
  'useGetSuggestedAlbumTracks',
  'useGetSuggestedPlaylistTracks',
  'useGetTrending',
  'trendingApiReducer',
  'libraryApi',
  'useGetLibraryAlbums',
  'useGetLibraryPlaylists',
  'libraryApiReducer',
  'useGetPurchases',
  'useGetPurchasesCount',
  'useGetSales',
  'useGetSalesCount',
  'purchasesApiReducer',
  'purchasesApiActions',
  'HashId',
  'Id',
  'useGetTopArtistsInGenre',
  'useGetFeaturedArtists',
  'topArtistsApiReducer',
  'useGetCurrentUserId',
  'useResetPassword',
  'accountApiReducer',
  'useIsEmailInUse',
  'signUpReducer',
  'signUpFetch',
  'DeveloperApp',
  'SuggestedTrack'
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
