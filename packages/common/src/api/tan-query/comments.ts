import { useEffect } from 'react'

import {
  CommentMention,
  TrackCommentsSortMethodEnum as CommentSortMethod,
  EntityManagerAction,
  EntityType
} from '@audius/sdk'
import {
  InfiniteData,
  QueryClient,
  useInfiniteQuery,
  useIsMutating,
  useMutation,
  useQuery,
  useQueryClient
} from '@tanstack/react-query'
import { cloneDeep } from 'lodash'
import { useDispatch } from 'react-redux'
import { usePrevious } from 'react-use'
import { Dispatch } from 'redux'

import {
  commentFromSDK,
  replyCommentFromSDK,
  transformAndCleanList
} from '~/adapters'
import { useAudiusQueryContext } from '~/audius-query'
import { Comment, Feature, ID, ReplyComment } from '~/models'
import {
  incrementTrackCommentCount,
  setPinnedCommentId,
  setTrackCommentCount
} from '~/store/cache/tracks/actions'
import { toast } from '~/store/ui/toast/slice'
import { encodeHashId, Nullable } from '~/utils'

import { QUERY_KEYS } from './queryKeys'

type CommentOrReply = Comment | ReplyComment

const COMMENT_ROOT_PAGE_SIZE = 15
const COMMENT_REPLIES_PAGE_SIZE = 3

const messages = {
  loadError: (type: 'comments' | 'replies') =>
    `There was an error loading ${type}. Please try again.`,
  mutationError: (
    actionType:
      | 'pinning'
      | 'unpinning'
      | 'deleting'
      | 'posting'
      | 'editing'
      | 'reacting to'
      | 'reporting'
  ) => `There was an error ${actionType} that comment. Please try again`,
  muteUserError: 'There was an error muting that user. Please try again.',
  updateTrackCommentNotificationSettingError:
    'There was an error updating the track comment notification setting. Please try again.',
  updateCommentNotificationSettingError:
    'There was an error updating the comment notification setting. Please try again.'
}

/**
 *
 * QUERIES
 *
 */
type GetCommentsByTrackArgs = {
  trackId: ID
  userId: ID | null
  sortMethod: CommentSortMethod
  pageSize?: number
}

export const useGetCommentsByTrackId = ({
  trackId,
  userId,
  sortMethod,
  pageSize = COMMENT_ROOT_PAGE_SIZE
}: GetCommentsByTrackArgs) => {
  const { audiusSdk, reportToSentry } = useAudiusQueryContext()
  const isMutating = useIsMutating()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()

  const queryRes = useInfiniteQuery({
    enabled: !!trackId && trackId !== 0 && isMutating === 0,
    initialPageParam: 0,
    getNextPageParam: (lastPage: ID[], pages) => {
      if (lastPage?.length < pageSize) return undefined
      return (pages.length ?? 0) * pageSize
    },
    queryKey: [QUERY_KEYS.trackCommentList, trackId, sortMethod],
    queryFn: async ({ pageParam }): Promise<ID[]> => {
      const sdk = await audiusSdk()
      const commentsRes = await sdk.tracks.trackComments({
        trackId: encodeHashId(trackId),
        offset: pageParam,
        limit: pageSize,
        sortMethod,
        // TODO: why is this toString instead of encode
        userId: userId?.toString() ?? undefined
      })

      const commentList = transformAndCleanList(
        commentsRes.data,
        commentFromSDK
      )

      // Populate individual comment cache
      commentList.forEach((comment) => {
        queryClient.setQueryData<CommentOrReply>(
          [QUERY_KEYS.comment, comment.id],
          comment
        )
        comment?.replies?.forEach?.((reply) =>
          queryClient.setQueryData<CommentOrReply>(
            [QUERY_KEYS.comment, reply.id],
            reply
          )
        )
      })
      // For the comment list cache, we only store the ids of the comments (organized by sort method)
      return commentList.map((comment) => comment.id)
    },
    staleTime: Infinity, // Stale time is set to infinity so that we never reload data thats currently shown on screen (because sorting could have changed)
    gcTime: 0 // Cache time is set to 1 so that the data is cleared any time we leave the page viewing it or change sorts
  })

  const { error } = queryRes

  useEffect(() => {
    if (error) {
      reportToSentry({
        error,
        name: 'Comments',
        feature: Feature.Comments
      })
      dispatch(toast({ content: messages.loadError('comments') }))
    }
  }, [error, dispatch, reportToSentry])

  return { ...queryRes, data: queryRes.data?.pages?.flat() ?? [] }
}

