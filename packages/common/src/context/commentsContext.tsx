/* eslint-disable no-console */
import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useState
} from 'react'

import { EntityType, Comment } from '@audius/sdk'
import { useDispatch, useSelector } from 'react-redux'

import { ID, Status } from '..//models'
import { Nullable } from '..//utils'
import {
  useDeleteCommentById,
  useEditCommentById,
  useGetCommentsByTrackId,
  usePinCommentById,
  usePostComment as useAQueryPostComment,
  useReactToCommentById,
  useGetCurrentUserId,
  useGetTrackById
} from '../api'
import { tracksActions } from '../store/pages/track/lineup/actions'
import { playerSelectors } from '../store/player'

export enum CommentSortMethod {
  top = 'top',
  newest = 'newest',
  timestamp = 'timestamp'
}

type CommentSectionContextType = {
  currentUserId: Nullable<ID>
  artistId: ID
  entityId: ID
  entityType?: EntityType.TRACK
  isEntityOwner: boolean
  playTrack: () => void
  commentSectionLoading: boolean
  comments: Comment[]
  currentSort: CommentSortMethod
  isLoadingMorePages: boolean
  hasMorePages: boolean
  forceRefresh: () => void
  setCurrentSort: (sort: CommentSortMethod) => void
  handleLoadMoreRootComments: () => void
  handleLoadMoreReplies: (commentId: string) => void
  handleMuteEntityNotifications: () => void
}

export const CommentSectionContext = createContext<
  CommentSectionContextType | undefined
>(undefined)

type CommentSectionProviderProps = {
  entityId: ID
  entityType?: EntityType.TRACK
}

export const CommentSectionProvider = (
  props: PropsWithChildren<CommentSectionProviderProps>
) => {
  const { entityId, entityType = EntityType.TRACK, children } = props
  const { data: track } = useGetTrackById({ id: entityId })
  const {
    data: comments = [],
    status,
    loadMore,
    hardReset: reset,
    isLoadingMore: isLoadingMorePages,
    hasMore: hasMorePages
  } = useGetCommentsByTrackId(
    { entityId },
    {
      pageSize: 5,
      disabled: entityId === 0,
      singlePageData: true
    }
  )
  const { data: currentUserId } = useGetCurrentUserId({})
  const [currentSort, setCurrentSort] = useState<CommentSortMethod>(
    CommentSortMethod.top
  )
  const dispatch = useDispatch()
  const playerUid = useSelector(playerSelectors.getUid) ?? undefined
  const playTrack = useCallback(() => {
    dispatch(tracksActions.play(playerUid))
  }, [dispatch, playerUid])

  const commentSectionLoading =
    status === Status.LOADING || status === Status.IDLE

  const handleLoadMoreRootComments = () => {
    loadMore()
  }
  const handleLoadMoreReplies = (commentId: string) => {
    console.log('Loading more replies for', commentId)
  }
  const handleMuteEntityNotifications = () => {
    console.log('Muting all notifs for ', entityId)
  }

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
        comments,
        commentSectionLoading,
        isEntityOwner: currentUserId === owner_id,
        isLoadingMorePages,
        forceRefresh: reset,
        hasMorePages,
        currentSort,
        setCurrentSort,
        playTrack,
        handleLoadMoreReplies,
        handleLoadMoreRootComments,
        handleMuteEntityNotifications
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
