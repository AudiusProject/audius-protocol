import { useCallback, useEffect, useState } from 'react'

import { difference, isEqual, shuffle } from 'lodash'
import { useSelector, useDispatch } from 'react-redux'

import { ID } from '~/models/Identifiers'
import { Status } from '~/models/Status'
import { TimeRange } from '~/models/TimeRange'
import { Track, UserTrackMetadata } from '~/models/Track'
import { getUserId } from '~/store/account/selectors'
import { addTrackToPlaylist } from '~/store/cache/collections/actions'
import { getCollection } from '~/store/cache/collections/selectors'
import { getTrack } from '~/store/cache/tracks/selectors'
import { CommonState } from '~/store/index'

import { useFavoritedTracks } from './tan-query/useFavoritedTracks'
import { useTracks } from './tan-query/useTracks'
import { useTrending } from './tan-query/useTrending'

const suggestedTrackCount = 5

const isValidTrack = (track: Track | UserTrackMetadata) => {
  return (
    !track.is_stream_gated &&
    !track.is_delete &&
    !track.is_invalid &&
    !track.is_unlisted
  )
}

export type SuggestedTrack =
  | { isLoading: true; key: ID }
  | { isLoading: true; id: ID; key: ID }
  | { isLoading: false; id: ID; track: Track; key: ID }

const skeletons = [...Array(suggestedTrackCount)].map((_, index) => ({
  key: index + suggestedTrackCount,
  isLoading: true as const
}))

const selectSuggestedTracks = (
  state: CommonState,
  ids: ID[],
  // NOTE: This is needed to remove deleted tracks from the list of ids
  setIds: (ids: ID[]) => void,
  maxLength = suggestedTrackCount
): SuggestedTrack[] => {
  const idsToRemove: ID[] = []
  const suggestedTracks: (
    | {
        id: number
        key: number
        isLoading: false
        track: Track
      }
    | {
        id: number
        key: number
        isLoading: true
      }
  )[] = []

  // Loop until we have 5 valid track entries
  let i = 0
  while (i < ids.length && suggestedTracks.length < 5) {
    const id = ids[i]
    const track = getTrack(state, { id })

    if (track) {
      if (!isValidTrack(track)) {
        idsToRemove.push(id)
      } else {
        suggestedTracks.push({ id, track, isLoading: false as const, key: id })
      }
    } else {
      suggestedTracks.push({ id, isLoading: true as const, key: id })
    }

    i++
  }

  if (idsToRemove.length > 0) {
    setIds(difference(ids, idsToRemove))
  }

  return [...suggestedTracks, ...skeletons].slice(
    0,
    Math.min(maxLength, suggestedTrackCount)
  )
}

const selectCollectionTrackIds = (state: CommonState, collectionId: ID) => {
  const collection = getCollection(state, { id: collectionId })
  if (!collection) return []
  return collection?.playlist_contents.track_ids.map((trackId) => trackId.track)
}

export const useGetSuggestedPlaylistTracks = (collectionId: ID) => {
  const currentUserId = useSelector(getUserId)
  const dispatch = useDispatch()
  const [suggestedTrackIds, setSuggestedTrackIds] = useState<ID[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [suggestedTrackStatus, setSuggestedTrackStatus] = useState<Status>(
    Status.LOADING
  )

  const collectionTrackIds = useSelector((state: CommonState) =>
    selectCollectionTrackIds(state, collectionId)
  )

  const { data: favoritedTracks, isSuccess: isFavoritedSuccess } =
    useFavoritedTracks(currentUserId)

  useEffect(() => {
    if (isFavoritedSuccess) {
      const suggestedTrackIds = difference(
        shuffle(favoritedTracks).map((track) => track.save_item_id),
        collectionTrackIds
      )
      setSuggestedTrackStatus(Status.SUCCESS)
      setSuggestedTrackIds(suggestedTrackIds)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFavoritedSuccess])

  const {
    data: trendingTracks,
    isSuccess: isTrendingSuccess,
    loadMore
  } = useTrending(
    {
      timeRange: TimeRange.WEEK
    },
    {
      enabled: isFavoritedSuccess
    }
  )

  useEffect(() => {
    if (isTrendingSuccess && suggestedTrackStatus === Status.SUCCESS) {
      const trendingTrackIds = difference(
        trendingTracks.filter(isValidTrack).map((track) => track.track_id),
        collectionTrackIds
      )
      setSuggestedTrackIds([...suggestedTrackIds, ...trendingTrackIds])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTrendingSuccess, suggestedTrackStatus])

  useEffect(() => {
    if (suggestedTrackIds.length < suggestedTrackCount) {
      loadMore()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggestedTrackIds.length])

  const suggestedTracks = useSelector(
    (state: CommonState) =>
      selectSuggestedTracks(
        state,
        [...new Set(suggestedTrackIds)],
        setSuggestedTrackIds
      ),
    isEqual
  )

  useTracks(
    suggestedTracks
      .filter(
        (
          suggestedTrack
        ): suggestedTrack is { isLoading: true; id: ID; key: ID } =>
          'id' in suggestedTrack && suggestedTrack.isLoading
      )
      .map((suggestedTrack) => suggestedTrack.id)
  )

  const handleAddTrack = useCallback(
    (trackId: ID) => {
      dispatch(addTrackToPlaylist(trackId, collectionId))
      const trackIndexToRemove = suggestedTrackIds.indexOf(trackId)
      suggestedTrackIds.splice(trackIndexToRemove, 1)
      setSuggestedTrackIds(suggestedTrackIds)
    },
    [collectionId, dispatch, suggestedTrackIds]
  )

  const handleRefresh = useCallback(() => {
    setSuggestedTrackIds(suggestedTrackIds.slice(suggestedTrackCount))
    setIsRefreshing(true)
  }, [suggestedTrackIds])

  useEffect(() => {
    if (suggestedTracks.every((suggestedTrack) => !suggestedTrack.isLoading)) {
      setIsRefreshing(false)
    }
  }, [suggestedTracks])

  return {
    suggestedTracks,
    isRefreshing,
    onRefresh: handleRefresh,
    onAddTrack: handleAddTrack
  }
}
