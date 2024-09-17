import { ReactNode, useCallback, useContext, useMemo, useState } from 'react'

import {
  useCurrentCommentSection,
  usePinComment,
  useReactToComment,
  useReportComment
} from '@audius/common/context'
import { commentsMessages as messages } from '@audius/common/messages'
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
const { getUser } = cacheUsersSelectors

type ConfirmationAction =
  | 'pin'
  | 'flagAndRemove'
  | 'muteUser'
  | 'delete'
  | 'artistDelete'

type ConfirmationModalState = {
  messages: {
    title: string
    body: ReactNode
    cancel: string
    confirm: String
  }
  confirmButtonType?: ButtonVariant
  confirmCallback: () => void
  cancelCallback?: () => void
}

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
  // Comment from props
  const { reactCount, id: commentId, userId, isCurrentUserReacted } = comment
  const isParentComment = 'isPinned' in comment
  const isPinned = isParentComment ? comment.isPinned : false // pins dont exist on replies

  // API actions
  const [reactToComment] = useReactToComment()
  const [reportComment] = useReportComment()
  const [pinComment] = usePinComment()

  // Comment context data
  const { currentUserId, isEntityOwner } = useCurrentCommentSection()
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
    toast(messages.toasts.muteUser)
  }, [toast])

  const handleMuteNotifs = useCallback(() => {
    setNotificationsMuted((prev) => !prev)
    // TODO: call something here
    toast(messages.toasts.muteNotifs(notificationsMuted))
  }, [notificationsMuted, toast])

  const handlePin = useCallback(() => {
    pinComment(commentId, !isPinned)
    toast(messages.toasts.pin(isPinned))
  }, [commentId, isPinned, pinComment, toast])

  const handleReport = useCallback(() => {
    reportComment(commentId)
    toast(messages.flaggedConfirmation)
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
        messages: {
          title: 'Pin this comment?',
          body: <Text color='default'>{messages.popups.pin}</Text>,
          confirm: 'Pin',
          cancel: 'Cancel'
        },
        confirmCallback: handlePin
      },
      unpin: {
        messages: {
          title: 'Unpin this comment?',
          body: <Text color='default'>{messages.popups.unpin}</Text>,
          confirm: 'Pin',
          cancel: 'Cancel'
        },
        confirmCallback: handlePin
      },
      // Specifically for an artist deleting someone else's comment
      artistDelete: {
        messages: {
          title: 'Delete comment',
          body: (
            <Text color='default'>
              {messages.popups.artistDelete(userDisplayName as string)}
            </Text>
          ),
          confirm: 'Delete',
          cancel: 'Cancel'
        },
        confirmCallback: handleDelete
      },
      // An individual deleting their own comment
      delete: {
        messages: {
          title: 'Delete comment',
          body: <Text color='default'> {messages.popups.delete}</Text>,
          confirm: 'Delete',
          cancel: 'Cancel'
        },
        confirmCallback: handleDelete
      },
      muteUser: {
        messages: {
          title: 'Are you sure?',
          body: (
            <Flex gap='l' direction='column'>
              <Text color='default' textAlign='left'>
                {messages.popups.mute.body(userDisplayName as string)}
              </Text>
              <Hint icon={IconQuestionCircle} css={{ textAlign: 'left' }}>
                {messages.popups.mute.hint}
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
        messages: {
          title: 'Flag comment?',
          body: <Text color='default'> {messages.popups.flagAndRemove}</Text>,
          confirm: 'Flag',
          cancel: 'Cancel'
        },
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
        text: messages.pin(isPinned)
      }
    ]
    const commentOwnerMenuItems: PopupMenuItem[] = [
      { onClick: onClickEdit, text: messages.edit }
    ]
    const nonCommentOwnerItems: PopupMenuItem[] = [
      {
        onClick: () => setCurrentConfirmationModalType('flagAndRemove'),
        text: messages.flagAndRemove
      },
      {
        onClick: () => setCurrentConfirmationModalType('muteUser'),
        text: messages.block
      }
    ]
    const muteNotifs: PopupMenuItem = {
      onClick: handleMuteNotifs,
      text: messages.muteNotifs(notificationsMuted)
    }
    const deleteComment: PopupMenuItem = {
      onClick: () =>
        setCurrentConfirmationModalType(
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
      <ConfirmationModal
        messages={{
          header: currentConfirmationModal?.messages?.title,
          description: currentConfirmationModal?.messages?.body,
          confirm: messages.flag
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
