import { useMemo } from 'react'

import type { APIFavorite } from '@audius/common'
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

type FavoritedTracksResponse = {
  data: {
    favorite_item_id: string
    favorite_type: string
    created_at: string
  }[]
}

export const fetchAllFavoritedTracks = async (currentUserId: number) => {
  const url = apiClient.makeUrl(
    `/users/${encodeHashId(currentUserId)}/favorites`,
    {
      user_id: currentUserId,
      limit: 10000
    }
  )
  const { data: result }: FavoritedTracksResponse = await fetch(url).then(
    (response) => response.json()
  )

  return result
    .filter((trackSave) => trackSave.favorite_type === 'SaveType.track')
    .map((trackSave: APIFavorite) => ({
      trackId: decodeHashId(trackSave.favorite_item_id) as number,
      favoriteCreatedAt: trackSave.created_at
    }))
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
