import { InfiniteData, QueryClient } from '@tanstack/react-query'
import { Dispatch } from 'redux'

import { ID } from '~/models'
import { incrementTrackCommentCount } from '~/store/cache/tracks/actions'

import { QUERY_KEYS } from '../queryKeys'
import { QueryKey } from '../types'

import { CommentOrReply, TrackCommentCount } from './types'

export const getCommentQueryKey = (commentId: ID) => {
  return [QUERY_KEYS.comment, commentId] as unknown as QueryKey<CommentOrReply>
}

export const getTrackCommentListQueryKey = ({
  trackId,
  sortMethod
}: {
  trackId: ID
  sortMethod: any
  pageSize?: number
}) => {
  return [
    QUERY_KEYS.trackCommentList,
    trackId,
    { sortMethod }
  ] as unknown as QueryKey<InfiniteData<ID[]>>
}

export const getTrackCommentCountQueryKey = (
  trackId: ID | null | undefined
) => {
  return [
    QUERY_KEYS.trackCommentCount,
    trackId
  ] as unknown as QueryKey<TrackCommentCount>
}

export const getCommentRepliesQueryKey = ({
  commentId,
  pageSize
}: {
  commentId: ID
  pageSize?: number
}) => {
  return [
    QUERY_KEYS.comment,
    commentId,
    QUERY_KEYS.commentReplies,
    pageSize
  ] as unknown as QueryKey<InfiniteData<ID[]>>
}

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
