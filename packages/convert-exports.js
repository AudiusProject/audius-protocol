const glob = require('glob')
const fs = require('fs')

var getDirectories = function (callback) {
  glob('./web/src/**/*', callback)
}

const DIRECTORY = 'schemas'
const EXPORTS = [
  'IntKeys',
  'StringKeys',
  'DoubleKeys',
  'BooleanKeys',
  'FeatureFlags',
  'remoteConfig',
  'remoteConfigIntDefaults',
  'remoteConfigDoubleDefaults',
  'remoteConfigBooleanDefaults',
  'RandomImage',
  'responseAdapter',
  'AudiusAPIClient',
  'isApiActivityV2',
  'isApiActivityV1',
  'AuthHeaders',
  'BackendUtils',
  'audiusBackend',
  'ClientRewardsReporter',
  'getEagerDiscprov',
  'makeEagerRequest',
  'recordIP',
  'MEMO_PROGRAM_ID',
  'DEFAULT_MINT',
  'getRootSolanaAccount',
  'getSolanaConnection',
  'getRecentBlockhash',
  'getTokenAccountInfo',
  'deriveUserBankPubkey',
  'deriveUserBankAddress',
  'getUserbankAccountInfo',
  'createUserBankIfNeeded',
  'pollForTokenBalanceChange',
  'pollForBalanceChange',
  'purchaseContent',
  'purchaseContentWithPaymentRouter',
  'findAssociatedTokenAddress',
  'createRootWalletRecoveryTransaction',
  'createTransferToUserBankTransaction',
  'createPaymentRouterRouteTransaction',
  'relayTransaction',
  'relayVersionedTransaction',
  'getLookupTableAccounts',
  'createVersionedTransaction',
  'FingerprintClient',
  'LocalStorage',
  'MIN_TRANSFERRABLE_WEI',
  'WalletClient',
  'Explore',
  'AudioError',
  'isAssetValid',
  'assetToCollectible',
  'creationEventToCollectible',
  'transferEventToCollectible',
  'isNotFromNullAddress',
  'OpenSeaClient',
  'SolanaClient',
  'TrackDownload',
  'MAX_HANDLE_LENGTH',
  'MAX_DISPLAY_NAME_LENGTH',
  'formatTwitterProfile',
  'formatInstagramProfile',
  'formatTikTokProfile',
  'getLocation',
  'getCityAndRegion',
  'DiscoveryNodeSelectorService',
  'makeGetStorageNodeSelector',
  'AudioInfo',
  'AudioPlayer',
  'QueryParams',
  'AssociatedWalletsResponse',
  'GetSocialFeedArgs',
  'GetSupportingArgs',
  'GetSupportersArgs',
  'GetTipsArgs',
  'GetNFTGatedTrackSignaturesArgs',
  'OpaqueID',
  'APIUser',
  'APISearchUser',
  'APIRepost',
  'APIFavorite',
  'APIRemix',
  'APITrack',
  'APISearchTrack',
  'APIStem',
  'APIPlaylistAddedTimestamp',
  'APIPlaylist',
  'APISearchPlaylist',
  'APIItemType',
  'APIActivity',
  'APIActivityV2',
  'APISearch',
  'APISearchAutocomplete',
  'APIBlockConfirmation',
  'APIResponse<T>',
  'SupportingResponse',
  'SupporterResponse',
  'GetTipsResponse',
  'GetNFTGatedTrackSignaturesResponse',
  'PhantomProvider',
  'AudiusBackend',
  'MintName',
  'PurchaseContentArgs',
  'PurchaseContentWithPaymentRouterArgs',
  'CreateStripeSessionArgs',
  'ServiceMonitoring',
  'MonitoringCallbacks',
  'Environment',
  'Env',
  'CachedDiscoveryProviderType',
  'Location',
  'TikTokProfileData',
  'RemoteConfigOptions<Client>',
  'RemoteConfigInstance',
  'AllRemoteConfigKeys',
  'MetaplexNFTPropertiesFile',
  'MetaplexNFT',
  'StarAtlasNFT',
  'SolanaNFT',
  'TrackDownloadConfig'
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
