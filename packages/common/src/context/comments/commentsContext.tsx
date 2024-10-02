/* eslint-disable no-console */
import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useState
} from 'react'

import { EntityType, TrackCommentsSortMethodEnum } from '@audius/sdk'
import { useQueryClient } from '@tanstack/react-query'
import { useDispatch, useSelector } from 'react-redux'

import {
  useGetCurrentUserId,
  useGetTrackById,
  useGetCommentsByTrackId
} from '../../api'
import { ID, Comment, ReplyComment, UserTrackMetadata } from '../../models'
import { tracksActions } from '../../store/pages/track/lineup/actions'
import { playerSelectors } from '../../store/player'
import { Nullable } from '../../utils'

type CommentSectionProviderProps = {
  entityId: ID
  entityType?: EntityType.TRACK

  // These are optional because they are only used on mobile
  // and provided for the components in CommentDrawer
  replyingToComment?: Comment | ReplyComment
  setReplyingToComment?: (comment: Comment | ReplyComment) => void
  editingComment?: Comment | ReplyComment
  setEditingComment?: (comment: Comment | ReplyComment) => void
}

type CommentSectionContextType = {
  currentUserId: Nullable<ID>
  artistId: ID
  isEntityOwner: boolean
  commentCount: number
  track: UserTrackMetadata
  playTrack: () => void
  commentSectionLoading: boolean
  commentIds: ID[]
  currentSort: TrackCommentsSortMethodEnum
  isLoadingMorePages: boolean
  hasMorePages: boolean
  reset: (hard?: boolean) => void
  setCurrentSort: (sort: TrackCommentsSortMethodEnum) => void
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
    replyingToComment,
    setReplyingToComment,
    editingComment,
    setEditingComment
  } = props
  const { data: track } = useGetTrackById({ id: entityId })

  const [currentSort, setCurrentSort] = useState<TrackCommentsSortMethodEnum>(
    TrackCommentsSortMethodEnum.Top
  )

  const { data: currentUserId } = useGetCurrentUserId({})
  // TODO: fix types here
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
  // hard refresh all data
  const reset = () => {
    queryClient.resetQueries({ queryKey: ['trackCommentList'] })
    queryClient.resetQueries({ queryKey: ['comment'] })
  }
  const dispatch = useDispatch()
  const playerUid = useSelector(playerSelectors.getUid) ?? undefined
  const playTrack = useCallback(() => {
    dispatch(tracksActions.play(playerUid))
  }, [dispatch, playerUid])

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
        replyingToComment,
        setReplyingToComment,
        editingComment,
        setEditingComment,
        setCurrentSort,
        playTrack,
        loadMorePages
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
