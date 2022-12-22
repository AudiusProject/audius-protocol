import type { APIFavorite, ID } from '@audius/common'
import { decodeHashId, encodeHashId, accountSelectors } from '@audius/common'
import { useSelector } from 'react-redux'
import { useAsync } from 'react-use'

import { apiClient } from 'app/services/audius-api-client'

import { useIsOfflineModeEnabled } from './useIsOfflineModeEnabled'

const { getUserId } = accountSelectors

export const fetchAllFavoritedTracks = async (currentUserId: number) => {
  let tracksAndTimestamps: { trackId: ID; favoriteCreatedAt: string }[] = []
  let loadMore = true
  let offset = 0
  // TODO: store results in state to avoid duplicate fetching
  while (loadMore) {
    const url = apiClient.makeUrl(
      `/users/${encodeHashId(currentUserId)}/favorites`,
      {
        user_id: currentUserId,
        limit: 500,
        offset
      }
    )
    const { data: result } = await fetch(url).then((response) =>
      response.json()
    )

    loadMore = result.length > 0
    offset += result.length
    tracksAndTimestamps = tracksAndTimestamps.concat(
      result
        .filter((trackSave) => trackSave.favorite_type === 'SaveType.track')
        .map((trackSave: APIFavorite) => ({
          trackId: decodeHashId(trackSave.favorite_item_id),
          favoriteCreatedAt: trackSave.created_at
        }))
    )
  }
  return tracksAndTimestamps
}

export const useFetchAllFavoritedTracks = () => {
  const currentUserId = useSelector(getUserId)
  const isOfflineModeEnabled = useIsOfflineModeEnabled()
  return useAsync(async () => {
    if (!isOfflineModeEnabled || !currentUserId) return
    return fetchAllFavoritedTracks(currentUserId)
  }, [currentUserId, isOfflineModeEnabled, fetchAllFavoritedTracks])
}
