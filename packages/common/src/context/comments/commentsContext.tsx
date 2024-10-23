/* eslint-disable no-console */
import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState
} from 'react'

import {
  EntityType,
  TrackCommentsSortMethodEnum as CommentSortMethod
} from '@audius/sdk'
import { useQueryClient } from '@tanstack/react-query'
import { useDispatch, useSelector } from 'react-redux'

import {
  useGetTrackById,
  useGetCommentsByTrackId,
  QUERY_KEYS,
  useTrackCommentCount,
  resetPreviousCommentCount
} from '~/api'
import { useGatedContentAccess } from '~/hooks'
import {
  ModalSource,
  ID,
  Comment,
  ReplyComment,
  UserTrackMetadata
} from '~/models'
import { getUserId } from '~/store/account/selectors'
import { tracksActions } from '~/store/pages/track/lineup/actions'
import { getLineup } from '~/store/pages/track/selectors'
import { seek } from '~/store/player/slice'
import { PurchaseableContentType } from '~/store/purchase-content/types'
import { usePremiumContentPurchaseModal } from '~/store/ui/modals/premium-content-purchase-modal'
import { Nullable } from '~/utils'

type CommentSectionProviderProps<NavigationProp> = {
  entityId: ID
  entityType?: EntityType.TRACK

  // These are optional because they are only used on mobile
  // and provided for the components in CommentDrawer
  // TODO: maybe use a discriminated union for mobile/desktop type
  replyingAndEditingState?: ReplyingAndEditingState
  setReplyingAndEditingState?: (
    state: ReplyingAndEditingState | undefined
  ) => void
  navigation?: NavigationProp
  closeDrawer?: () => void
}

export type ReplyingAndEditingState = {
  replyingToComment?: Comment | ReplyComment
  // This can be different from replyingToComment if we are replying to a reply
  replyingToCommentId?: ID
  editingComment?: Comment | ReplyComment
}

type CommentSectionContextType<NavigationProp> = {
  currentUserId: Nullable<ID>
  artistId: ID
  isEntityOwner: boolean
  commentCount: number | undefined
  track: UserTrackMetadata
  playTrack: (timestampSeconds?: number) => void
  commentSectionLoading: boolean
  commentIds: ID[]
  currentSort: CommentSortMethod
  isLoadingMorePages: boolean
  hasMorePages: boolean
  resetComments: () => void
  setCurrentSort: (sort: CommentSortMethod) => void
  loadMorePages: () => void
  hasNewComments: boolean
  isCommentCountLoading: boolean
} & CommentSectionProviderProps<NavigationProp>

export const CommentSectionContext = createContext<
  CommentSectionContextType<any> | undefined
>(undefined)

export function CommentSectionProvider<NavigationProp>(
  props: PropsWithChildren<CommentSectionProviderProps<NavigationProp>>
) {
  const {
    entityId,
    entityType = EntityType.TRACK,
    children,
    replyingAndEditingState,
    setReplyingAndEditingState,
    navigation,
    closeDrawer
  } = props
  const { data: track } = useGetTrackById({ id: entityId })

  const [currentSort, setCurrentSort] = useState<CommentSortMethod>(
    CommentSortMethod.Top
  )
  const handleSetCurrentSort = (sortMethod: CommentSortMethod) => {
    resetPreviousCommentCount(queryClient, entityId)
    queryClient.resetQueries({ queryKey: [QUERY_KEYS.trackCommentList] })
    setCurrentSort(sortMethod)
  }

  const currentUserId = useSelector(getUserId)
  const {
    data: commentIds = [],
    status,
    isFetching,
    hasNextPage,
    fetchNextPage: loadMorePages,
    isFetchingNextPage: isLoadingMorePages
  } = useGetCommentsByTrackId({
    trackId: entityId,
    sortMethod: currentSort,
    userId: currentUserId
  })
  const queryClient = useQueryClient()
  // hard refreshes all data
  const resetComments = () => {
    // Reset our comment count since we're reloading comments again - aka can hide the "new comments" button
    resetPreviousCommentCount(queryClient, entityId)
    queryClient.resetQueries({ queryKey: [QUERY_KEYS.trackCommentList] })
    queryClient.resetQueries({ queryKey: [QUERY_KEYS.comment] })
    queryClient.resetQueries({ queryKey: [QUERY_KEYS.commentReplies] })
  }

  const { data: commentCountData, isLoading: isCommentCountLoading } =
    useTrackCommentCount(entityId, currentUserId, true)

  const hasNewComments = () =>
    commentCountData?.previousValue !== undefined &&
    commentCountData?.currentValue !== undefined &&
    commentCountData?.previousValue < commentCountData?.currentValue

  const dispatch = useDispatch()

  const lineup = useSelector(getLineup)

  const { hasStreamAccess } = useGatedContentAccess(track!)

  const { onOpen: openPremiumContentPurchaseModal } =
    usePremiumContentPurchaseModal()

  const playTrack = useCallback(
    (timestampSeconds?: number) => {
      const uid = lineup?.entries?.[0]?.uid

      // If a timestamp is provided, we should seek to that timestamp
      if (timestampSeconds !== undefined) {
        // But only if the user has access to the stream
        if (!hasStreamAccess) {
          const { track_id: trackId } = track!
          openPremiumContentPurchaseModal(
            { contentId: trackId, contentType: PurchaseableContentType.TRACK },
            {
              source: ModalSource.Comment
            }
          )
        } else {
          dispatch(tracksActions.play(uid))
          setTimeout(() => dispatch(seek({ seconds: timestampSeconds })), 100)
        }
      } else {
        dispatch(tracksActions.play(uid))
      }
    },
    [
      dispatch,
      hasStreamAccess,
      lineup?.entries,
      openPremiumContentPurchaseModal,
      track
    ]
  )

  const commentSectionLoading =
    (status === 'loading' || isFetching) && !isLoadingMorePages

  if (!track) {
    return null
  }

  const { owner_id } = track

  return (
    <CommentSectionContext.Provider
      value={{
        currentUserId,
        artistId: owner_id,
        entityId,
        entityType,
        commentCount: commentCountData?.currentValue ?? track.comment_count,
        isCommentCountLoading,
        commentIds,
        commentSectionLoading,
        isEntityOwner: currentUserId === owner_id,
        isLoadingMorePages,
        track,
        resetComments,
        hasMorePages: !!hasNextPage,
        currentSort,
        replyingAndEditingState,
        setReplyingAndEditingState,
        setCurrentSort: handleSetCurrentSort,
        playTrack,
        loadMorePages,
        navigation,
        closeDrawer,
        hasNewComments
      }}
    >
      {children}
    </CommentSectionContext.Provider>
  )
}

export const useCurrentCommentSection = () => {
  const context = useContext(CommentSectionContext)

  if (!context) {
    throw new Error(
      'useCurrentCommentSection must be used within a CommentSectionProvider'
    )
  }

  return context
}
