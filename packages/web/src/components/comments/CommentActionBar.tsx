import { ReactNode, useCallback, useContext, useMemo, useState } from 'react'

import {
  useCurrentCommentSection,
  useUpdateCommentNotificationSetting,
  usePinComment,
  useReactToComment,
  useReportComment,
  useMuteUser
} from '@audius/common/context'
import { commentsMessages as messages } from '@audius/common/messages'
import { Comment, ID, ReplyComment } from '@audius/common/models'
import { cacheUsersSelectors } from '@audius/common/store'
import {
  Box,
  ButtonVariant,
  Flex,
  Hint,
  IconButton,
  IconHeart,
  IconKebabHorizontal,
  IconQuestionCircle,
  PopupMenu,
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
import { removeNullable } from 'utils/typeUtils'
const { getUser } = cacheUsersSelectors

type ConfirmationAction =
  | 'pin'
  | 'unpin'
  | 'flagAndHide'
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
  parentCommentId?: ID
}
export const CommentActionBar = ({
  comment,
  isDisabled,
  onClickEdit,
  onClickReply,
  onClickDelete,
  hideReactCount,
  parentCommentId
}: CommentActionBarProps) => {
  const dispatch = useDispatch()
  const { currentUserId, isEntityOwner, entityId, currentSort, track } =
    useCurrentCommentSection()
  const { reactCount, id: commentId, userId, isCurrentUserReacted } = comment
  const isMuted = 'isMuted' in comment ? comment.isMuted : false
  const isParentComment = parentCommentId === undefined
  const isPinned = track.pinned_comment_id === commentId
  const isTombstone = 'isTombstone' in comment ? !!comment.isTombstone : false

  // API actions
  const [reactToComment] = useReactToComment()
  const [reportComment] = useReportComment()
  const [pinComment] = usePinComment()
  const [muteUser] = useMuteUser()

  const isCommentOwner = Number(comment.userId) === currentUserId

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

  const [handleMuteCommentNotifications] =
    useUpdateCommentNotificationSetting(commentId)

  // Handlers
  const handleReact = useAuthenticatedCallback(() => {
    reactToComment(commentId, !isCurrentUserReacted)
  }, [commentId, isCurrentUserReacted, reactToComment])

  const handleDelete = useCallback(() => {
    // note: we do some UI logic in the CommentBlock above this so we can't trigger directly from here
    onClickDelete()
  }, [onClickDelete])

  const handleMuteNotifs = useCallback(() => {
    handleMuteCommentNotifications(isMuted ? 'unmute' : 'mute')
    toast(isMuted ? messages.toasts.unmutedNotifs : messages.toasts.mutedNotifs)
  }, [handleMuteCommentNotifications, isMuted, toast])

  const handlePin = useCallback(() => {
    pinComment(commentId, !isPinned)
    toast(isPinned ? messages.toasts.unpinned : messages.toasts.pinned)
  }, [commentId, isPinned, pinComment, toast])

  const handleMute = useCallback(() => {
    if (comment.userId === undefined) return
    muteUser({
      mutedUserId: comment.userId,
      isMuted: false,
      trackId: entityId,
      currentSort
    })
    toast(messages.toasts.mutedUser)
  }, [comment.userId, currentSort, entityId, muteUser, toast])

  const handleFlagComment = useCallback(() => {
    reportComment(commentId, parentCommentId)
    toast(messages.toasts.flaggedAndHidden)
  }, [commentId, parentCommentId, reportComment, toast])

  const handleFlagAndRemoveComment = useCallback(() => {
    reportComment(commentId, parentCommentId)
    toast(messages.toasts.flaggedAndRemoved)
  }, [commentId, parentCommentId, reportComment, toast])

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
      flagAndHide: {
        messages: {
          ...messages.popups.flagAndHide,
          body: messages.popups.flagAndHide.body(userDisplayName as string)
        },
        confirmCallback: handleFlagComment
      },
      flagAndRemove: {
        messages: {
          ...messages.popups.flagAndRemove,
          body: messages.popups.flagAndRemove.body(userDisplayName as string)
        },
        confirmCallback: handleFlagAndRemoveComment
      }
    }),
    [
      handleDelete,
      handleMute,
      handlePin,
      handleFlagComment,
      handleFlagAndRemoveComment,
      userDisplayName
    ]
  )

  const currentConfirmationModal = useMemo(
    () =>
      currentConfirmationModalType
        ? confirmationModals[currentConfirmationModalType]
        : undefined,
    [confirmationModals, currentConfirmationModalType]
  )

  // Popup menu items
  const popupMenuItems = useMemo(
    () =>
      [
        isEntityOwner &&
          isParentComment && {
            onClick: () => setCurrentConfirmationModalType('pin'),
            text: isPinned
              ? messages.menuActions.unpin
              : messages.menuActions.pin
          },
        !isEntityOwner &&
          !isCommentOwner && {
            onClick: () => setCurrentConfirmationModalType('flagAndHide'),
            text: messages.menuActions.flagAndHide
          },
        isEntityOwner &&
          !isCommentOwner && {
            onClick: () => setCurrentConfirmationModalType('flagAndRemove'),
            text: messages.menuActions.flagAndRemove
          },
        isEntityOwner &&
          !isCommentOwner && {
            onClick: () => setCurrentConfirmationModalType('muteUser'),
            text: messages.menuActions.muteUser
          },
        isCommentOwner &&
          isParentComment && {
            onClick: handleMuteNotifs,
            text: isMuted
              ? messages.menuActions.unmuteThread
              : messages.menuActions.muteThread
          },
        isCommentOwner && {
          onClick: onClickEdit,
          text: messages.menuActions.edit
        },
        (isCommentOwner || isEntityOwner) && {
          onClick: () =>
            setCurrentConfirmationModalType(
              !isCommentOwner && isEntityOwner ? 'artistDelete' : 'delete'
            ),
          text: messages.menuActions.delete
        }
      ].filter(removeNullable),
    [
      isEntityOwner,
      isParentComment,
      isPinned,
      isCommentOwner,
      onClickEdit,
      handleMuteNotifs,
      isMuted
    ]
  )

  return (
    <Flex gap='l' alignItems='center'>
      <Flex alignItems='center'>
        {/* TODO: we should use FavoriteButton here */}
        <IconButton
          icon={IconHeart}
          color={isCurrentUserReacted ? 'active' : 'subdued'}
          aria-label='Heart comment'
          onClick={handleReact}
          disabled={isDisabled}
        />
        {!hideReactCount && reactCount > 0 ? (
          <Text color={isDisabled ? 'subdued' : 'default'}> {reactCount}</Text>
        ) : (
          // Placeholder box to offset where the number would be
          <Box w='8px' />
        )}
      </Flex>
      <TextLink
        variant='subdued'
        onClick={handleClickReply}
        disabled={isDisabled || isTombstone}
      >
        {messages.reply}
      </TextLink>

      <PopupMenu
        items={popupMenuItems}
        anchorOrigin={{ vertical: 'center', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        renderTrigger={(anchorRef, triggerPopup) => (
          <IconButton
            aria-label='Show Comment Management Options'
            icon={IconKebabHorizontal}
            color='subdued'
            ref={anchorRef}
            disabled={isDisabled}
            size='m'
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
