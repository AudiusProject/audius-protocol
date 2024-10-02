import {
  TrackCommentsSortMethodEnum as CommentSortMethod,
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

import {
  commentFromSDK,
  replyCommentFromSDK,
  transformAndCleanList
} from '~/adapters'
import { useAudiusQueryContext } from '~/audius-query'
import { Comment, ID, ReplyComment } from '~/models'
import { toast } from '~/store/ui/toast/slice'
import { encodeHashId } from '~/utils'

type CommentOrReply = Comment | ReplyComment

const QUERY_KEYS = {
  trackCommentList: 'trackCommentList',
  comment: 'comment',
  replies: 'replies'
} as const

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
  ) => `There was an error ${actionType} that comment. Please try again`
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
  pageSize = 5
}: GetCommentsByTrackArgs) => {
  const { audiusSdk, reportToSentry } = useAudiusQueryContext()
  const isMutating = useIsMutating()
  const queryClient = useQueryClient()
  const queryRes = useInfiniteQuery({
    enabled: !!userId && !!trackId && isMutating === 0,
    getNextPageParam: (lastPage: ID[], pages) => {
      if (lastPage?.length < pageSize) return undefined
      return (pages.length ?? 0) * pageSize
    },
    queryKey: [QUERY_KEYS.trackCommentList, trackId, sortMethod],
    queryFn: async ({ pageParam: currentPage = 0 }): Promise<ID[]> => {
      const sdk = await audiusSdk()
      const commentsRes = await sdk.tracks.trackComments({
        trackId: encodeHashId(trackId),
        offset: currentPage,
        limit: pageSize,
        sortMethod,
        userId: userId?.toString() ?? undefined
      })
      const commentList = transformAndCleanList(
        commentsRes.data,
        commentFromSDK
      )

      // Populate individual comment cache
      commentList.forEach((comment) => {
        queryClient.setQueryData([QUERY_KEYS.comment, comment.id], comment)
        comment?.replies?.forEach?.((reply) =>
          queryClient.setQueryData([QUERY_KEYS.comment, reply.id], reply)
        )
      })
      // For the comment list cache, we only store the ids of the comments (organized by sort method)
      return commentList.map((comment) => comment.id)
    },
    onError: (error: Error) => {
      reportToSentry({
        error,
        name: 'Comments'
      })
      toast({ content: messages.loadError('replies') })
    },
    staleTime: Infinity, // Stale time is set to infinity so that we never reload data thats currently shown on screen (because sorting could have changed)
    cacheTime: 1 // Cache time is set to 1 so that the data is cleared any time we leave the page viewing it or change sorts
  })
  return { ...queryRes, data: queryRes.data?.pages?.flat() ?? [] }
}

export const useGetCommentById = (commentId: ID) => {
  const { reportToSentry } = useAudiusQueryContext()
  const queryClient = useQueryClient()
  return useQuery([QUERY_KEYS.comment, commentId], {
    enabled: !!commentId,
    queryFn: async (): Promise<CommentOrReply | {}> => {
      // TODO: there's no backend implementation of this fetch at the moment;
      // but we also never expect to call the backend here; we always prepopulate the data from the fetch by tracks method
      return queryClient.getQueryData([QUERY_KEYS.comment, commentId]) ?? {}
    },
    onError: (error: Error) => {
      reportToSentry({
        error,
        name: 'Comments'
      })
      toast({ content: messages.loadError('comments') })
    },
    staleTime: Infinity
  })
}

