import { useCallback, useContext, useMemo, useState } from 'react'

import { useGetUserById } from '@audius/common/api'
import {
  useCurrentCommentSection,
  usePinComment,
  useReactToComment,
  useReportComment,
  useMuteUser
} from '@audius/common/context'
import { commentsMessages as messages } from '@audius/common/messages'
import { cacheUsersSelectors } from '@audius/common/store'
import { decodeHashId } from '@audius/common/utils'
import {
  Flex,
  IconButton,
  IconHeart,
  IconKebabHorizontal,
  IconMessageBlock,
  IconNotificationOff,
  IconPencil,
  IconPin,
  IconShieldCheck,
  IconTrash,
  IconUserUnfollow,
  PopupMenu,
  PopupMenuItem,
  Text,
  TextLink
} from '@audius/harmony'
import { Comment, ReplyComment } from '@audius/sdk'
import { useDispatch, useSelector } from 'react-redux'
import { useToggle } from 'react-use'

import { ConfirmationModal } from 'components/confirmation-modal'
import { DownloadMobileAppDrawer } from 'components/download-mobile-app-drawer/DownloadMobileAppDrawer'
import { ToastContext } from 'components/toast/ToastContext'
import {
  openAuthModal,
  useAuthenticatedCallback
} from 'hooks/useAuthenticatedCallback'
import { useIsMobile } from 'hooks/useIsMobile'
import { AppState } from 'store/types'

type CommentActionBarProps = {
  comment: Comment | ReplyComment
  isDisabled: boolean
  onClickEdit: () => void
  onClickReply: () => void
  onClickDelete: () => void
}
const { getUser } = cacheUsersSelectors

