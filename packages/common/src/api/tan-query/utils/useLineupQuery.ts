import {
  useInfiniteQuery,
  UseInfiniteQueryOptions
} from '@tanstack/react-query'
import { useDispatch, useSelector } from 'react-redux'

import { ID, PlaybackSource, Status, UID, combineStatuses } from '~/models'
import { getPlaying } from '~/store/player/selectors'

export const useLineupQuery = ({
  pageSize,
  queryKey,
  queryFn,
  initialPageParam = 0,
  getNextPageParam,
  lineupActions,
  lineupSelector,
  playbackSource,
  ...options
}: {
  pageSize: number
  // Lineup related props
  lineupActions: any // TODO
  lineupSelector: any // TODO
  playbackSource: PlaybackSource
} & Omit<UseInfiniteQueryOptions, 'initialPageParam' | 'getNextPageParam'> &
  // optional because we're providing standard defaults
  Partial<
    Pick<UseInfiniteQueryOptions, 'initialPageParam' | 'getNextPageParam'>
  >) => {
  const defaultGetNextPageParam = (
    lastPage: unknown[],
    allPages: unknown[][]
  ) => {
    if (lastPage.length < pageSize) return undefined
    return allPages.length * pageSize
  }
  const lineup: any = useSelector(lineupSelector) // TODO: no any

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
    queryFn,
    initialPageParam,
    getNextPageParam: getNextPageParam ?? defaultGetNextPageParam,
    ...options
  })

  const status = combineStatuses([
    queryData.isPending ? Status.LOADING : Status.SUCCESS,
    lineup.status
  ])

  return {
    ...queryData,
    status,
    entries: lineup.entries,
    togglePlay,
    play,
    pause,
    updateLineupOrder,
    isPlaying
  }
}
