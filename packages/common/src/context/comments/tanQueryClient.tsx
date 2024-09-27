import { useContext } from 'react'

import {
  CommentMetadata,
  TrackCommentsSortMethodEnum as CommentSortMethod,
  EntityType
} from '@audius/sdk'
import {
  QueryClient,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient
} from '@tanstack/react-query'
import { capitalize, cloneDeep } from 'lodash'

import { commentFromSDK, transformAndCleanList } from '~/adapters'
import { AudiusQueryContext } from '~/audius-query'
import { Comment, ID, ReplyComment } from '~/models'
import { encodeHashId } from '~/utils'

// Create a client
export const queryClient = new QueryClient()

const QUERY_KEYS = {
  trackCommentList: 'trackCommentList',
  comment: 'comment',
  replies: 'replies'
} as const

/**
 *
 * QUERIES
 *
 */

export const useGetCommentsByTrackId = ({
  trackId,
  userId,
  sortMethod,
  pageSize = 5
}: {
  trackId: ID
  userId: ID | null
  sortMethod: CommentSortMethod
  pageSize?: number
}) => {
  const { audiusSdk } = useContext(AudiusQueryContext)
  const queryClient = useQueryClient()
  const queryRes = useInfiniteQuery({
    enabled: !!userId || !!trackId,
    getNextPageParam: (lastPage: any[], pages) => {
      if (lastPage?.length < pageSize) return undefined
      return (pages.length ?? 0) * pageSize
    },
    queryKey: [QUERY_KEYS.trackCommentList, trackId, sortMethod],
    queryFn: async ({ pageParam = 0 }) => {
      const sdk = await audiusSdk()
      const commentsRes = await sdk.tracks.trackComments({
        trackId: encodeHashId(trackId),
        offset: pageParam,
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
      })
      // For the comment list cache, we only store the ids of the comments (organized by sort method)
      return commentList.map((comment) => comment.id)
    },
    // TODO: whats the right vibe for these
    staleTime: 120000,
    cacheTime: 120000
  })
  return { ...queryRes, data: queryRes.data?.pages?.flat() ?? [] }
}

export const useGetCommentById = (commentId: ID) => {
  return useQuery([QUERY_KEYS.comment, commentId], {
    enabled: !!commentId,
    queryFn: async () => {
      // TODO: there's no backend implementation of this fetch at the moment;
      // but we also never expect to call the backend here; we always prepopulate the data from the fetch by tracks method
      return queryClient.getQueryData([QUERY_KEYS.comment, commentId])
    },
    // TODO: whats the right vibe for these
    staleTime: 120000,
    cacheTime: 120000
  })
}

type GetRepliesArgs = {
  id: ID
  limit?: number
  offset?: number
}
// export const useGetCommentRepliesById = (commentId: ID) => {
//   const { audiusSdk } = useContext(AudiusQueryContext)
//   return useInfiniteQuery([QUERY_KEYS.comment, commentId, QUERY_KEYS.replies], {
//     queryFn: async ({ id, limit, offset }: GetRepliesArgs) => {
//       const sdk = await audiusSdk()
//       const commentsRes = await sdk.comments.getCommentReplies({
//         commentId: encodeHashId(id),
//         limit,
//         offset
//       })
//       return transformAndCleanList(commentsRes?.data, replyCommentFromSDK)
//     }
//   })
// }

/**
 *
 * MUTATIONS
 *
 */
type PostCommentArgs = {
  userId: ID
  entityId: ID
  entityType: EntityType
  body: string
  parentCommentId?: ID
  trackTimestampS?: number
  mentions?: any
}

export const usePostComment = () => {
  const { audiusSdk } = useContext(AudiusQueryContext)

  return useMutation({
    mutationFn: async (args: PostCommentArgs) => {
      const sdk = await audiusSdk()
      // @ts-ignore
      return await sdk.comments.postComment({ ...args, commentId: args.newId })
    },
    onMutate: async (args: PostCommentArgs) => {
      const { userId, body, entityId, trackTimestampS } = args
      // This executes before the mutationFn is called, and the reference to comment is the same in both
      // therefore, this sets the id that will be posted to the server
      const newId = Math.floor(Math.random() * 1000000) // TODO: need to request an unused id instead of a random number
      // @ts-ignore - TODO: a bit jank but we mutate the args object in order to pass this into mutationFn
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
      // Snapshot the previous value
      const previousCommentList = queryClient.getQueryData([
        QUERY_KEYS.trackCommentList
      ])
      // Update the list of comments
      queryClient.setQueryData(
        [QUERY_KEYS.trackCommentList, entityId],
        // TODO: type thi
        (prevData: any) => {
          const newState = cloneDeep(prevData)
          newState.pages[0].unshift(newComment)
          return newState
        }
      )
      // Update the individual comment cache
      queryClient.setQueryData([QUERY_KEYS.comment, newId], newComment)

      // Return the prev state, this can be used to roll back in an error event
      return { previousCommentList, newId }
    },
    onError: (_err, { entityId }, context) => {
      if (!context?.previousCommentList) return
      // Roll back to the previous state
      queryClient.setQueryData(
        [QUERY_KEYS.trackCommentList, entityId],
        context.previousCommentList
      )
    }
  })
}

