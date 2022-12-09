import type { APIFavorite } from '@audius/common'
import { decodeHashId, encodeHashId, accountSelectors } from '@audius/common'
import { useSelector } from 'react-redux'
import { useAsync } from 'react-use'

import { apiClient } from 'app/services/audius-api-client'

import { useIsOfflineModeEnabled } from './useIsOfflineModeEnabled'

const { getUserId } = accountSelectors

export const useFetchAllFavoritedTrackIds = () => {
  const currentUserId = useSelector(getUserId)
  const isOfflineModeEnabled = useIsOfflineModeEnabled()
  return useAsync(async () => {
    if (!isOfflineModeEnabled) return []
    let trackIds: number[] = []
    let loadMore = true
    let offset = 0
    while (loadMore) {
      const url = apiClient.makeUrl(
        `/users/${encodeHashId(currentUserId)}/favorites`,
        {
          user_id: currentUserId,
          limit: 500,
          offset
          // TODO: sort_method: added_date, sort_direction: descending
        }
      )
      const { data: result } = await fetch(url).then((response) =>
        response.json()
      )

      loadMore = result.length > 0
      offset += result.length
      trackIds = trackIds.concat(
        result
          .filter((trackSave) => trackSave.favorite_type === 'SaveType.track')
          .map((trackSave: APIFavorite) =>
            decodeHashId(trackSave.favorite_item_id)
          )
      )
    }
    return trackIds
  }, [currentUserId])
}
