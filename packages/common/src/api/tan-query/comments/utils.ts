import { QueryClient } from '@tanstack/react-query'
import { Dispatch } from 'redux'

import { ID } from '~/models'
import { incrementTrackCommentCount } from '~/store/cache/tracks/actions'

import { QUERY_KEYS } from '../queryKeys'

import { TrackCommentCount } from './types'

export const getCommentQueryKey = (commentId: ID) =>
  [QUERY_KEYS.comment, commentId] as const

export const getTrackCommentListQueryKey = ({
  trackId,
  sortMethod
}: {
  trackId: ID
  sortMethod: any
  pageSize?: number
}) => [QUERY_KEYS.trackCommentList, trackId, { sortMethod }] as const

export const getTrackCommentCountQueryKey = (trackId: ID | null | undefined) =>
  [QUERY_KEYS.trackCommentCount, trackId] as const

export const getCommentRepliesQueryKey = ({
  commentId,
  pageSize
}: {
  commentId: ID
  pageSize?: number
}) =>
  [QUERY_KEYS.comment, commentId, QUERY_KEYS.commentReplies, pageSize] as const

export const getTrackCommentNotificationSettingQueryKey = (trackId: ID) =>
  [QUERY_KEYS.trackCommentNotificationSetting, trackId] as const

export const setPreviousCommentCount = (
  queryClient: QueryClient,
  trackId: ID,
  // If not provided, we will use the current value to set the previous value (aka reset)
  updaterFn?: (prevData: TrackCommentCount | undefined) => TrackCommentCount
) => {
  queryClient.setQueryData(
    getTrackCommentCountQueryKey(trackId),
    (prevData: TrackCommentCount | undefined) =>
      updaterFn
        ? updaterFn(prevData)
        : ({
            ...prevData,
            previousValue: prevData?.currentValue ?? 0
          } as TrackCommentCount)
  )
}

// Quick wrapper around setPreviousCommentCount to pass undefined as  (which will prompt it to just use the current value)
export const resetPreviousCommentCount = (
  queryClient: QueryClient,
  trackId: ID
) => setPreviousCommentCount(queryClient, trackId)

export const addCommentCount = (
  dispatch: Dispatch,
  queryClient: QueryClient,
  trackId: ID
) => {
  // Increment the track comment count
  setPreviousCommentCount(queryClient, trackId, (prevData) => ({
    previousValue: (prevData?.previousValue ?? 0) + 1,
    currentValue: (prevData?.currentValue ?? 0) + 1
  }))
  dispatch(incrementTrackCommentCount(trackId, 1))
}

export const subtractCommentCount = (
  dispatch: Dispatch,
  queryClient: QueryClient,
  trackId: ID
) => {
  // Increment the track comment count
  setPreviousCommentCount(queryClient, trackId, (prevData) => ({
    previousValue: (prevData?.previousValue ?? 0) - 1,
    currentValue: (prevData?.currentValue ?? 0) - 1
  }))
  dispatch(incrementTrackCommentCount(trackId, -1))
}
