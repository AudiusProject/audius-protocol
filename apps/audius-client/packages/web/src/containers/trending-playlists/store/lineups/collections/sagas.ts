import { call, select } from 'redux-saga/effects'
import { getUserId } from 'store/account/selectors'
import { LineupSagas } from 'store/lineup/sagas'
import { PREFIX, trendingPlaylistLineupActions } from './actions'
import { getLineup } from './selectors'
import apiClient from 'services/audius-api-client/AudiusAPIClient'
import { processAndCacheCollections } from 'store/cache/collections/utils'
import Collection, { UserCollectionMetadata } from 'models/Collection'
import { getRemoteVar, StringKeys } from 'services/remote-config'

function* getPlaylists({ limit, offset }: { limit: number; offset: number }) {
  const time = 'week' as 'week'
  const currentUserId: ReturnType<typeof getUserId> = yield select(getUserId)
  const playlists: UserCollectionMetadata[] = yield call(
    args => apiClient.getTrendingPlaylists(args),
    {
      currentUserId,
      limit,
      offset,
      time
    }
  )

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
