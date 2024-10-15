/* eslint-disable no-console */
import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useState
} from 'react'

import {
  EntityType,
  TrackCommentsSortMethodEnum as CommentSortMethod
} from '@audius/sdk'
import type { NavigationProp } from '@react-navigation/native'
import { useQueryClient } from '@tanstack/react-query'
import { useDispatch, useSelector } from 'react-redux'

import {
  useGetCurrentUserId,
  useGetTrackById,
  useGetCommentsByTrackId,
  QUERY_KEYS
} from '~/api'
import { useGatedContentAccess } from '~/hooks'
import {
  ModalSource,
  ID,
  Comment,
  ReplyComment,
  UserTrackMetadata
} from '~/models'
import { tracksActions } from '~/store/pages/track/lineup/actions'
import { getLineup } from '~/store/pages/track/selectors'
import { seek } from '~/store/player/slice'
import { PurchaseableContentType } from '~/store/purchase-content/types'
import { usePremiumContentPurchaseModal } from '~/store/ui/modals/premium-content-purchase-modal'
import { Nullable } from '~/utils'

type CommentSectionProviderProps = {
  entityId: ID
  entityType?: EntityType.TRACK

  // These are optional because they are only used on mobile
  // and provided for the components in CommentDrawer
  // TODO: maybe use a discriminated union for mobile/desktop type
  replyingAndEditingState?: ReplyingAndEditingState
  setReplyingAndEditingState?: (
    state: ReplyingAndEditingState | undefined
  ) => void
  navigation?: NavigationProp<ReactNavigation.RootParamList>
  isDrawerOpen?: boolean
  setIsDrawerOpen?: (isOpen: boolean) => void
}

export type ReplyingAndEditingState = {
  replyingToComment?: Comment | ReplyComment
  // This can be different from replyingToComment if we are replying to a reply
  replyingToCommentId?: ID
  editingComment?: Comment | ReplyComment
}

type CommentSectionContextType = {
  currentUserId: Nullable<ID>
  artistId: ID
  isEntityOwner: boolean
  commentCount: number
  track: UserTrackMetadata
  playTrack: (timestampSeconds?: number) => void
  commentSectionLoading: boolean
  commentIds: ID[]
  currentSort: CommentSortMethod
  isLoadingMorePages: boolean
  hasMorePages: boolean
  reset: (hard?: boolean) => void
  setCurrentSort: (sort: CommentSortMethod) => void
  loadMorePages: () => void
} & CommentSectionProviderProps

export const CommentSectionContext = createContext<
  CommentSectionContextType | undefined
>(undefined)

export const CommentSectionProvider = (
  props: PropsWithChildren<CommentSectionProviderProps>
) => {
  const {
    entityId,
    entityType = EntityType.TRACK,
    children,
    replyingAndEditingState,
    setReplyingAndEditingState,
    navigation,
    isDrawerOpen,
    setIsDrawerOpen
  } = props
  const { data: track } = useGetTrackById({ id: entityId })

  const [currentSort, setCurrentSort] = useState<CommentSortMethod>(
    CommentSortMethod.Top
  )
  const handleSetCurrentSort = (sortMethod: CommentSortMethod) => {
    queryClient.resetQueries({ queryKey: [QUERY_KEYS.trackCommentList] })
    setCurrentSort(sortMethod)
  }

  const { data: currentUserId } = useGetCurrentUserId({})
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
  const reset = () => {
    queryClient.resetQueries({ queryKey: [QUERY_KEYS.trackCommentList] })
    queryClient.resetQueries({ queryKey: [QUERY_KEYS.comment] })
    queryClient.resetQueries({ queryKey: [QUERY_KEYS.commentReplies] })
  }
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

  const { owner_id, comment_count: commentCount } = track

  return (
    <CommentSectionContext.Provider
      value={{
        currentUserId,
        artistId: owner_id,
        entityId,
        entityType,
        commentCount,
        commentIds,
        commentSectionLoading,
        isEntityOwner: currentUserId === owner_id,
        isLoadingMorePages,
        track,
        reset,
        hasMorePages: !!hasNextPage,
        currentSort,
        replyingAndEditingState,
        setReplyingAndEditingState,
        setCurrentSort: handleSetCurrentSort,
        playTrack,
        loadMorePages,
        navigation,
        isDrawerOpen,
        setIsDrawerOpen
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
