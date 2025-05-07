import { useCallback, useEffect, useMemo, useState } from 'react'

import { difference, shuffle } from 'lodash'
import { useDispatch } from 'react-redux'

import { ID } from '~/models/Identifiers'
import { TimeRange } from '~/models/TimeRange'
import { Track } from '~/models/Track'
import { addTrackToPlaylist } from '~/store/cache/collections/actions'

import { useCollection } from '../collection/useCollection'
import { useTrending } from '../lineups/useTrending'
import { useFavoritedTracks } from '../tracks/useFavoritedTracks'
import { useTracks } from '../tracks/useTracks'
import { useCurrentUserId } from '../users/account/useCurrentUserId'

export const SUGGESTED_TRACK_COUNT = 5

const isValidTrack = (track: Track) => {
  return !track.is_delete && !track.is_invalid && !track.is_unlisted
}

export type SuggestedTrack = {
  id: ID
  track: Track
}

export const useSuggestedPlaylistTracks = (collectionId: ID) => {
  const { data: currentUserId } = useCurrentUserId()

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
    useFavoritedTracks(currentUserId)

  // Get trending tracks
  const {
    data: trendingTrackLineup = [],
    loadNextPage: loadNextPageTrending,
    isLoading: isLoadingTrendingTracks
  } = useTrending({ timeRange: TimeRange.WEEK })

  const { data: trendingTracks = [] } = useTracks(
    trendingTrackLineup.map((track) => track.id)
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
    loadNextPageTrending()
    setSuggestedTracks([])
  }, [loadNextPageTrending, setSuggestedTracks])

  return {
    suggestedTracks,
    onRefresh,
    onAddTrack
  }
}