type GetRepliesArgs = {
  commentId: ID
  enabled?: boolean
  pageSize?: number
}
export const useGetCommentRepliesById = ({
  commentId,
  enabled,
  pageSize = 3
}: GetRepliesArgs) => {
  const { audiusSdk, reportToSentry } = useAudiusQueryContext()
  const queryClient = useQueryClient()

  const queryRes = useInfiniteQuery(
    [QUERY_KEYS.comment, commentId, QUERY_KEYS.replies],
    {
      enabled: !!enabled,
      getNextPageParam: (lastPage: ReplyComment[], pages) => {
        if (lastPage?.length < pageSize) return undefined
        return (pages.length ?? 0) * pageSize
      },
      queryFn: async ({
        pageParam: currentPage = 1
      }): Promise<ReplyComment[]> => {
        const sdk = await audiusSdk()
        const commentsRes = await sdk.comments.getCommentReplies({
          commentId: encodeHashId(commentId),
          limit: pageSize,
          offset: currentPage
        })
        const replyList = transformAndCleanList(
          commentsRes?.data,
          replyCommentFromSDK
        )
        // Add the replies to our parent comment replies list
        queryClient.setQueryData(
          [QUERY_KEYS.comment, commentId],
          (comment: Comment | undefined) =>
            ({
              ...comment,
              replyCount: (comment?.replyCount ?? 0) + 1,
              replies: [...(comment?.replies ?? []), ...replyList]
            } as Comment)
        )
        // Put each reply into their individual comment cache
        replyList.forEach((comment) => {
          queryClient.setQueryData([QUERY_KEYS.comment, comment.id], comment)
        })
        return replyList
      },
      onError: (error: Error) => {
        reportToSentry({
          error,
          name: 'Comments'
        })
        toast({ content: messages.loadError('replies') })
      },
      staleTime: Infinity
    }
  )
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
  mentions?: any
  newId?: ID
}

