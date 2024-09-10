import { ReactNode, useCallback, useMemo, useState } from 'react'

import {
  useCurrentCommentSection,
  usePinComment,
  useReactToComment
} from '@audius/common/context'
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
import { useSelector } from 'react-redux'
import { useToggle } from 'react-use'

import { DownloadMobileAppDrawer } from 'components/download-mobile-app-drawer/DownloadMobileAppDrawer'
import { useIsMobile } from 'hooks/useIsMobile'
import { AppState } from 'store/types'
const { getUser } = cacheUsersSelectors

const messages = {
  pin: (isPinned: boolean) => (isPinned ? 'Unpin' : 'Pin'),
  edit: 'Edit',
  delete: 'Delete',
  report: 'Flag & Remove',
  block: 'Mute User',
  muteNotifs: (isMuted: boolean) =>
    isMuted ? 'Turn on notifications' : 'Turn off notifications'
}

type ConfirmationAction =
  | 'pin'
  | 'flagAndRemove'
  | 'muteUser'
  | 'delete'
  | 'artistDelete'
  | 'report'

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
  // comment details
  const { reactCount, id: commentId, userId } = comment
  const isPinned = 'isPinned' in comment ? comment.isPinned : false // pins dont exist on replies
  const isUserGettingNotifs = true // TODO: Need to set up API to provide this
  const notificationsMuted = false // TODO: Need to set up API to provide this

  // API actions
  const [reactToComment] = useReactToComment()
  const [pinComment] = usePinComment()

  // context data
  const { currentUserId, isEntityOwner } = useCurrentCommentSection()
  const isCommentOwner = Number(comment.userId) === currentUserId
  const userDisplayName = useSelector(
    (state: AppState) => getUser(state, { id: userId })?.name
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
  const [reactionState, setReactionState] = useState(false)

  // Handlers
  const handleCommentReact = useCallback(() => {
    setReactionState(!reactionState)
    reactToComment(commentId, !reactionState)
  }, [commentId, reactToComment, reactionState])

  const handleCommentDelete = useCallback(() => {
    onClickDelete()
  }, [onClickDelete])

  const handleCommentMute = useCallback(() => {
    // TODO
  }, [])

  const handleCommentReport = useCallback(() => {
    // TODO
  }, [])

  const handleCommentPin = useCallback(() => {
    pinComment(commentId, !isPinned)
  }, [commentId, isPinned, pinComment])

  const handleClickReply = useCallback(() => {
    if (isMobile) {
      toggleIsMobileAppDrawer()
    } else {
      onClickReply()
    }
  }, [isMobile, onClickReply, toggleIsMobileAppDrawer])

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
        confirmCallback: handleCommentPin,
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
        confirmCallback: handleCommentDelete,
        cancelCallback: closeConfirmationModal
      },
      delete: {
        messages: {
          title: 'Delete comment',
          body: <Text color='default'> Delete your comment permanently? </Text>,
          confirm: 'Delete',
          cancel: 'Cancel'
        },
        confirmCallback: handleCommentDelete,
        cancelCallback: closeConfirmationModal
      },
      muteUser: {
        messages: {
          title: 'Are you sure?',
          body: (
            <>
              <Text color='default'>
                Mute ${userDisplayName} from commenting on your content?
              </Text>
              <Hint icon={IconQuestionCircle}>
                Mute {userDisplayName} from commenting on your content?
              </Hint>
            </>
          ) as ReactNode,
          confirm: 'Mute User',
          cancel: 'Cancel'
        },
        confirmButtonType: 'destructive',
        confirmCallback: handleCommentMute,
        cancelCallback: closeConfirmationModal
      },
      // Anyone deleting their own comment
      delete: {
        messages: {
          title: 'Delete comment',
          body: <Text>Delete your comment permanently?</Text>,
          confirm: 'Delete',
          cancel: 'Cancel'
        },
        confirmCallback: handleCommentDelete,
        cancelCallback: closeConfirmationModal
      },
      flagAndRemove: {
        messages: {
          title: 'Flag comment?',
          body: <Text color='default'> Flag and hide this comment? </Text>,
          confirm: 'Flag',
          cancel: 'Cancel'
        },
        confirmCallback: handleCommentReport,
        cancelCallback: closeConfirmationModal
      },
      report: {
        messages: {
          title: 'Flag comment?',
          body: <Text color='default'> Flag this comment? </Text>,
          confirm: 'Flag',
          cancel: 'Cancel'
        },
        confirmCallback: handleCommentReport,
        cancelCallback: closeConfirmationModal
      }
    }),
    [
      closeConfirmationModal,
      handleCommentDelete,
      handleCommentMute,
      handleCommentPin,
      handleCommentReport,
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
        onClick: handleConfirmationPopup('report'), // TODO - nothing implemented yet
        text: messages.report
      },
      { onClick: () => {}, text: messages.block } // TODO - nothing implemented yet
    ]
    const muteNotifs: PopupMenuItem = {
      onClick: handleConfirmationPopup('muteUser'), // TODO - nothing implemented yet here
      text: messages.muteNotifs(notificationsMuted)
    }
    const deleteComment: PopupMenuItem = {
      onClick: handleConfirmationPopup('delete'),
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
    notificationsMuted,
    isEntityOwner,
    isCommentOwner,
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
        Reply
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
                triggerPopup()
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
