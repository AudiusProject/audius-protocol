import {
  transformAndCleanList,
  userCollectionMetadataFromSDK
} from '@audius/common/adapters'
import { Collection } from '@audius/common/models'
import { StringKeys } from '@audius/common/services'
import {
  accountSelectors,
  trendingPlaylistsPageLineupSelectors,
  trendingPlaylistsPageLineupActions,
  getContext,
  getSDK
} from '@audius/common/store'
import { OptionalId } from '@audius/sdk'
import { keccak_256 } from 'js-sha3'
import { call, select } from 'typed-redux-saga'

import { processAndCacheCollections } from 'common/store/cache/collections/utils'
import { LineupSagas } from 'common/store/lineup/sagas'
import { waitForRead } from 'utils/sagaHelpers'
const { getLineup } = trendingPlaylistsPageLineupSelectors
const getUserId = accountSelectors.getUserId

let numberOfFilteredPlaylists = 0

function* getPlaylists({ limit, offset }: { limit: number; offset: number }) {
  yield* waitForRead()
  const sdk = yield* getSDK()
  const remoteConfigInstance = yield* getContext('remoteConfigInstance')

  yield* call(remoteConfigInstance.waitForRemoteConfig)

  const TF = new Set(
    remoteConfigInstance.getRemoteVar(StringKeys.TPF)?.split(',') ?? []
  )

  const time = 'week' as const

  const currentUserId = yield* select(getUserId)

  // Temporary fix:
  // For some reason, limit is 3 and we are not getting enough playlists back,
  // maybe due to some bug in the lineup.
  // Setting the limit to 10 so we at least get enough playlists back from first fetch for now.
  const TMP_LIMIT = 10

  const version = remoteConfigInstance.getRemoteVar(
    StringKeys.PLAYLIST_TRENDING_EXPERIMENT
  )

  const args = {
    userId: OptionalId.parse(currentUserId),
    limit: TMP_LIMIT,
    offset: offset + numberOfFilteredPlaylists,
    time
  }

  const { data = [] } = version
    ? yield* call(
        [
          sdk.full.playlists,
          sdk.full.playlists.getTrendingPlaylistsWithVersion
        ],
        { ...args, version }
      )
    : yield* call(
        [sdk.full.playlists, sdk.full.playlists.getTrendingPlaylists],
        args
      )

  let playlists = transformAndCleanList(data, userCollectionMetadataFromSDK)

  if (TF.size > 0) {
    playlists = playlists.filter((p) => {
      const shaId = keccak_256(p.playlist_id.toString())
      return !TF.has(shaId)
    })
  }

  // Omit playlists owned by Audius
  const userIdsToOmit = new Set(
    (
      remoteConfigInstance.getRemoteVar(
        StringKeys.TRENDING_PLAYLIST_OMITTED_USER_IDS
      ) || ''
    ).split(',')
  )
  const trendingPlaylists = playlists.filter(
    (playlist) => !userIdsToOmit.has(`${playlist.playlist_owner_id}`)
  )
  numberOfFilteredPlaylists += playlists.length - trendingPlaylists.length

  const processed = yield* processAndCacheCollections(trendingPlaylists, false)

  return processed
}

class TrendingPlaylistSagas extends LineupSagas<Collection> {
  constructor() {
    super(
      trendingPlaylistsPageLineupActions.prefix,
      trendingPlaylistsPageLineupActions,
      getLineup,
      getPlaylists,
      undefined,
      undefined,
      undefined
    )
  }
}

const sagas = () => new TrendingPlaylistSagas().getSagas()
export default sagas
