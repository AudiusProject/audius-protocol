import { ReactNode, useCallback, useContext, useMemo, useState } from 'react'

import {
  useCurrentCommentSection,
  usePinComment,
  useReactToComment,
  useReportComment,
  useMuteUser
} from '@audius/common/context'
import { commentsMessages as messages } from '@audius/common/messages'
import { Comment, ReplyComment } from '@audius/common/models'
import { cacheUsersSelectors } from '@audius/common/store'
import {
  ButtonVariant,
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
const { getUser } = cacheUsersSelectors

type ConfirmationAction =
  | 'pin'
  | 'unpin'
  | 'flagAndRemove'
  | 'muteUser'
  | 'delete'
  | 'artistDelete'

type ConfirmationModalState = {
  messages: {
    title: string
    body: ReactNode
    cancel: string
    confirm: string
  }
  confirmButtonType?: ButtonVariant
  confirmCallback: () => void
  cancelCallback?: () => void
}

type CommentActionBarProps = {
  comment: Comment | ReplyComment
  isDisabled?: boolean
  onClickEdit: () => void
  onClickReply: () => void
  onClickDelete: () => void
  hideReactCount?: boolean
}
export const CommentActionBar = ({
  comment,
  isDisabled,
  onClickEdit,
  onClickReply,
  onClickDelete,
  hideReactCount
}: CommentActionBarProps) => {
  const dispatch = useDispatch()
  // Comment from props
  const { reactCount, id: commentId, userId, isCurrentUserReacted } = comment
  const isParentComment = 'isPinned' in comment
  const isTombstone = isParentComment ? comment.isTombstone : false
  const isPinned = isParentComment ? comment.isPinned : false // pins dont exist on replies

  // API actions
  const [reactToComment] = useReactToComment()
  const [reportComment] = useReportComment()
  const [pinComment] = usePinComment()
  const [muteUser] = useMuteUser()

  // Comment context data
  const { currentUserId, isEntityOwner, entityId } = useCurrentCommentSection()
  const isCommentOwner = Number(comment.userId) === currentUserId
  const isUserGettingNotifs = isCommentOwner && isParentComment

  // Selectors
  const userDisplayName = useSelector(
    (state: AppState) => getUser(state, { id: Number(userId) })?.name
  )

  // Modals
  const [isMobileAppDrawerOpen, toggleIsMobileAppDrawer] = useToggle(false)
  const [currentConfirmationModalType, setCurrentConfirmationModalType] =
    useState<ConfirmationAction | undefined>(undefined)
  const isMobile = useIsMobile()
  const { toast } = useContext(ToastContext)

  // Internal state
  const [reactionState, setReactionState] = useState(isCurrentUserReacted)
  const [notificationsOn, setNotificationsMuted] = useState(false) // TODO: This needs some API support

  // Handlers
  const handleReact = useAuthenticatedCallback(() => {
    setReactionState(!reactionState)
    reactToComment(commentId, !reactionState)
  }, [commentId, reactToComment, reactionState])

  const handleDelete = useCallback(() => {
    // note: we do some UI logic in the CommentBlock above this so we can't trigger directly from here
    onClickDelete()
  }, [onClickDelete])

  const handleMuteNotifs = useCallback(() => {
    // TODO: call backend here
    setNotificationsMuted((prev) => !prev)
    toast(
      notificationsOn
        ? messages.toasts.unmutedNotifs
        : messages.toasts.mutedNotifs
    )
  }, [notificationsOn, toast])

  const handlePin = useCallback(() => {
    pinComment(commentId, !isPinned)
    toast(isPinned ? messages.toasts.unpinned : messages.toasts.pinned)
  }, [commentId, isPinned, pinComment, toast])

  const handleMute = useCallback(() => {
    muteUser({
      mutedUserId: comment.userId,
      isMuted: false,
      entityId
    })
    toast(messages.toasts.mutedUser)
  }, [comment.userId, entityId, muteUser, toast])

  const handleReport = useCallback(() => {
    reportComment(commentId)
    toast(messages.toasts.flaggedAndRemoved)
  }, [commentId, reportComment, toast])

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
    [k in ConfirmationAction]: ConfirmationModalState
  } = useMemo(
    () => ({
      pin: {
        messages: messages.popups.pin,
        confirmCallback: handlePin
      },
      unpin: {
        messages: messages.popups.unpin,
        confirmCallback: handlePin
      },
      // Specifically for an artist deleting someone else's comment
      artistDelete: {
        messages: {
          ...messages.popups.artistDelete,
          body: messages.popups.artistDelete.body(userDisplayName as string)
        },
        confirmCallback: handleDelete
      },
      // An individual deleting their own comment
      delete: {
        messages: messages.popups.delete,
        confirmCallback: handleDelete
      },
      muteUser: {
        messages: {
          ...messages.popups.muteUser,
          body: (
            <Flex gap='l' direction='column'>
              <Text color='default' textAlign='left'>
                {messages.popups.muteUser.body(userDisplayName as string)}
              </Text>
              <Hint icon={IconQuestionCircle} css={{ textAlign: 'left' }}>
                {messages.popups.muteUser.hint}
              </Hint>
            </Flex>
          ) as ReactNode,
          confirm: 'Mute User',
          cancel: 'Cancel'
        },
        confirmButtonType: 'destructive',
        confirmCallback: handleMute
      },
      flagAndRemove: {
        messages: messages.popups.flagAndRemove,
        confirmCallback: handleReport
      }
    }),
    [handleDelete, handleMute, handlePin, handleReport, userDisplayName]
  )

  const currentConfirmationModal = useMemo(
    () =>
      currentConfirmationModalType
        ? confirmationModals[currentConfirmationModalType]
        : undefined,
    [confirmationModals, currentConfirmationModalType]
  )

  // Popup menu items
  const popupMenuItems = useMemo(() => {
    let items: PopupMenuItem[] = []
    // Pin
    const entityOwnerMenuItems: PopupMenuItem[] = [
      {
        onClick: () => setCurrentConfirmationModalType('pin'),
        text: isPinned ? messages.menuActions.unpin : messages.menuActions.pin
      }
    ]
    const commentOwnerMenuItems: PopupMenuItem[] = [
      { onClick: onClickEdit, text: messages.menuActions.edit }
    ]
    const nonCommentOwnerItems: PopupMenuItem[] = [
      {
        onClick: () => setCurrentConfirmationModalType('flagAndRemove'),
        text: messages.menuActions.flagAndRemove
      },
      {
        onClick: () => setCurrentConfirmationModalType('muteUser'),
        text: messages.menuActions.muteUser
      }
    ]
    const muteNotifs: PopupMenuItem = {
      onClick: handleMuteNotifs,
      text: notificationsOn
        ? messages.menuActions.turnOffNotifications
        : messages.menuActions.turnOnNotifications
    }
    const deleteComment: PopupMenuItem = {
      onClick: () =>
        setCurrentConfirmationModalType(
          !isCommentOwner && isEntityOwner ? 'artistDelete' : 'delete'
        ),
      text: messages.menuActions.delete
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
    notificationsOn,
    isCommentOwner,
    isEntityOwner,
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
        {!hideReactCount ? (
          <Text color={isDisabled ? 'subdued' : 'default'}> {reactCount}</Text>
        ) : null}
      </Flex>
      <TextLink
        variant='subdued'
        onClick={handleClickReply}
        size='m'
        disabled={isDisabled || isTombstone}
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
          header: currentConfirmationModal?.messages?.title,
          description: currentConfirmationModal?.messages?.body,
          confirm: currentConfirmationModal?.messages?.confirm
        }}
        isOpen={currentConfirmationModalType !== undefined}
        onConfirm={currentConfirmationModal?.confirmCallback}
        onClose={() => {
          setCurrentConfirmationModalType(undefined)
        }}
      />
    </Flex>
  )
}
