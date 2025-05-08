import { useCallback, useEffect, useState } from 'react'

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

export type SuggestedTrack = {
  id: ID
  track: Track
}

export const useSuggestedPlaylistTracks = (collectionId: ID) => {
  const { data: currentUserId } = useCurrentUserId()
  const [suggestedTrackIds, setSuggestedTrackIds] = useState<ID[]>([])

  // Get current collection tracks so we know what to exclude
  const { data: collection, isPending: isCollectionPending } =
    useCollection(collectionId)

  // Get favorited tracks
  const { data: favorites = [], isPending: isFavoritedTracksPending } =
    useFavoritedTracks(currentUserId)

  // Get trending tracks
  const {
    data: trendingTracks = [],
    loadNextPage: loadNextPageTrending,
    // Note: specifically using isFetching here so that the effect below gets called on future page loads
    isFetching: isTrendingTracksFetching
  } = useTrending({ timeRange: TimeRange.WEEK })

  const getRandomTracksFromList = useCallback(() => {
    const favoriteIds = favorites.map((favorite) => favorite.save_item_id)
    const trendingIds = trendingTracks.map((track) => track.id)
    // Combine, dedupe, and exclude collection tracks
    const combinedIds = shuffle(
      difference(
        [...new Set([...favoriteIds, ...trendingIds])],
        collection?.trackIds ?? []
      )
    )
    // Take the first 5 tracks from the pool and use those as our suggested tracks
    return combinedIds.slice(0, SUGGESTED_TRACK_COUNT)
  }, [collection?.trackIds, favorites, trendingTracks])

  // Set up our initial 5 tracks
  useEffect(() => {
    if (
      !isTrendingTracksFetching &&
      !isFavoritedTracksPending &&
      !isCollectionPending &&
      suggestedTrackIds.length === 0
    ) {
      setSuggestedTrackIds(getRandomTracksFromList())
    }
  }, [
    isTrendingTracksFetching,
    isFavoritedTracksPending,
    isCollectionPending,
    getRandomTracksFromList,
    suggestedTrackIds.length
  ])

  // Load track data
  const { data: suggestedTracks = [] } = useTracks(suggestedTrackIds)

  const dispatch = useDispatch()
  const onAddTrack = useCallback(
    async (trackId: ID) => {
      // tan-query TODO: add via mutation hook instead
      dispatch(addTrackToPlaylist(trackId, collectionId))
    },
    [collectionId, dispatch]
  )
  const onRefresh = useCallback(async () => {
    const moreTracks = getRandomTracksFromList()
    // If this list length is under our track count that means we've used all the possible tracks we fetched
    // So we need to get more from trending in this scenario
    if (moreTracks.length < SUGGESTED_TRACK_COUNT) {
      // reload the trackss
      setSuggestedTrackIds([])
      loadNextPageTrending()
    } else {
      setSuggestedTrackIds(moreTracks)
    }
  }, [loadNextPageTrending, getRandomTracksFromList])

  return {
    suggestedTracks,
    onRefresh,
    onAddTrack
  }
}