export const usePostComment = () => {
  const { audiusSdk, reportToSentry } = useAudiusQueryContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (args: PostCommentArgs) => {
      const sdk = await audiusSdk()
      return await sdk.comments.postComment({
        ...args,
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
        currentSort
      } = args
      const isReply = parentCommentId !== undefined
      // This executes before the mutationFn is called, and the reference to comment is the same in both
      // therefore, this sets the id that will be posted to the server
      const newId = Math.floor(Math.random() * 1000000) // TODO: need to request an unused id instead of a random number
      // hack alert: there is no way to send context from onMutate to mutationFn so we hack it into the args
      args.newId = newId
      const newComment: Comment = {
        id: newId,
        userId,
        message: body,
        isPinned: false,
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
    },
    onError: (error: Error, args) => {
      const { trackId, currentSort } = args
      reportToSentry({
        error,
        additionalInfo: args,
        name: 'Comments'
      })
      // Toast generic error message
      toast({ content: messages.mutationError('posting') })
      // TODO: avoid hard reset here?
      queryClient.resetQueries([
        QUERY_KEYS.trackCommentList,
        trackId,
        currentSort
      ])
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
    mutationFn: async ({ userId, commentId, isLiked }: ReactToCommentArgs) => {
      const sdk = await audiusSdk()
      await sdk.comments.reactComment(userId, commentId, isLiked)
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
            isArtistReacted: isEntityOwner && isLiked,
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
        name: 'Comments'
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
}
export const usePinComment = () => {
  const { audiusSdk, reportToSentry } = useAudiusQueryContext()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()
  return useMutation({
    mutationFn: async ({ userId, commentId, isPinned }: PinCommentArgs) => {
      const sdk = await audiusSdk()
      return await sdk.comments.pinComment(userId, commentId, isPinned)
    },
    onMutate: ({ commentId, isPinned, trackId, currentSort }) => {
      if (isPinned) {
        // Un-pin the current top comment (if it's already not pinned nothing changes)
        const commentData = queryClient.getQueryData<InfiniteData<ID[]>>([
          QUERY_KEYS.trackCommentList,
          trackId,
          currentSort
        ])
        // if we somehow hit an empty cache this will be undefined
        if (commentData === undefined) return
        const prevTopCommentId = commentData.pages[0][0]
        // If we're pinning the comment at the top already, no need to do anything
        if (prevTopCommentId === commentId) return

        queryClient.setQueryData<CommentOrReply | undefined>(
          [QUERY_KEYS.comment, prevTopCommentId],
          (prevCommentState) =>
            ({
              ...prevCommentState,
              isPinned: false
            } as CommentOrReply)
        )

        // Loop through the sort list and move hte newly pinned comment
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
      // Finally - update our individual comment
      queryClient.setQueryData(
        [QUERY_KEYS.comment, commentId],
        (prevCommentState: CommentOrReply | undefined) =>
          ({
            ...prevCommentState,
            isPinned
          } as CommentOrReply)
      )
    },
    onError: (error: Error, args) => {
      const { trackId, currentSort, commentId, isPinned } = args
      reportToSentry({
        error,
        additionalInfo: args,
        name: 'Comments'
      })
      // Toast standard error message
      dispatch(toast({ content: messages.mutationError('pinning') }))
      // Since this mutationx handles sort data, its difficult to undo the optimistic update so we just re-load everything
      // Revert our optimistic cache change
      queryClient.setQueryData(
        [QUERY_KEYS.comment, commentId],
        (prevCommentState: CommentOrReply | undefined) =>
          ({
            ...prevCommentState,
            isPinned: !isPinned
          } as CommentOrReply)
      )
      // TODO: avoid hard reset here?
      queryClient.resetQueries([
        QUERY_KEYS.trackCommentList,
        trackId,
        currentSort
      ])
    }
  })
}

type DeleteCommentArgs = {
  commentId: ID
  userId: ID
  trackId: ID // track id
  currentSort: CommentSortMethod
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
    onMutate: ({ commentId, trackId, currentSort }) => {
      // Remove the individual comment from the cache
      queryClient.removeQueries({
        queryKey: [QUERY_KEYS.comment, commentId],
        exact: true
      })
      // Remove the comment from the current sort
      queryClient.setQueryData(
        [QUERY_KEYS.trackCommentList, trackId, currentSort],
        // @ts-ignore TODO: clean up types here
        (prevCommentData: { pages: ID[][] } & any) => {
          const newCommentData = cloneDeep(prevCommentData)
          // Filter out the comment from its current page
          newCommentData.pages = newCommentData.pages.map((page: ID[]) =>
            page.filter((id: ID) => id !== commentId)
          )
          return newCommentData
        }
      )
    },
    onError: (error: Error, args) => {
      const { trackId, currentSort } = args
      reportToSentry({
        error,
        additionalInfo: args,
        name: 'Comments'
      })
      // Toast standard error message
      dispatch(toast({ content: messages.mutationError('deleting') }))
      // Since this mutation handles sort data, its difficult to undo the optimistic update so we just re-load everything
      // TODO: avoid hard reset here by checking if cache changed?
      queryClient.resetQueries([
        QUERY_KEYS.trackCommentList,
        trackId,
        currentSort
      ])
    }
  })
}

type EditCommentArgs = {
  commentId: ID
  userId: ID
  newMessage: string
  mentions?: ID[]
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
      mentions,
      entityType = EntityType.TRACK
    }: EditCommentArgs) => {
      const commentData = {
        body: newMessage,
        userId,
        entityId: commentId,
        entityType,
        mentions
      }
      const sdk = await audiusSdk()
      await sdk.comments.editComment(commentData)
    },
    onMutate: ({ commentId, newMessage }) => {
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
            message: newMessage
          } as CommentOrReply)
      )
      return { prevComment }
    },
    onError: (error: Error, args, context) => {
      const { commentId } = args
      reportToSentry({
        error,
        additionalInfo: args,
        name: 'Comments'
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
              message: prevComment?.message
            } as CommentOrReply)
        )
      }
    }
  })
}

type ReportCommentArgs = {
  commentId: ID
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
    onMutate: ({ trackId, commentId, currentSort }) => {
      // Optimistic update - filter out the comment
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
      queryClient.resetQueries([QUERY_KEYS.comment, commentId])
    },
    onError: (error: Error, args) => {
      const { trackId, currentSort } = args
      reportToSentry({
        error,
        additionalInfo: args,
        name: 'Comments'
      })
      // Generic toast error
      dispatch(toast({ content: messages.mutationError('reporting') }))

      // Reload data
      queryClient.resetQueries([
        QUERY_KEYS.trackCommentList,
        trackId,
        currentSort
      ])
    }
  })
}
