/* eslint-disable no-console */
import { PropsWithChildren, createContext, useContext, useState } from 'react'

import { EntityType, Comment } from '@audius/sdk'

import { ID, Status } from '..//models'
import { Nullable } from '..//utils'
import { useGetCommentsByTrackId } from '../api'

/**
 * Context object to avoid prop drilling and share a common API with web/native code
 */

// Props passed in from above (also get forwarded thru)
type CommentSectionContextProps = {
  currentUserId: Nullable<ID>
  artistId: ID
  entityId: ID
  entityType?: EntityType.TRACK
  isEntityOwner: boolean
  playTrack: () => void
}

export enum CommentSortMethod {
  top = 'top',
  newest = 'newest',
  timestamp = 'timestamp'
}

// Props sent down to context (some are handled inside the context component)
type CommentSectionContextType = CommentSectionContextProps & {
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

export const CommentSectionProvider = ({
  currentUserId,
  artistId,
  entityId,
  isEntityOwner,
  entityType = EntityType.TRACK,
  children,
  playTrack
}: PropsWithChildren<CommentSectionContextProps>) => {
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
      force: true,
      disabled: entityId === 0
    }
  )

  const [currentSort, setCurrentSort] = useState<CommentSortMethod>(
    CommentSortMethod.top
  )

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

  return (
    <CommentSectionContext.Provider
      value={{
        currentUserId,
        artistId,
        entityId,
        entityType,
        comments,
        commentSectionLoading,
        isEntityOwner,
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
