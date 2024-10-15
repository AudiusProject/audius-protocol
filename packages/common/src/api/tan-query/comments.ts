import {
  TrackCommentsSortMethodEnum as CommentSortMethod,
  EntityManagerAction,
  EntityType
} from '@audius/sdk'
import {
  InfiniteData,
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
import {
  incrementTrackCommentCount,
  setPinnedCommentId
} from '~/store/cache/tracks/actions'
import { toast } from '~/store/ui/toast/slice'
import { encodeHashId, Nullable } from '~/utils'

import { QUERY_KEYS } from './queryKeys'

type CommentOrReply = Comment | ReplyComment

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
  pageSize = 5
}: GetCommentsByTrackArgs) => {
  const { audiusSdk, reportToSentry } = useAudiusQueryContext()
  const isMutating = useIsMutating()
  const queryClient = useQueryClient()
  const queryRes = useInfiniteQuery({
    enabled: !!trackId && isMutating === 0,
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
        // TODO: why is this toString instead of encode
        userId: userId?.toString() ?? undefined
      })
      const commentList = transformAndCleanList(
        commentsRes.data,
        commentFromSDK
      )

      // Populate individual comment cache
      commentList.forEach((comment) => {
        queryClient.setQueryData([QUERY_KEYS.comment, comment.id], comment)
        comment?.replies?.forEach?.((reply: ReplyComment) =>
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
      toast({ content: messages.loadError('comments') })
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
    [QUERY_KEYS.comment, commentId, QUERY_KEYS.commentReplies],
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
  const dispatch = useDispatch()

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
      const sdk = await audiusSdk()
      const newId = await sdk.comments.generateCommentId()
      // hack alert: there is no way to send context from onMutate to mutationFn so we hack it into the args
      args.newId = newId
      const newComment: Comment = {
        id: newId,
        userId,
        message: body,
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
      // Update the track comment count (separate cache)
      dispatch(incrementTrackCommentCount(trackId, 1))
    },
    onError: (error: Error, args) => {
      const { trackId, currentSort } = args
      reportToSentry({
        error,
        additionalInfo: args,
        name: 'Comments'
      })
      // Undo comment count change
      dispatch(incrementTrackCommentCount(trackId, -1))
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
        name: 'Comments'
      })
      // Toast standard error message
      dispatch(toast({ content: messages.mutationError('pinning') }))
      dispatch(setPinnedCommentId(trackId, previousPinnedCommentId ?? null))
      // Since this mutationx handles sort data, its difficult to undo the optimistic update so we just re-load everything
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
      // If reply, filter it from the parent's list of replies
      if (parentCommentId) {
        queryClient.setQueryData<Comment>(
          [QUERY_KEYS.comment, parentCommentId],
          (prev) =>
            ({
              ...prev,
              replies: (prev?.replies ?? []).filter(
                (reply) => reply.id !== commentId
              ),
              replyCount: (prev?.replyCount ?? 0) - 1
            } as Comment)
        )
      }
      // If not a reply, remove from the sort list
      queryClient.setQueryData<InfiniteData<ID[]>>(
        [QUERY_KEYS.trackCommentList, trackId, currentSort],
        (prevCommentData) => {
          const newCommentData = cloneDeep(prevCommentData)
          if (!newCommentData) return
          // Filter out the comment from itsz current page
          newCommentData.pages = newCommentData.pages.map((page: ID[]) =>
            page.filter((id: ID) => id !== commentId)
          )
          return newCommentData
        }
      )
      // Undo comment count change
      dispatch(incrementTrackCommentCount(trackId, 1))
    },
    onSuccess: (_res, { commentId }) => {
      // We can safely wait till success to remove the individual comment from the cache because once its out of the sort or reply lists its not rendered anymore
      queryClient.removeQueries({
        queryKey: [QUERY_KEYS.comment, commentId],
        exact: true
      })
    },
    onError: (error: Error, args) => {
      const { trackId, currentSort } = args
      reportToSentry({
        error,
        additionalInfo: args,
        name: 'Comments'
      })
      // Undo comment count change
      dispatch(incrementTrackCommentCount(trackId, 1))
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
                      queryClient.resetQueries([QUERY_KEYS.comment, reply.id])
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
                  queryClient.resetQueries([QUERY_KEYS.comment, rootComment.id])
                  return false
                }
                return true
              })
            )
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
        name: 'Comments'
      })
      // Generic toast error
      dispatch(toast({ content: messages.muteUserError }))

      // Reload data
      queryClient.resetQueries([
        QUERY_KEYS.trackCommentList,
        trackId,
        currentSort
      ])
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
        name: 'Comments'
      })
      dispatch(toast({ content: messages.muteUserError }))

      queryClient.resetQueries([
        QUERY_KEYS.trackCommentNotificationSetting,
        trackId
      ])
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
        name: 'Comments'
      })
      dispatch(
        toast({ content: messages.updateCommentNotificationSettingError })
      )
      queryClient.resetQueries([QUERY_KEYS.comment, commentId])
    }
  })
}
