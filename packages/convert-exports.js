const glob = require('glob')
const fs = require('fs')

var getDirectories = function (callback) {
  glob('./web/src/**/*', callback)
}

const DIRECTORY = 'utils'
const EXPORTS = [
  'creativeCommons',
  'dayjs',
  'Dayjs',
  'allSettled',
  'Permission',
  'isAccountCollection',
  'filterCollections',
  'filterDecimalString',
  'padDecimalValue',
  'decimalIntegerToHumanReadable',
  'decimalIntegerFromHumanReadable',
  'toErrorWithMessage',
  'getErrorMessage',
  'fillString',
  'formatCount',
  'formatCurrencyBalance',
  'formatBytes',
  'formatUrlName',
  'encodeUrlName',
  'formatShareText',
  'squashNewLines',
  'trimToAlphaNumeric',
  'pluralize',
  'formatAudio',
  'formatWeiToAudioString',
  'formatNumberCommas',
  'formatPrice',
  'trimRightZeros',
  'AUDIO_DIVISOR',
  'WEI_DIVISOR',
  'USDC_DIVISOR',
  'checkOnlyNumeric',
  'checkOnlyWeiFloat',
  'convertFloatToWei',
  'checkWeiNumber',
  'parseWeiNumber',
  'formatNumberString',
  'formatCapitalizeString',
  'formatMessageDate',
  'getHash',
  'Genre',
  'ELECTRONIC_PREFIX',
  'ELECTRONIC_SUBGENRES',
  'getCanonicalName',
  'GENRES',
  'convertGenreLabelToValue',
  'TRENDING_GENRES',
  'decodeHashId',
  'encodeHashId',
  'Timer',
  'makeReducer',
  'shallowCompare',
  'areSetsEqual',
  'createShallowSelector',
  'createDeepEqualSelector',
  'formatSeconds',
  'formatSecondsAsText',
  'formatLineupTileDuration',
  'formatDate',
  'formatDateWithTimezoneOffset',
  'utcToLocalTime',
  'getLocalTimezone',
  'wait',
  'removeNullable',
  'isNullOrUndefined',
  'externalAudiusLinks',
  'isAudiusUrl',
  'isInteralAudiusUrl',
  'isExternalAudiusUrl',
  'getPathFromAudiusUrl',
  'isCollectionUrl',
  'getPathFromPlaylistUrl',
  'isTrackUrl',
  'getPathFromTrackUrl',
  'Uid',
  'makeUids',
  'makeUid',
  'makeKindId',
  'getIdFromKindId',
  'getKindFromKindId',
  'uuid',
  'getAAOErrorEmojis',
  'zeroBNWei',
  'weiToAudioString',
  'weiToAudio',
  'audioToWei',
  'stringWeiToBN',
  'stringUSDCToBN',
  'stringAudioToBN',
  'stringWeiToAudioBN',
  'weiToString',
  'stringAudioToStringWei',
  'parseAudioInputToWei',
  'formatWei',
  'convertBigIntToAmountObject',
  'convertWAudioToWei',
  'convertWeiToWAudio',
  'BN_USDC_WEI',
  'BN_USDC_CENT_WEI',
  'ceilingBNUSDCToNearestCent',
  'floorBNUSDCToNearestCent',
  'formatUSDCWeiToUSDString',
  'formatUSDCWeiToCeilingDollarNumber',
  'formatUSDCWeiToCeilingCentsNumber',
  'formatUSDCWeiToFloorDollarNumber',
  'formatUSDCWeiToFloorCentsNumber',
  'shortenSPLAddress',
  'shortenEthAddress',
  'batchYield',
  'actionChannelDispatcher',
  'channelCanceller',
  'waitForValue',
  'doEvery',
  'waitForAccount',
  'waitForRead',
  'dataURLtoFile',
  'MAX_PROFILE_TOP_SUPPORTERS',
  'MAX_PROFILE_RELATED_ARTISTS',
  'MAX_PROFILE_SUPPORTING_TILES',
  'MAX_ARTIST_HOVER_TOP_SUPPORTING',
  'SUPPORTING_PAGINATION_SIZE',
  'MESSAGE_GROUP_THRESHOLD_MINUTES',
  'paramsToQueryString',
  'parseTrackRouteFromPermalink',
  'parsePlaylistIdFromPermalink',
  'parseIntList',
  'challengeRewardsConfig',
  'makeChallengeSortComparator',
  'makeOptimisticChallengeSortComparator',
  'isAudioMatchingChallenge',
  'isCooldownChallengeClaimable',
  'getClaimableChallengeSpecifiers',
  'interleave',
  'CHAT_BLOG_POST_URL',
  'hasTail',
  'isEarliestUnread',
  'chatCanFetchMoreMessages',
  'makeTwitterShareUrl',
  'generateUserSignature',
  'getQueryParams',
  'getTrackPreviewDuration',
  'getDogEarType',
  'ALLOWED_MAX_AUDIO_SIZE_BYTES',
  'ALLOWED_AUDIO_FILE_EXTENSIONS',
  'ALLOWED_AUDIO_FILE_MIME',
  'updatePlaylistArtwork',
  'externalLinkAllowList',
  'isAllowedExternalLink',
  'makeSolanaTransactionLink',
  'promiseWithTimeout',
  'parseHandleReservedStatusFromSocial',
  'EMAIL_REGEX',
  'isValidEmailString',
  'commonPasswordCheck',
  'isNotCommonPassword',
  'restrictedHandles',
  'ChallengeRewardsInfo',
  'License',
  'DecimalUtilOptions',
  'HandleCheckStatus',
  'Recording',
  'ActionsMap',
  'NestedNonNullable',
  'Nullable',
  'DeepNullable',
  'Overwrite',
  'Maybe',
  'Brand',
  'ValueOf',
  'Prettify'
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
