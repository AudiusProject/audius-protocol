import { call, select } from 'redux-saga/effects'

import { Collection, UserCollectionMetadata } from 'common/models/Collection'
import { getUserId } from 'common/store/account/selectors'
import { processAndCacheCollections } from 'common/store/cache/collections/utils'
import apiClient from 'services/audius-api-client/AudiusAPIClient'
import { getRemoteVar, StringKeys } from 'services/remote-config'
import { waitForRemoteConfig } from 'services/remote-config/Provider'
import { LineupSagas } from 'store/lineup/sagas'

import { PREFIX, trendingPlaylistLineupActions } from './actions'
import { getLineup } from './selectors'

function* getPlaylists({ limit, offset }: { limit: number; offset: number }) {
  yield call(waitForRemoteConfig)
  const TF = new Set(getRemoteVar(StringKeys.TPF)?.split(',') ?? [])

  const time = 'week' as const
  const currentUserId: ReturnType<typeof getUserId> = yield select(getUserId)
  let playlists: UserCollectionMetadata[] = yield call(
    args => apiClient.getTrendingPlaylists(args),
    {
      currentUserId,
      limit,
      offset,
      time
    }
  )
  if (TF.size > 0) {
    playlists = playlists.filter(p => {
      const shaId = window.Web3.utils.sha3(p.playlist_id.toString())
      return !TF.has(shaId)
    })
  }

  // Omit playlists owned by Audius
  const userIdsToOmit = new Set(
    (getRemoteVar(StringKeys.TRENDING_PLAYLIST_OMITTED_USER_IDS) || '').split(
      ','
    )
  )
  const trendingPlaylists = playlists.filter(
    playlist => !userIdsToOmit.has(`${playlist.playlist_owner_id}`)
  )

  const processed: Collection[] = yield processAndCacheCollections(
    trendingPlaylists,
    false
  )

  return processed
}

class TrendingPlaylistSagas extends LineupSagas {
  constructor() {
    super(PREFIX, trendingPlaylistLineupActions, getLineup, getPlaylists)
  }
}

const sagas = () => new TrendingPlaylistSagas().getSagas()
export default sagas