export const useGetCommentById = (commentId: ID) => {
  const { reportToSentry } = useAudiusQueryContext()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()

  const queryRes = useQuery({
    queryKey: [QUERY_KEYS.comment, commentId],
    enabled: !!commentId,
    queryFn: async (): Promise<CommentOrReply | {}> => {
      // TODO: there's no backend implementation of this fetch at the moment;
      // but we also never expect to call the backend here; we always prepopulate the data from the fetch by tracks method
      return queryClient.getQueryData([QUERY_KEYS.comment, commentId]) ?? {}
    },
    staleTime: Infinity
  })

  const { error } = queryRes

  useEffect(() => {
    if (error) {
      reportToSentry({
        error,
        name: 'Comments',
        feature: Feature.Comments
      })
      dispatch(toast({ content: messages.loadError('comments') }))
    }
  }, [error, dispatch, reportToSentry])

  return queryRes
}

const COMMENT_COUNT_POLL_INTERVAL = 10 * 1000 // 5 secs

export type TrackCommentCount = {
  previousValue: number
  currentValue: number
}

const setPreviousCommentCount = (
  queryClient: QueryClient,
  trackId: ID,
  // If not provided, we will use the current value to set the previous value (aka reset)
  updaterFn?: (prevData: TrackCommentCount | undefined) => TrackCommentCount
) => {
  queryClient.setQueryData(
    [QUERY_KEYS.trackCommentCount, trackId],
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

const addCommentCount = (
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
const subtractCommentCount = (
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

export const useTrackCommentCount = (
  trackId: Nullable<ID> | undefined,
  userId: Nullable<ID>,
  shouldPoll = false
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const dispatch = useDispatch()
  const queryClient = useQueryClient()
  const queryData = useQuery({
    queryKey: [QUERY_KEYS.trackCommentCount, trackId],
    enabled: !!trackId,
    queryFn: async () => {
      const sdk = await audiusSdk()
      const res = await sdk.tracks.trackCommentCount({
        trackId: encodeHashId(trackId as ID), // Its safe to cast to ID because we only enable the query with !!trackId above
        userId: userId?.toString() ?? undefined // userId can be undefined if not logged in
      })
      const previousData = queryClient.getQueryData<TrackCommentCount>([
        QUERY_KEYS.trackCommentCount,
        trackId
      ])
      return {
        // If we've loaded previous data before, keep using the same previousValue
        // if there is no previous data its a first load so we need to set a baseline
        previousValue: previousData?.previousValue ?? res?.data,
        currentValue: res?.data
      }
    },

    refetchInterval: shouldPoll ? COMMENT_COUNT_POLL_INTERVAL : undefined,
    refetchIntervalInBackground: false,

    // this data is only used when on the page in comments, we want to make sure it gets fetched fresh every time we load comments
    gcTime: 1
  })

  // Track changes in the current value and update legacy cache when changed
  const currentCountValue = queryData?.data?.currentValue
  const previousCurrentCount = usePrevious(currentCountValue) // note: this is different from data.previousValue
  useEffect(() => {
    if (
      currentCountValue !== undefined &&
      previousCurrentCount !== currentCountValue
    ) {
      // This keeps the legacy cache in sync with tanquery here - since we update the comment count here more often than the legacy cache
      // We want to keep these values in sync
      dispatch(setTrackCommentCount(trackId as ID, currentCountValue))
    }
  }, [currentCountValue, dispatch, previousCurrentCount, trackId])
  return queryData
}

type GetRepliesArgs = {
  commentId: ID
  currentUserId?: Nullable<ID>
  enabled?: boolean
  pageSize?: number
}
export const useGetCommentRepliesById = ({
  commentId,
  enabled,
  currentUserId,
  pageSize = COMMENT_REPLIES_PAGE_SIZE
}: GetRepliesArgs) => {
  const { audiusSdk, reportToSentry } = useAudiusQueryContext()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()
  const startingLimit = pageSize // comments will load in with 3 already so we don't start pagination at 0

  const queryRes = useInfiniteQuery({
    queryKey: [QUERY_KEYS.comment, commentId, QUERY_KEYS.commentReplies],
    enabled: !!enabled,
    initialPageParam: startingLimit,
    getNextPageParam: (lastPage: ReplyComment[], pages) => {
      if (lastPage?.length < pageSize) return undefined
      return (pages.length ?? pageSize) * pageSize + startingLimit
    },
    queryFn: async ({ pageParam }): Promise<ReplyComment[]> => {
      const sdk = await audiusSdk()
      const commentsRes = await sdk.comments.getCommentReplies({
        commentId: encodeHashId(commentId),
        userId: currentUserId?.toString(),
        limit: pageSize,
        offset: pageParam
      })
      const replyList = transformAndCleanList(
        commentsRes.data,
        replyCommentFromSDK
      )
      // Add the replies to our parent comment replies list
      queryClient.setQueryData(
        [QUERY_KEYS.comment, commentId],
        (comment: Comment | undefined) =>
          ({
            ...comment,
            replies: [...(comment?.replies ?? []), ...replyList]
          } as Comment)
      )
      // Put each reply into their individual comment cache
      replyList.forEach((comment) => {
        queryClient.setQueryData([QUERY_KEYS.comment, comment.id], comment)
      })
      return replyList
    },
    staleTime: Infinity,
    gcTime: 1
  })

  const { error } = queryRes

  useEffect(() => {
    if (error) {
      reportToSentry({
        error,
        name: 'Comments',
        feature: Feature.Comments
      })
      dispatch(toast({ content: messages.loadError('replies') }))
    }
  }, [error, dispatch, reportToSentry])

  return { ...queryRes, data: queryRes.data?.pages?.flat() ?? [] }
}

/**
 *
 * MUTATIONS
 *
 */
type PostCommentArgs = {
  userId: ID
  trackId: ID
  entityType?: EntityType
  body: string
  currentSort: CommentSortMethod
  parentCommentId?: ID
  trackTimestampS?: number
  mentions?: CommentMention[]
  newId?: ID
}

export const usePostComment = () => {
  const { audiusSdk, reportToSentry } = useAudiusQueryContext()
  const dispatch = useDispatch()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (args: PostCommentArgs) => {
      const sdk = await audiusSdk()
      return await sdk.comments.postComment({
        ...args,
        mentions: args.mentions?.map((mention) => mention.userId) ?? [],
        entityId: args.trackId,
        commentId: args.newId
      })
    },
    onMutate: async (args: PostCommentArgs) => {
      const {
        userId,
        body,
        trackId,
        parentCommentId,
        trackTimestampS,
        currentSort,
        mentions
      } = args
      const isReply = parentCommentId !== undefined
      // This executes before the mutationFn is called, and the reference to comment is the same in both
      // therefore, this sets the id that will be posted to the server
      const sdk = await audiusSdk()
      const newId = await sdk.comments.generateCommentId()
      // hack alert: there is no way to send context from onMutate to mutationFn so we hack it into the args
      args.newId = newId
      const newComment: Comment = {
        id: newId,
        userId,
        message: body,
        mentions,
        isEdited: false,
        trackTimestampS,
        reactCount: 0,
        replyCount: 0,
        replies: undefined,
        createdAt: new Date().toISOString(),
        updatedAt: undefined
      }
      // If a root comment, update the sort data
      if (isReply) {
        // Update the parent comment replies list
        queryClient.setQueryData<Comment | undefined>(
          [QUERY_KEYS.comment, parentCommentId],
          (comment) =>
            ({
              ...comment,
              replyCount: (comment?.replyCount ?? 0) + 1,
              replies: [...(comment?.replies ?? []), newComment]
            } as Comment)
        )
      } else {
        queryClient.setQueryData<InfiniteData<ID[]>>(
          [QUERY_KEYS.trackCommentList, trackId, currentSort],
          (prevData) => {
            const newState = cloneDeep(prevData) ?? {
              pages: [],
              pageParams: [0]
            }
            newState.pages[0].unshift(newId)
            return newState
          }
        )
      }
      // Update the individual comment cache
      queryClient.setQueryData([QUERY_KEYS.comment, newId], newComment)

      // Add to the comment count
      addCommentCount(dispatch, queryClient, trackId)
    },
    onError: (error: Error, args) => {
      const { trackId, currentSort } = args
      reportToSentry({
        error,
        additionalInfo: args,
        name: 'Comments',
        feature: Feature.Comments
      })
      // Undo comment count change
      subtractCommentCount(dispatch, queryClient, trackId)
      // Toast generic error message
      toast({ content: messages.mutationError('posting') })
      // TODO: avoid hard reset here?
      queryClient.resetQueries({
        queryKey: [QUERY_KEYS.trackCommentList, trackId, currentSort]
      })
    }
  })
}

type ReactToCommentArgs = {
  commentId: ID
  userId: ID
  isLiked: boolean
  currentSort: CommentSortMethod
  trackId: ID
  isEntityOwner?: boolean
}
export const useReactToComment = () => {
  const { audiusSdk, reportToSentry } = useAudiusQueryContext()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()
  return useMutation({
    mutationFn: async ({
      userId,
      commentId,
      isLiked,
      trackId
    }: ReactToCommentArgs) => {
      const sdk = await audiusSdk()
      await sdk.comments.reactComment({ userId, commentId, isLiked, trackId })
    },
    mutationKey: ['reactToComment'],
    onMutate: async ({
      commentId,
      isLiked,
      isEntityOwner
    }: ReactToCommentArgs) => {
      const prevComment = queryClient.getQueryData<CommentOrReply | undefined>([
        QUERY_KEYS.comment,
        commentId
      ])
      // Optimistic update our cache
      queryClient.setQueryData<CommentOrReply | undefined>(
        [QUERY_KEYS.comment, commentId],
        (prevCommentState) =>
          ({
            ...prevCommentState,
            reactCount:
              (prevCommentState?.reactCount ?? 0) + (isLiked ? 1 : -1),
            isArtistReacted: isEntityOwner
              ? isLiked // If the artist is reacting, update the state accordingly
              : prevCommentState?.isArtistReacted, // otherwise, keep the previous state
            isCurrentUserReacted: isLiked
          } as CommentOrReply)
      )
      return { prevComment }
    },
    onError: (error: Error, args, context) => {
      const { commentId } = args
      reportToSentry({
        error,
        additionalInfo: args,
        name: 'Comments',
        feature: Feature.Comments
      })
      // Toast standard error message
      dispatch(toast({ content: messages.mutationError('reacting to') }))

      // note: context could be undefined if the onMutate threw before returning
      if (context) {
        const { prevComment } = context
        // Revert our optimistic cache change
        queryClient.setQueryData(
          [QUERY_KEYS.comment, commentId],
          (prevData: CommentOrReply | undefined) =>
            ({
              ...prevData,
              // NOTE: intentionally only reverting the pieces we changed in case another mutation happened between this mutation start->error
              reactCount: prevComment?.reactCount,
              isArtistReacted: prevComment?.isArtistReacted,
              isCurrentUserReacted: prevComment?.isCurrentUserReacted
            } as CommentOrReply)
        )
      }
    }
  })
}

type PinCommentArgs = {
  commentId: ID
  userId: ID
  isPinned: boolean
  trackId: ID
  currentSort: CommentSortMethod
  previousPinnedCommentId?: Nullable<ID>
}

export const usePinComment = () => {
  const { audiusSdk, reportToSentry } = useAudiusQueryContext()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()
  return useMutation({
    mutationFn: async (args: PinCommentArgs) => {
      const { userId, commentId, isPinned, trackId } = args
      const sdk = await audiusSdk()
      return await sdk.comments.pinComment({
        userId,
        entityId: commentId,
        trackId,
        isPin: isPinned
      })
    },
    onMutate: ({ commentId, isPinned, trackId, currentSort }) => {
      if (isPinned) {
        // Loop through the sort list and move the newly pinned comment
        queryClient.setQueryData<InfiniteData<ID[]>>(
          [QUERY_KEYS.trackCommentList, trackId, currentSort],
          (prevCommentData) => {
            const newCommentData = cloneDeep(prevCommentData) ?? {
              pages: [],
              pageParams: [0]
            }
            let commentPages = newCommentData.pages
            // Filter out the comment from its current page
            commentPages = commentPages.map((page: ID[]) =>
              page.filter((id: ID) => id !== commentId)
            )
            // Insert our pinned comment id at the top of page 0
            commentPages[0].unshift(commentId)
            newCommentData.pages = commentPages
            return newCommentData
          }
        )
      }

      dispatch(setPinnedCommentId(trackId, isPinned ? commentId : null))
    },
    onError: (error: Error, args) => {
      const { trackId, currentSort, previousPinnedCommentId } = args
      reportToSentry({
        error,
        additionalInfo: args,
        name: 'Comments',
        feature: Feature.Comments
      })
      // Toast standard error message
      dispatch(toast({ content: messages.mutationError('pinning') }))
      dispatch(setPinnedCommentId(trackId, previousPinnedCommentId ?? null))
      // Since this mutationx handles sort data, its difficult to undo the optimistic update so we just re-load everything
      queryClient.resetQueries({
        queryKey: [QUERY_KEYS.trackCommentList, trackId, currentSort]
      })
    }
  })
}

type DeleteCommentArgs = {
  commentId: ID
  userId: ID
  trackId: ID // track id
  currentSort: CommentSortMethod
  parentCommentId?: ID
}
export const useDeleteComment = () => {
  const { audiusSdk, reportToSentry } = useAudiusQueryContext()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()
  return useMutation({
    mutationFn: async ({ commentId, userId }: DeleteCommentArgs) => {
      const commentData = { userId, entityId: commentId }
      const sdk = await audiusSdk()
      return await sdk.comments.deleteComment(commentData)
    },
    onMutate: ({ commentId, trackId, currentSort, parentCommentId }) => {
      // Subtract from the comment count
      subtractCommentCount(dispatch, queryClient, trackId)
      // If reply, filter it from the parent's list of replies
      if (parentCommentId) {
        queryClient.setQueryData<Comment>(
          [QUERY_KEYS.comment, parentCommentId],
          (prev) =>
            ({
              ...prev,
              replies: (prev?.replies ?? []).filter(
                (reply: ReplyComment) => reply.id !== commentId
              ),
              replyCount: (prev?.replyCount ?? 0) - 1
            } as Comment)
        )
      } else {
        const existingCommentData = queryClient.getQueryData<
          CommentOrReply | undefined
        >([QUERY_KEYS.comment, commentId])
        const hasReplies =
          existingCommentData &&
          'replies' in existingCommentData &&
          (existingCommentData?.replies?.length ?? 0) > 0

        if (hasReplies) {
          queryClient.setQueryData<Comment>(
            [QUERY_KEYS.comment, commentId],
            (prevCommentData) =>
              ({
                ...prevCommentData,
                isTombstone: true,
                userId: undefined,
                message: '[Removed]'
                // Intentionally undoing the userId
              } as Comment & { userId?: undefined })
          )
        } else {
          // If not a reply & has no replies, remove from the sort list
          queryClient.setQueryData<InfiniteData<ID[]>>(
            [QUERY_KEYS.trackCommentList, trackId, currentSort],
            (prevCommentData) => {
              const newCommentData = cloneDeep(prevCommentData)
              if (!newCommentData) return
              // Filter out the comment from its current page
              newCommentData.pages = newCommentData.pages.map((page: ID[]) =>
                page.filter((id: ID) => id !== commentId)
              )
              return newCommentData
            }
          )
          // Remove the individual comment
          queryClient.removeQueries({
            queryKey: [QUERY_KEYS.comment, commentId],
            exact: true
          })
        }
      }
    },

    onError: (error: Error, args) => {
      const { trackId, currentSort } = args
      reportToSentry({
        error,
        additionalInfo: args,
        name: 'Comments',
        feature: Feature.Comments
      })
      // Undo the comment count change
      addCommentCount(dispatch, queryClient, trackId)
      // Toast standard error message
      dispatch(toast({ content: messages.mutationError('deleting') }))
      // Since this mutation handles sort data, its difficult to undo the optimistic update so we just re-load everything
      // TODO: avoid hard reset here by checking if cache changed?
      queryClient.resetQueries({
        queryKey: [QUERY_KEYS.trackCommentList, trackId, currentSort]
      })
    }
  })
}

type EditCommentArgs = {
  commentId: ID
  userId: ID
  newMessage: string
  mentions?: CommentMention[]
  trackId: ID
  currentSort: CommentSortMethod
  entityType?: EntityType
}
export const useEditComment = () => {
  const { audiusSdk, reportToSentry } = useAudiusQueryContext()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()
  return useMutation({
    mutationFn: async ({
      commentId,
      userId,
      newMessage,
      trackId,
      mentions,
      entityType = EntityType.TRACK
    }: EditCommentArgs) => {
      const commentData = {
        body: newMessage,
        userId,
        entityId: commentId,
        trackId,
        entityType,
        mentions: mentions?.map((mention) => mention.userId) ?? []
      }
      const sdk = await audiusSdk()
      await sdk.comments.editComment(commentData)
    },
    onMutate: ({ commentId, newMessage, mentions }) => {
      const prevComment = queryClient.getQueryData<CommentOrReply | undefined>([
        QUERY_KEYS.comment,
        commentId
      ])
      queryClient.setQueryData(
        [QUERY_KEYS.comment, commentId],
        (prevData: CommentOrReply | undefined) =>
          ({
            ...prevData,
            isEdited: true,
            message: newMessage,
            mentions
          } as CommentOrReply)
      )
      return { prevComment }
    },
    onError: (error: Error, args, context) => {
      const { commentId } = args
      reportToSentry({
        error,
        additionalInfo: args,
        name: 'Comments',
        feature: Feature.Comments
      })
      // Toast standard error message
      dispatch(toast({ content: messages.mutationError('editing') }))

      // Note: context could be undefined if the onMutate threw before returning
      if (context) {
        const { prevComment } = context
        // Revert our optimistic cache change
        queryClient.setQueryData(
          [QUERY_KEYS.comment, commentId],
          (prevData: CommentOrReply | undefined) =>
            ({
              ...prevData,
              // NOTE: intentionally only reverting the pieces we changed in case another mutation happened in between this mutation start->error
              isEdited: prevComment?.isEdited,
              message: prevComment?.message,
              mentions: prevComment?.mentions
            } as CommentOrReply)
        )
      }
    }
  })
}

type ReportCommentArgs = {
  commentId: ID
  parentCommentId?: ID
  userId: ID
  trackId: ID
  currentSort: CommentSortMethod
}
export const useReportComment = () => {
  const { audiusSdk, reportToSentry } = useAudiusQueryContext()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()
  return useMutation({
    mutationFn: async ({ userId, commentId }: ReportCommentArgs) => {
      const sdk = await audiusSdk()
      await sdk.comments.reportComment(userId, commentId)
    },
    onMutate: ({ trackId, commentId, currentSort, parentCommentId }) => {
      // Optimistic update - filter out the comment from either the top list or the parent comment's replies
      if (parentCommentId) {
        queryClient.setQueryData<Comment>(
          [QUERY_KEYS.comment, parentCommentId],
          (prevData: Comment | undefined) => {
            if (!prevData) return
            return {
              ...prevData,
              replies: prevData.replies?.filter(
                (reply: ReplyComment) => reply.id !== commentId
              ),
              replyCount: prevData.replyCount - 1
            } as Comment
          }
        )
      } else {
        queryClient.setQueryData<InfiniteData<ID[]>>(
          [QUERY_KEYS.trackCommentList, trackId, currentSort],
          (prevData) => {
            if (!prevData) return
            const newState = cloneDeep(prevData)
            // Filter out our reported comment
            newState.pages = newState.pages.map((page) =>
              page.filter((id) => id !== commentId)
            )
            return newState
          }
        )
      }

      queryClient.resetQueries({
        queryKey: [QUERY_KEYS.comment, commentId]
      })
      // Decrease the track comment count
      subtractCommentCount(dispatch, queryClient, trackId)
    },
    onError: (error: Error, args) => {
      const { trackId, currentSort } = args
      reportToSentry({
        error,
        additionalInfo: args,
        name: 'Comments',
        feature: Feature.Comments
      })
      // Generic toast error
      dispatch(toast({ content: messages.mutationError('reporting') }))

      // Undo the track comment count change
      addCommentCount(dispatch, queryClient, trackId)

      // Reload data
      queryClient.resetQueries({
        queryKey: [QUERY_KEYS.trackCommentList, trackId, currentSort]
      })
    }
  })
}

type MuteUserArgs = {
  mutedUserId: ID
  userId: ID
  isMuted: boolean
  trackId?: ID
  currentSort?: CommentSortMethod
}

export const useMuteUser = () => {
  const { audiusSdk, reportToSentry } = useAudiusQueryContext()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()

  return useMutation({
    mutationFn: async ({ userId, mutedUserId, isMuted }: MuteUserArgs) => {
      const sdk = await audiusSdk()
      await sdk.comments.muteUser(userId, mutedUserId, isMuted)
    },
    onMutate: ({ trackId, mutedUserId, currentSort }) => {
      // Optimistic update - filter out the comment
      if (trackId !== undefined && currentSort !== undefined) {
        queryClient.setQueryData<InfiniteData<ID[]>>(
          [QUERY_KEYS.trackCommentList, trackId, currentSort],
          (prevData) => {
            if (!prevData) return
            const newState = cloneDeep(prevData)
            // Filter out any comments by the muted user
            newState.pages = newState.pages.map((page) =>
              page.filter((id) => {
                const rootComment = queryClient.getQueryData<
                  Comment | undefined
                >([QUERY_KEYS.comment, id])
                if (!rootComment) return false
                // Check for any replies by our muted user first
                if (
                  rootComment.replies &&
                  (rootComment.replies.length ?? 0) > 0
                ) {
                  // Keep track of count
                  const prevReplyCount = rootComment.replies.length
                  // Filter out replies by the muted user
                  rootComment.replies = rootComment.replies.filter((reply) => {
                    if (reply.userId === mutedUserId) {
                      queryClient.resetQueries({
                        queryKey: [QUERY_KEYS.comment, reply.id]
                      })
                      return false
                    }
                    return true
                  })
                  // Subtract how many replies were removed from total reply count
                  // NOTE: remember that not all replies by the user may be showing due to pagination
                  rootComment.replyCount =
                    rootComment.replyCount -
                    (prevReplyCount - rootComment.replies.length)
                }

                // Finally if the root comment is by the muted user, remove it
                if (rootComment?.userId === mutedUserId) {
                  queryClient.resetQueries({
                    queryKey: [QUERY_KEYS.comment, rootComment.id]
                  })
                  return false
                }
                return true
              })
            )
            // Rather than track the comment count, we just trigger another query to get the new count (since we poll often anyways)
            queryClient.resetQueries({
              queryKey: [QUERY_KEYS.trackCommentCount, trackId]
            })
            return newState
          }
        )
      }
    },
    onError: (error: Error, args) => {
      const { trackId, currentSort } = args
      reportToSentry({
        error,
        additionalInfo: args,
        name: 'Comments',
        feature: Feature.Comments
      })
      // Generic toast error
      dispatch(toast({ content: messages.muteUserError }))

      // No way to know what comment count should be here, so we just reset the query data
      queryClient.resetQueries({
        queryKey: [QUERY_KEYS.trackCommentCount, trackId]
      })
      // Reload data
      queryClient.resetQueries({
        queryKey: [QUERY_KEYS.trackCommentList, trackId, currentSort]
      })
    }
  })
}

export const useGetTrackCommentNotificationSetting = (
  trackId: ID,
  currentUserId: Nullable<ID>
) => {
  const { audiusSdk } = useAudiusQueryContext()

  return useQuery({
    queryKey: [QUERY_KEYS.trackCommentNotificationSetting, trackId],
    queryFn: async () => {
      if (!currentUserId) return
      const sdk = await audiusSdk()
      return await sdk.tracks.trackCommentNotificationSetting({
        trackId: encodeHashId(trackId),
        userId: encodeHashId(currentUserId)
      })
    }
  })
}

type UpdateTrackCommentNotificationSettingArgs = {
  userId: ID
  trackId: ID
  action: EntityManagerAction.MUTE | EntityManagerAction.UNMUTE
}

export const useUpdateTrackCommentNotificationSetting = () => {
  const { audiusSdk, reportToSentry } = useAudiusQueryContext()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()

  return useMutation({
    mutationFn: async (args: UpdateTrackCommentNotificationSettingArgs) => {
      const { userId, trackId, action } = args
      const sdk = await audiusSdk()
      await sdk.comments.updateCommentNotificationSetting({
        userId,
        entityId: trackId,
        entityType: EntityType.TRACK,
        action
      })
    },
    onMutate: ({ trackId, action }) => {
      queryClient.setQueryData(
        [QUERY_KEYS.trackCommentNotificationSetting, trackId],
        () => ({ data: { isMuted: action === EntityManagerAction.MUTE } })
      )
    },
    onError: (error: Error, args) => {
      const { trackId } = args
      reportToSentry({
        error,
        additionalInfo: args,
        name: 'Comments',
        feature: Feature.Comments
      })
      dispatch(toast({ content: messages.muteUserError }))

      queryClient.resetQueries({
        queryKey: [QUERY_KEYS.trackCommentNotificationSetting, trackId]
      })
    }
  })
}

type UpdateCommentNotificationSettingArgs = {
  userId: ID
  commentId: ID
  action: EntityManagerAction.MUTE | EntityManagerAction.UNMUTE
}

export const useUpdateCommentNotificationSetting = () => {
  const { audiusSdk, reportToSentry } = useAudiusQueryContext()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()
  return useMutation({
    mutationFn: async (args: UpdateCommentNotificationSettingArgs) => {
      const { userId, commentId, action } = args
      const sdk = await audiusSdk()
      await sdk.comments.updateCommentNotificationSetting({
        userId,
        entityId: commentId,
        entityType: EntityType.COMMENT,
        action
      })
    },
    onMutate: ({ commentId, action }) => {
      queryClient.setQueryData([QUERY_KEYS.comment, commentId], (prevData) => {
        if (prevData) {
          return {
            ...prevData,
            isMuted: action === EntityManagerAction.MUTE
          }
        }
        return { isMuted: action === EntityManagerAction.MUTE }
      })
    },
    onError: (error: Error, args) => {
      const { commentId } = args
      reportToSentry({
        error,
        additionalInfo: args,
        name: 'Comments',
        feature: Feature.Comments
      })
      dispatch(
        toast({ content: messages.updateCommentNotificationSettingError })
      )
      queryClient.resetQueries({
        queryKey: [QUERY_KEYS.comment, commentId]
      })
    }
  })
}
