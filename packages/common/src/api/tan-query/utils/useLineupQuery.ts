import { UseInfiniteQueryResult } from '@tanstack/react-query'
import { Selector, useDispatch, useSelector } from 'react-redux'

import {
  Collection,
  ID,
  LineupState,
  LineupTrack,
  PlaybackSource,
  Status,
  Track,
  UID,
  combineStatuses
} from '~/models'
import { CommonState } from '~/store/commonStore'
import { LineupActions } from '~/store/lineup/actions'
import { getPlaying } from '~/store/player/selectors'

/**
 * Helper to provide stitch together tan-query data and easily provide lineup methods as part of our query hooks
 */
export const useLineupQuery = ({
  queryData,
  lineupActions,
  lineupSelector,
  playbackSource
}: {
  // Lineup related props
  queryData: UseInfiniteQueryResult
  lineupActions: LineupActions
  lineupSelector: Selector<
    CommonState,
    LineupState<LineupTrack | Track | Collection>
  >
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

  return {
    status,
    source: playbackSource,
    lineup: {
      ...lineup,
      status,
      isMetadataLoading: status === Status.LOADING,
      hasMore: queryData.isLoading ? true : queryData.hasNextPage
    },
    togglePlay,
    play,
    pause,
    updateLineupOrder,
    isPlaying
  }
}