type ReactToCommentArgs = {
  commentId: ID
  userId: ID
  isLiked: boolean
  isEntityOwner?: boolean
}
export const useReactToComment = () => {
  const { audiusSdk } = useContext(AudiusQueryContext)
  return useMutation({
    mutationFn: async ({ userId, commentId, isLiked }: ReactToCommentArgs) => {
      const sdk = await audiusSdk()
      await sdk.comments.reactComment(userId, commentId, isLiked)
    },
    onMutate: async ({
      commentId,
      isLiked,
      isEntityOwner
    }: ReactToCommentArgs) => {
      queryClient.setQueryData(
        [QUERY_KEYS.comment, commentId],
        // TODO: ts here?
        // @ts-ignore
        (prevCommentState: Comment | ReplyComment) => ({
          ...prevCommentState,
          reactCount: (prevCommentState?.reactCount ?? 0) + (isLiked ? 1 : -1),
          isArtistReacted: isEntityOwner && isLiked,
          isCurrentUserReacted: isLiked
        })
      )
    }
  })
}

type PinCommentArgs = {
  commentId: ID
  userId: ID
  isPinned: boolean
  trackId: ID
}
export const usePinComment = () => {
  const { audiusSdk } = useContext(AudiusQueryContext)
  return useMutation({
    mutationFn: async ({ userId, commentId, isPinned }: PinCommentArgs) => {
      const sdk = await audiusSdk()
      return await sdk.comments.pinComment(userId, commentId, isPinned)
    },
    onMutate: ({ commentId, isPinned, trackId }) => {
      // If we pinned a new comment, we need to optimistically update all of our sort data
      if (isPinned) {
        const updateSortData = (sortMethod: CommentSortMethod) => {
          // Un-pin the current top comment (if it's already not pinned nothing changes)
          const commentData = queryClient.getQueryData([
            QUERY_KEYS.trackCommentList,
            trackId,
            sortMethod
          ])
          // cant optimistically update data that isnt loaded yet
          if (commentData === undefined) return
          // @ts-ignore - TODO: clean up types here
          const prevTopCommentId = commentData?.pages?.[0]?.[0]
          // If we're pinning the comment at the top already, no need to do anything
          if (prevTopCommentId === commentId) return

          queryClient.setQueryData(
            [QUERY_KEYS.comment, prevTopCommentId],
            // @ts-ignore - TODO: clean up types here, idk whats going on
            (prevCommentState: Comment | ReplyComment) => ({
              ...prevCommentState,
              isPinned: false
            })
          )

          queryClient.setQueryData(
            [QUERY_KEYS.trackCommentList, trackId, sortMethod],
            // @ts-ignore TODO: clean up types here
            (prevCommentData: { pages: ID[][] } & any) => {
              const newCommentData = cloneDeep(prevCommentData)
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
        // NOTE: Top will always be loaded since its the default sort
        updateSortData(CommentSortMethod.Top)
        updateSortData(CommentSortMethod.Newest)
        updateSortData(CommentSortMethod.Timestamp)
      }
      // Finally - update our individual comment
      queryClient.setQueryData(
        [QUERY_KEYS.comment, commentId],
        // @ts-ignore - TODO: clean up types here, idk whats going on
        (prevCommentState: Comment | ReplyComment) => ({
          ...prevCommentState,
          isPinned
        })
      )
    }
  })
}

type DeleteCommentArgs = { commentId: ID; userId: ID; entityId: ID }

export const useDeleteComment = () => {
  const { audiusSdk } = useContext(AudiusQueryContext)
  return useMutation({
    mutationFn: async ({ commentId, userId, entityId }: DeleteCommentArgs) => {
      const commentData = { userId, entityId: commentId }
      const sdk = await audiusSdk()
      return await sdk.comments.deleteComment(commentData)
    },
    onMutate: ({ commentId, entityId }) => {
      // Remove the individual comment
      queryClient.removeQueries({
        queryKey: [QUERY_KEYS.comment, commentId],
        exact: true
      })
      // Remove the comment from the sorted lists
      Object.values(CommentSortMethod).forEach(
        (sortMethod: CommentSortMethod) => {
          // Check for sort method data that hasn't been loaded yet; skip these
          if (
            queryClient.getQueryData([
              QUERY_KEYS.trackCommentList,
              entityId,
              sortMethod
            ]) === undefined
          ) {
            return
          }
          // If sort data is present, we filter out our comment
          queryClient.setQueryData(
            [QUERY_KEYS.trackCommentList, entityId, sortMethod],
            // @ts-ignore TODO: clean up types here
            (prevCommentData: { pages: ID[][] } & any) => {
              console.log({ sortMethod })
              const newCommentData = cloneDeep(prevCommentData)
              // Filter out the comment from its current page
              newCommentData.pages = newCommentData.pages.map((page: ID[]) =>
                page.filter((id: ID) => id === commentId)
              )
              return newCommentData
            }
          )
        }
      )
    }
  })
}
