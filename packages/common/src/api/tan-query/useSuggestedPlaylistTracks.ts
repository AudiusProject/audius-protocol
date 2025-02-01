import { useCallback, useEffect, useMemo, useState } from 'react'

import { difference, shuffle } from 'lodash'
import { useDispatch, useSelector } from 'react-redux'

import { ID } from '~/models/Identifiers'
import { TimeRange } from '~/models/TimeRange'
import { Track } from '~/models/Track'
import { getUserId } from '~/store/account/selectors'
import { addTrackToPlaylist } from '~/store/cache/collections/actions'

import { useCollection } from './useCollection'
import { useFavoritedTracks } from './useFavoritedTracks'
import { useTracks } from './useTracks'
import { useTrending } from './useTrending'

export const SUGGESTED_TRACK_COUNT = 5

const isValidTrack = (track: Track) => {
  return (
    // !track.is_stream_gated &&
    !track.is_delete && !track.is_invalid && !track.is_unlisted
  )
}

export type SuggestedTrack = {
  id: ID
  track: Track
}

export const useSuggestedPlaylistTracks = (collectionId: ID) => {
  const currentUserId = useSelector(getUserId)

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
    return shuffle(combinedIds).slice(0, SUGGESTED_TRACK_COUNT * 3)
  }, [favoritedTracks, trendingTracks, collectionTrackIds])

  // Load track data
  const { data: tracks = [] } = useTracks(suggestedTrackIds, {
    enabled:
      !isLoadingFavoritedTracks &&
      !isLoadingTrendingTracks &&
      !isLoadingCollection
  })

  // Format suggested tracks
  const [suggestedTracks, setSuggestedTracks] = useState<SuggestedTrack[]>([])
  useEffect(() => {
    setSuggestedTracks(
      tracks
        .filter((track) => !!track && isValidTrack(track))
        .map((track) => ({
          id: track.track_id,
          track
        }))
        .slice(0, SUGGESTED_TRACK_COUNT)
    )
  }, [tracks])

  const dispatch = useDispatch()
  const onAddTrack = useCallback(
    async (trackId: ID) => {
      // feature-tan-query TODO: add via mutation hook
      dispatch(addTrackToPlaylist(trackId, collectionId))
    },
    [collectionId, dispatch]
  )
  const onRefresh = useCallback(async () => {
    fetchNextPageTrending()
    setSuggestedTracks([])
  }, [fetchNextPageTrending, setSuggestedTracks])

  return {
    suggestedTracks,
    onRefresh,
    onAddTrack
  }
}
