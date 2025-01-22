import {
  useInfiniteQuery,
  UseInfiniteQueryOptions
} from '@tanstack/react-query'
import { Selector, useDispatch, useSelector } from 'react-redux'

import {
  ID,
  LineupState,
  LineupTrack,
  PlaybackSource,
  Status,
  UID,
  combineStatuses
} from '~/models'
import { CommonState } from '~/store/commonStore'
import { LineupActions } from '~/store/lineup/actions'
import { getPlaying } from '~/store/player/selectors'

export const useLineupQuery = <T>({
  queryKey,
  queryFn,
  initialPageParam,
  getNextPageParam,
  lineupActions,
  lineupSelector,
  playbackSource,
  ...options
}: {
  // Lineup related props
  lineupActions: LineupActions // TODO
  lineupSelector: Selector<CommonState, LineupState<LineupTrack>> // TODO
  playbackSource: PlaybackSource
  queryFn: (args: { pageParam: number }) => Promise<T[]>
} & Omit<UseInfiniteQueryOptions, 'queryFn'>) => {
  const lineup = useSelector(lineupSelector) // TODO: no any

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

  const queryData = useInfiniteQuery({
    queryKey,
    // @ts-ignore
    queryFn,
    initialPageParam,
    getNextPageParam,
    ...options
  })

  const status = combineStatuses([
    queryData.isPending ? Status.LOADING : Status.SUCCESS,
    lineup.status
  ])

  return {
    ...queryData,
    status,
    entries: lineup.entries as T[],
    togglePlay,
    play,
    pause,
    updateLineupOrder,
    isPlaying
  }
}
