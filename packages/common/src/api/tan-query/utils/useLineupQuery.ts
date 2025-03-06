import { useEffect } from 'react'

import { QueryKey, UseInfiniteQueryResult } from '@tanstack/react-query'
import { isEqual } from 'lodash'
import { Selector, useDispatch, useSelector } from 'react-redux'
import { usePrevious } from 'react-use'

import {
  Collection,
  ID,
  LineupState,
  LineupTrack,
  PlaybackSource,
  Status,
  Track,
  UID,
  UserTrackMetadata,
  combineStatuses
} from '~/models'
import { CommonState } from '~/store/commonStore'
import { LineupActions } from '~/store/lineup/actions'
import { getPlaying } from '~/store/player/selectors'

import { loadNextPage } from './infiniteQueryLoadNextPage'

/**
 * Helper to provide stitch together tan-query data and easily provide lineup methods as part of our query hooks
 */
export const useLineupQuery = ({
  queryData,
  queryKey,
  lineupActions,
  lineupSelector,
  playbackSource,
  pageSize
}: {
  // Lineup related props
  queryData: UseInfiniteQueryResult<UserTrackMetadata[]>
  queryKey: QueryKey
  lineupActions: LineupActions
  lineupSelector: Selector<
    CommonState,
    LineupState<LineupTrack | Track | Collection>
  >
  pageSize: number
  playbackSource: PlaybackSource
}) => {
  const lineup = useSelector(lineupSelector)

  const isPlaying = useSelector(getPlaying)
  const dispatch = useDispatch()
  // Lineup actions
  const togglePlay = (uid: UID, id: ID) => {
    dispatch(lineupActions.togglePlay(uid, id, playbackSource))
  }

  const play = (uid?: UID) => {
    dispatch(lineupActions.play(uid))
  }

  const pause = () => {
    dispatch(lineupActions.pause())
  }

  const updateLineupOrder = (orderedIds: UID[]) => {
    dispatch(lineupActions.updateLineupOrder(orderedIds))
  }

  const status = combineStatuses([
    queryData.isFetching ? Status.LOADING : Status.SUCCESS,
    lineup.status
  ])

  const { data } = queryData
  const prevQueryKey = usePrevious(queryKey)
  const hasQueryKeyChanged = !isEqual(prevQueryKey, queryKey)
  useEffect(() => {
    if (hasQueryKeyChanged) {
      dispatch(lineupActions.reset())
      // If we have a cache hit, we already have data cached.
      // Normally we call fetchLineupMetadatas inside the queryFn, but on a cache hit it will not run
      // so we need to call it here
      // NOTE: this loads all previously loaded pages into the first page of the lineup
      if (data?.length && data?.length > 0) {
        dispatch(
          lineupActions.fetchLineupMetadatas(0, data.length, false, {
            tracks: data
          })
        )
      }
    }
  }, [dispatch, lineupActions, data, pageSize, hasQueryKeyChanged])

  return {
    status,
    source: playbackSource,
    lineup: {
      ...lineup,
      status,
      isMetadataLoading: status === Status.LOADING,
      hasMore: queryData.isLoading
        ? true
        : 'hasNextPage' in queryData
          ? queryData.hasNextPage
          : false
    },
    togglePlay,
    play,
    pause,
    updateLineupOrder,
    isPlaying,
    loadNextPage: loadNextPage(queryData)
  }
}

export type UseLineupQueryData = ReturnType<typeof useLineupQuery>
