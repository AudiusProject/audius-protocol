import { useMemo } from 'react'

import type { APIFavorite, ID } from '@audius/common'
import {
  decodeHashId,
  encodeHashId,
  accountSelectors,
  savedPageSelectors
} from '@audius/common'
import moment from 'moment'
import { useSelector } from 'react-redux'
import { useAsync } from 'react-use'

import { apiClient } from 'app/services/audius-api-client'

import { useIsOfflineModeEnabled } from './useIsOfflineModeEnabled'
const { getLocalSaves } = savedPageSelectors

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
  const localSaves = useSelector(getLocalSaves)
  const localTrackSaves = useMemo(
    () =>
      Object.keys(localSaves)
        .filter((localSaveId) =>
          localSaves[localSaveId]?.includes('kind:TRACKS')
        )
        .map((trackId) => ({
          trackId: parseInt(trackId),
          favoriteCreatedAt: moment().format('YYYY-MM-DD HH:mm:ss')
        })),
    [localSaves]
  )

  return useAsync(async () => {
    if (!isOfflineModeEnabled || !currentUserId) return
    const fetchedFavoritedTracks = await fetchAllFavoritedTracks(currentUserId)
    return [...localTrackSaves, ...fetchedFavoritedTracks]
  }, [
    currentUserId,
    isOfflineModeEnabled,
    localTrackSaves,
    fetchAllFavoritedTracks
  ])
}
