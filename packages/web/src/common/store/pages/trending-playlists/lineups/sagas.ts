import {
  accountSelectors,
  trendingPlaylistsPageLineupSelectors,
  trendingPlaylistsPageLineupActions,
  getContext
} from '@audius/common/store'
import {} from '@audius/common'
import { UserCollectionMetadata } from '@audius/common/models'
import { StringKeys } from '@audius/common/services'
import { keccak_256 } from 'js-sha3'
import { call, select } from 'typed-redux-saga'

import { processAndCacheCollections } from 'common/store/cache/collections/utils'
import { LineupSagas } from 'common/store/lineup/sagas'
import { waitForRead } from 'utils/sagaHelpers'
const { getLineup } = trendingPlaylistsPageLineupSelectors
const getUserId = accountSelectors.getUserId

function* getPlaylists({ limit, offset }: { limit: number; offset: number }) {
  yield* waitForRead()
  const apiClient = yield* getContext('apiClient')
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
  let playlists: UserCollectionMetadata[] = yield* call(
    (args) => apiClient.getTrendingPlaylists(args),
    {
      currentUserId,
      limit: TMP_LIMIT,
      offset,
      time
    }
  )

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

  const processed = yield* processAndCacheCollections(trendingPlaylists, false)

  return processed
}

class TrendingPlaylistSagas extends LineupSagas {
  constructor() {
    super(
      trendingPlaylistsPageLineupActions.prefix,
      trendingPlaylistsPageLineupActions,
      getLineup,
      getPlaylists
    )
  }
}

const sagas = () => new TrendingPlaylistSagas().getSagas()
export default sagas
