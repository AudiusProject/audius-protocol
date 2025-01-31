import { useMemo } from 'react'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { difference, shuffle } from 'lodash'
import { useSelector } from 'react-redux'

import { UserCollectionMetadata } from '~/models/Collection'
import { ID } from '~/models/Identifiers'
import { TimeRange } from '~/models/TimeRange'
import { Track } from '~/models/Track'
import { getUserId } from '~/store/account/selectors'

import { getCollectionQueryKey, useCollection } from './useCollection'
import { useFavoritedTracks } from './useFavoritedTracks'
import { useTracks } from './useTracks'
import { useTrending } from './useTrending'

const SUGGESTED_TRACK_COUNT = 5

const isValidTrack = (track: Track) => {
  return (
    !track.is_stream_gated &&
    !track.is_delete &&
    !track.is_invalid &&
    !track.is_unlisted
  )
}

export type SuggestedTrack = {
  id: ID
  track: Track
}

export const useSuggestedPlaylistTracks = (collectionId: ID) => {
  const currentUserId = useSelector(getUserId)
  const queryClient = useQueryClient()

  // Get current collection tracks to exclude
  const { data: collection, isLoading: isLoadingCollection } =
    useCollection(collectionId)
  const collectionTrackIds = useMemo(
    () =>
      collection?.playlist_contents.track_ids.map((trackId) => trackId.track) ??
      [],
    [collection?.playlist_contents.track_ids]
  )

  // Get favorited tracks
  const { data: favoritedTracks = [], isLoading: isLoadingFavoritedTracks } =
    useFavoritedTracks(currentUserId, {
      enabled: !!currentUserId
    })

  // Get trending tracks
  const {
    data: trendingTracks = [],
    fetchNextPage: fetchNextPageTrending,
    isLoading: isLoadingTrendingTracks
  } = useTrending(
    {
      timeRange: TimeRange.WEEK
    },
    {
      enabled: true
    }
  )

  const uniqueIds = new Set([
    ...favoritedTracks.map((track) => track.save_item_id),
    ...trendingTracks.map((track) => track.track_id)
  ])

  // Combine and filter tracks
  const suggestedTrackIds = useMemo(() => {
    const favoriteIds = favoritedTracks.map((track) => track.save_item_id)
    const trendingIds = trendingTracks
      .filter(isValidTrack)
      .map((track) => track.track_id)

    // Combine, dedupe, and exclude collection tracks
    const combinedIds = difference(
      [...new Set([...favoriteIds, ...trendingIds])],
      collectionTrackIds
    )

    // Shuffle and take first N
    return shuffle(combinedIds).slice(0, SUGGESTED_TRACK_COUNT)
  }, [uniqueIds, collectionTrackIds])

  console.log('suggestedTrackIds', suggestedTrackIds)
  // Load track data
  const { data: tracks = [], isLoading } = useTracks(suggestedTrackIds, {
    enabled:
      !isLoadingFavoritedTracks &&
      !isLoadingTrendingTracks &&
      !isLoadingCollection
  })

  // Format suggested tracks
  const suggestedTracks = useMemo(
    () =>
      tracks
        .filter((track) => !!track && isValidTrack(track))
        .map((track) => ({
          id: track.track_id,
          track
        })),
    [tracks]
  )

  const { mutate: onAddTrack } = useMutation({
    mutationFn: async (trackId: ID) => {
      const collection = queryClient.getQueryData<UserCollectionMetadata>([
        'collections',
        collectionId
      ])
      if (!collection) return

      const updatedTrackIds = [
        ...collection.playlist_contents.track_ids,
        { track: trackId, time: Date.now() }
      ]

      queryClient.setQueryData(getCollectionQueryKey(collectionId), {
        ...collection,
        playlist_contents: {
          ...collection.playlist_contents,
          track_ids: updatedTrackIds
        }
      })
    }
  })

  const { mutate: onRefresh } = useMutation({
    // this will trigger a re-shuffling of the tracks as well
    mutationFn: fetchNextPageTrending
  })

  return {
    suggestedTracks,
    isRefreshing: isLoading,
    // onRefresh: () => onRefresh({}),
    // onAddTrack: (trackId: ID) => onAddTrack(trackId)
    onRefresh: () => {},
    onAddTrack: () => {}
  }
}
