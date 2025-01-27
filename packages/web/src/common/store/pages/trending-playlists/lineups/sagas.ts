import { Collection, UserCollectionMetadata } from '@audius/common/models'
import {
  trendingPlaylistsPageLineupSelectors,
  trendingPlaylistsPageLineupActions
} from '@audius/common/store'

import { LineupSagas } from 'common/store/lineup/sagas'
const { getLineup } = trendingPlaylistsPageLineupSelectors

function* getPlaylists({
  payload
}: {
  payload?: { playlists: UserCollectionMetadata[] }
}) {
  return payload?.playlists ?? []
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
