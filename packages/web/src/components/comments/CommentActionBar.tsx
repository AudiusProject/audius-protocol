import { ReactNode, useCallback, useMemo, useState } from 'react'

import {
  useCurrentCommentSection,
  usePinComment,
  useReactToComment
} from '@audius/common/context'
import { toast } from '@audius/common/src/store/ui/toast/slice'
import {
  cacheUsersSelectors,
  CommentConfirmationModalState,
  useCommentConfirmationModal
} from '@audius/common/store'
import {
  Flex,
  Hint,
  IconButton,
  IconHeart,
  IconKebabHorizontal,
  IconQuestionCircle,
  PopupMenu,
  PopupMenuItem,
  Text,
  TextLink
} from '@audius/harmony'
import { Comment, ReplyComment } from '@audius/sdk'
import { useDispatch, useSelector } from 'react-redux'
import { useToggle } from 'react-use'

import { DownloadMobileAppDrawer } from 'components/download-mobile-app-drawer/DownloadMobileAppDrawer'
import {
  openAuthModal,
  useAuthenticatedCallback
} from 'hooks/useAuthenticatedCallback'
import { useIsMobile } from 'hooks/useIsMobile'
import { AppState } from 'store/types'
const { getUser } = cacheUsersSelectors

const messages = {
  pin: (isPinned: boolean) => (isPinned ? 'Unpin' : 'Pin'),
  reply: 'Reply',
  edit: 'Edit',
  delete: 'Delete',
  report: 'Flag & Remove',
  block: 'Mute User',
  muteNotifs: (isMuted: boolean) =>
    isMuted ? 'Turn on notifications' : 'Turn off notifications',
  toasts: {
    pin: (isPinned: boolean) =>
      isPinned ? 'Comment unpinned' : 'Comment pinned',
    delete: 'Comment deleted',
    muteUser: 'User muted and comment removed',
    flagAndRemove: 'Comment flagged and removed',
    muteNotifs: (isMuted: boolean) =>
      isMuted ? 'Notifications turned on' : 'Notifications turned off'
  }
}

type ConfirmationAction =
  | 'pin'
  | 'flagAndRemove'
  | 'muteUser'
  | 'delete'
  | 'artistDelete'