export const CommentActionBar = ({
  comment,
  isDisabled,
  onClickEdit,
  onClickReply,
  onClickDelete
}: CommentActionBarProps) => {
  // comment from props
  const { reactCount, id: commentId, isCurrentUserReacted } = comment
  const commentOwnerName = useSelector(
    (state: AppState) =>
      getUser(state, { id: Number(comment.userId) })?.name ?? ''
  )

  // if (!commentOwnerName) {
  //   throw new Error('Failed to get commenter name.')
  // }

  const isPinned = 'isPinned' in comment ? comment.isPinned : false // pins dont exist on replies

  // context actions & values
  const { currentUserId, isEntityOwner } = useCurrentCommentSection()
  const dispatch = useDispatch()

  const [reactToComment] = useReactToComment()

  const [reportComment] = useReportComment()
  const [muteUser] = useMuteUser()

  const [isFlagConfirmationOpen, toggleFlagConfirmationOpen] = useToggle(false)
  const [isMuteUserConfirmationOpen, toggleMuteUserConfirmationOpen] =
    useToggle(false)

  const [pinComment] = usePinComment()
  const [isMobileAppDrawerOpen, toggleIsMobileAppDrawer] = useToggle(false)
  const isMobile = useIsMobile()
  const { toast } = useContext(ToastContext)

  // component state
  const [reactionState, setReactionState] = useState(isCurrentUserReacted)

  const isCommentOwner = Number(comment.userId) === currentUserId
  const isUserGettingNotifs = true // TODO: Need to set up API to provide this
  const notificationsMuted = false // TODO: Need to set up API to provide this

  const handleCommentReact = useAuthenticatedCallback(() => {
    setReactionState(!reactionState)
    reactToComment(commentId, !reactionState)
  }, [commentId, reactToComment, reactionState])

  const handleCommentDelete = useCallback(() => {
    onClickDelete()
  }, [onClickDelete])

  const handleCommentPin = useCallback(() => {
    pinComment(commentId, !isPinned)
  }, [commentId, isPinned, pinComment])

  const handleCommentReport = useCallback(() => {
    reportComment(commentId)
    toast(messages.flaggedConfirmation)
  }, [commentId, reportComment, toast])

  const handleMuteUser = useCallback(() => {
    muteUser(comment.userId)
    toast(messages.mutedUserConfirmation)
  }, [comment.userId, muteUser, toast])

  const handleClickReply = useCallback(() => {
    if (isMobile) {
      toggleIsMobileAppDrawer()
    } else {
      if (currentUserId === undefined) {
        openAuthModal(dispatch)
      } else {
        onClickReply()
      }
    }
  }, [currentUserId, dispatch, isMobile, onClickReply, toggleIsMobileAppDrawer])

  const popupMenuItems = useMemo(() => {
    let items: PopupMenuItem[] = []
    const entityOwnerMenuItems: PopupMenuItem[] = [
      {
        onClick: handleCommentPin,
        text: isPinned ? messages.unpin : messages.pin,
        icon: <IconPin />
      }
    ]
    const commentOwnerMenuItems: PopupMenuItem[] = [
      { onClick: onClickEdit, text: messages.edit, icon: <IconPencil /> }
    ]
    const nonCommentOwnerItems: PopupMenuItem[] = [
      {
        onClick: toggleFlagConfirmationOpen,
        text: messages.report,
        icon: <IconShieldCheck /> // TODO: temporary icon
      },
      {
        onClick: toggleMuteUserConfirmationOpen,
        text: messages.muteUser,
        icon: <IconUserUnfollow /> // TODO: temporary icon
      }
    ]
    const muteNotifs: PopupMenuItem = {
      onClick: () => {}, // TODO - nothing implemented yet here
      text: notificationsMuted ? messages.unmuteNotifs : messages.muteNotifs,
      icon: <IconNotificationOff />
    }
    const deleteComment: PopupMenuItem = {
      onClick: handleCommentDelete,
      text: messages.delete,
      icon: <IconTrash />
    }

    if (isEntityOwner) {
      items = items.concat(entityOwnerMenuItems)
    }
    if (isCommentOwner) {
      items = items.concat(commentOwnerMenuItems)
      if (isUserGettingNotifs) {
        items.push(muteNotifs)
      }
    }
    if (!isCommentOwner) {
      items = items.concat(nonCommentOwnerItems)
    }
    if (isCommentOwner || isEntityOwner) {
      items.push(deleteComment)
    }
    return items
  }, [
    handleCommentPin,
    isPinned,
    onClickEdit,
    toggleFlagConfirmationOpen,
    toggleMuteUserConfirmationOpen,
    notificationsMuted,
    handleCommentDelete,
    isEntityOwner,
    isCommentOwner,
    isUserGettingNotifs
  ])

  return (
    <Flex gap='l' alignItems='center'>
      <Flex alignItems='center'>
        {/* TODO: we should use FavoriteButton here */}
        <IconButton
          icon={IconHeart}
          color={reactionState ? 'active' : 'subdued'}
          aria-label='Heart comment'
          onClick={handleCommentReact}
          disabled={isDisabled}
        />
        <Text color={isDisabled ? 'subdued' : 'default'}> {reactCount}</Text>
      </Flex>
      <TextLink
        variant='subdued'
        onClick={handleClickReply}
        size='m'
        disabled={isDisabled}
      >
        {messages.reply}
      </TextLink>

      <PopupMenu
        items={popupMenuItems}
        renderTrigger={(anchorRef, triggerPopup) => (
          <IconButton
            aria-label='Show Comment Management Options'
            icon={IconKebabHorizontal}
            color='subdued'
            ref={anchorRef}
            disabled={isDisabled}
            onClick={() => {
              if (isMobile) {
                toggleIsMobileAppDrawer()
              } else {
                if (currentUserId === undefined) {
                  openAuthModal(dispatch)
                } else {
                  triggerPopup()
                }
              }
            }}
          />
        )}
      />
      <DownloadMobileAppDrawer
        isOpen={isMobileAppDrawerOpen}
        onClose={toggleIsMobileAppDrawer}
      />
      <ConfirmationModal
        messages={{
          header: messages.flagComment,
          description: messages.flagCommentDescription,
          confirm: messages.flag
        }}
        isOpen={isFlagConfirmationOpen}
        onClose={toggleFlagConfirmationOpen}
        title={messages.flagComment}
        description={messages.flagCommentDescription}
        onConfirm={handleCommentReport}
      />
      <ConfirmationModal
        messages={{
          header: messages.muteUser,
          description: messages.muteUserDescription(commentOwnerName),
          confirm: messages.muteUser
        }}
        isOpen={isMuteUserConfirmationOpen}
        onClose={toggleMuteUserConfirmationOpen}
        title={messages.muteUser}
        description={messages.muteUserDescription(commentOwnerName)}
        onConfirm={handleMuteUser}
      />
    </Flex>
  )
}
