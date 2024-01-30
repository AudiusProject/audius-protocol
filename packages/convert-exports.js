const glob = require('glob')
const fs = require('fs')

var getDirectories = function (callback) {
  glob('./web/src/**/*', callback)
}

const DIRECTORY = 'hooks'
const EXPORTS = [
  'useBooleanOnce',
  'FEATURE_FLAG_OVERRIDE_KEY',
  'useRecomputeToggle',
  'createUseFeatureFlagHook',
  'useFeatureFlag',
  'createUseRemoteVarHook',
  'useRemoteVar',
  'ButtonState',
  'ButtonType',
  'useCurrentStems',
  'useDownloadTrackButtons',
  'useImageSize',
  'useLoadImageWithTimeout',
  'useInstanceVar',
  'createUseLocalStorageHook',
  'createUseTikTokAuthHook',
  'useTwitterButtonStatus',
  'useUIAudio',
  'useSelectTierInfo',
  'useGetFirstOrTopSupporter',
  'useRankedSupportingForUser',
  'createProxySelectorHook',
  'useProxySelector',
  'useAccountHasClaimableRewards',
  'useGatedContentAccess',
  'useGatedContentAccessMap',
  'useStreamConditionsEntity',
  'useLockedContent',
  'useDownloadableContentAccess',
  'useLinkUnfurlMetadata',
  'useThrottledCallback',
  'useDebouncedCallback',
  'useAccountAlbums',
  'useAccountPlaylists',
  'useFetchedSavedCollections',
  'useCanSendMessage',
  'useSetInboxPermissions',
  'usePlayTrack',
  'usePauseTrack',
  'useToggleTrack',
  'useGeneratePlaylistArtwork',
  'useUSDCBalance',
  'useTotalBalanceWithFallback',
  'usePurchaseContentFormConfiguration',
  'useChallengeCooldownSchedule',
  'useAudioMatchingChallengeCooldownSchedule',
  'useUSDCPurchaseConfig',
  'usePurchaseContentErrorMessage',
  'usePayExtraPresets',
  'getExtraAmount',
  'isTrackPurchaseable',
  'PayExtraPreset',
  'CUSTOM_AMOUNT',
  'AMOUNT_PRESET',
  'PURCHASE_METHOD',
  'PURCHASE_VENDOR',
  'PAGE',
  'minimumPayExtraAmountCents',
  'maximumPayExtraAmountCents',
  'CENTS_TO_USDC_MULTIPLIER',
  'DEFAULT_PURCHASE_AMOUNT_CENTS',
  'PurchaseContentSchema',
  'useAccessAndRemixSettings',
  'useInterval',
  'useCreateUserbankIfNeeded',
  'usePurchaseMethod',
  'useCoinflowAdapter',
  'useIsWaitingForValidation'
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
          `(import\\s{[^}]* )(${exportName}( as [^,]*)*[, \\n])([^}]*}\\s*from '@audius/common')`
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