type CommentActionBarProps = {
  comment: Comment | ReplyComment
  isDisabled: boolean
  onClickEdit: () => void
  onClickReply: () => void
  onClickDelete: () => void
}
export const CommentActionBar = ({
  comment,
  isDisabled,
  onClickEdit,
  onClickReply,
  onClickDelete
}: CommentActionBarProps) => {
  const dispatch = useDispatch()
  // comment from props
  const { reactCount, id: commentId, userId, isCurrentUserReacted } = comment
  const isParentComment = 'isPinned' in comment
  const isPinned = isParentComment ? comment.isPinned : false // pins dont exist on replies
  // API actions
  const [reactToComment] = useReactToComment()
  const [pinComment] = usePinComment()

  // context data
  const { currentUserId, isEntityOwner } = useCurrentCommentSection()
  const isCommentOwner = Number(comment.userId) === currentUserId
  const isUserGettingNotifs = isCommentOwner && isParentComment
  const userDisplayName = useSelector(
    (state: AppState) => getUser(state, { id: Number(userId) })?.name
  )

  // Modals
  const {
    onClose: closeConfirmationModal,
    onOpen: openConfirmationModal,
    setData: setConfirmationModalData
  } = useCommentConfirmationModal()
  const [isMobileAppDrawerOpen, toggleIsMobileAppDrawer] = useToggle(false)
  const isMobile = useIsMobile()

  // component state
  const [reactionState, setReactionState] = useState(isCurrentUserReacted)
  const [notificationsMuted, setNotificationsMuted] = useState(false) // TODO: Need to set up API to provide this

  // Handlers
  const handleReact = useAuthenticatedCallback(() => {
    setReactionState(!reactionState)
    reactToComment(commentId, !reactionState)
  }, [commentId, reactToComment, reactionState])

  const handleDelete = useCallback(() => {
    onClickDelete()
  }, [onClickDelete])
  const handleMute = useCallback(() => {
    // TODO: call something here
    dispatch(toast({ content: messages.toasts.muteUser }))
  }, [dispatch])
  const handleReport = useCallback(() => {
    // TODO: call something here
    dispatch(toast({ content: messages.toasts.flagAndRemove }))
  }, [dispatch])
  const handleMuteNotifs = useCallback(() => {
    setNotificationsMuted((prev) => !prev)
    // TODO: call something here
    dispatch(toast({ content: messages.toasts.muteNotifs(notificationsMuted) }))
  }, [dispatch, notificationsMuted])
  const handlePin = useCallback(() => {
    pinComment(commentId, !isPinned)
    dispatch(toast({ content: messages.toasts.pin(isPinned) }))
  }, [commentId, dispatch, isPinned, pinComment])
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

  // Confirmation Modal state
  const confirmationModals: {
    [k in ConfirmationAction]: CommentConfirmationModalState
  } = useMemo(
    () => ({
      pin: {
        messages: {
          title: 'Pin this comment?',
          body: (
            <Text color='default'>
              If you already pinned a comment, this will replace it
            </Text>
          ),
          confirm: 'Pin',
          cancel: 'Cancel'
        },
        confirmCallback: handlePin,
        cancelCallback: closeConfirmationModal
      },
      unpin: {
        messages: {
          title: 'Unpin this comment?',
          body: <Text color='default'>Unpin this comment?</Text>,
          confirm: 'Pin',
          cancel: 'Cancel'
        },
        confirmCallback: handlePin,
        cancelCallback: closeConfirmationModal
      },
      // Specifically for an artist deleting someone else's comment
      artistDelete: {
        messages: {
          title: 'Delete comment',
          body: (
            <Text color='default'>
              Delete {userDisplayName}&apos;s comment?
            </Text>
          ),
          confirm: 'Delete',
          cancel: 'Cancel'
        },
        confirmCallback: handleDelete,
        cancelCallback: closeConfirmationModal
      },
      // An individual deleting their own comment
      delete: {
        messages: {
          title: 'Delete comment',
          body: <Text color='default'> Delete your comment permanently? </Text>,
          confirm: 'Delete',
          cancel: 'Cancel'
        },
        confirmCallback: handleDelete,
        cancelCallback: closeConfirmationModal
      },
      muteUser: {
        messages: {
          title: 'Are you sure?',
          body: (
            <Flex gap='l' direction='column'>
              <Text color='default' textAlign='left'>
                Mute {userDisplayName} from commenting on your content?
              </Text>
              <Hint icon={IconQuestionCircle} css={{ textAlign: 'left' }}>
                This will not affect their ability to view your profile or
                interact with your content.
              </Hint>
            </Flex>
          ) as ReactNode,
          confirm: 'Mute User',
          cancel: 'Cancel'
        },
        confirmButtonType: 'destructive',
        confirmCallback: handleMute,
        cancelCallback: closeConfirmationModal
      },
      flagAndRemove: {
        messages: {
          title: 'Flag comment?',
          body: <Text color='default'> Flag and hide this comment? </Text>,
          confirm: 'Flag',
          cancel: 'Cancel'
        },
        confirmCallback: handleReport,
        cancelCallback: closeConfirmationModal
      }
    }),
    [
      closeConfirmationModal,
      handleDelete,
      handleMute,
      handlePin,
      handleReport,
      userDisplayName
    ]
  )

  // Popup menu items
  const popupMenuItems = useMemo(() => {
    const handleConfirmationPopup =
      (confirmationType: ConfirmationAction) => () => {
        openConfirmationModal()
        setConfirmationModalData(confirmationModals[confirmationType])
      }
    let items: PopupMenuItem[] = []
    // Pin
    const entityOwnerMenuItems: PopupMenuItem[] = [
      {
        onClick: handleConfirmationPopup('pin'),
        text: messages.pin(isPinned)
      }
    ]
    const commentOwnerMenuItems: PopupMenuItem[] = [
      { onClick: onClickEdit, text: messages.edit }
    ]
    const nonCommentOwnerItems: PopupMenuItem[] = [
      {
        onClick: handleConfirmationPopup('flagAndRemove'),
        text: messages.report
      },
      { onClick: handleConfirmationPopup('muteUser'), text: messages.block }
    ]
    const muteNotifs: PopupMenuItem = {
      onClick: handleMuteNotifs,
      text: messages.muteNotifs(notificationsMuted)
    }
    const deleteComment: PopupMenuItem = {
      onClick: handleConfirmationPopup(
        !isCommentOwner && isEntityOwner ? 'artistDelete' : 'delete'
      ),
      text: messages.delete
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
    isPinned,
    onClickEdit,
    handleMuteNotifs,
    notificationsMuted,
    isCommentOwner,
    isEntityOwner,
    openConfirmationModal,
    setConfirmationModalData,
    confirmationModals,
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
          onClick={handleReact}
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
    </Flex>
  )
}
