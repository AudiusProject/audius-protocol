import { useCallback, useEffect } from 'react'

import { User } from '@audius/common/models'
import {
  accountSelectors,
  chatActions,
  chatSelectors,
  ChatPermissionAction,
  tippingSelectors,
  tippingActions
} from '@audius/common/store'
import { removeNullable } from '@audius/common/utils'
import {
  IconMessageBlock,
  IconKebabHorizontal,
  IconMessage,
  IconMessageUnblock as IconUnblockMessages,
  IconUser
} from '@audius/harmony'
import { IconButton, PopupMenu } from '@audius/stems'
import { push as pushRoute } from 'connected-react-router'
import { useDispatch } from 'react-redux'

import { useSelector } from 'common/hooks/useSelector'
import ArtistChip from 'components/artist/ArtistChip'
import { profilePage } from 'utils/route'
import zIndex from 'utils/zIndex'

import styles from './CreateChatUserResult.module.css'

const messages = {
  moreOptions: 'More options',
  message: 'Message This User',
  visit: "Visit User's Profile",
  block: 'Block Messages',
  unblock: 'Unblock Messages',
  notPermitted: 'Cannot Be Messaged',
  sendTipRequired: 'Send a Tip to Message',
  unblockRequired: 'Blocked'
}

type UserResultComposeProps = {
  user: User
  closeParentModal: () => void
  openInboxUnavailableModal: (user: User) => void
  presetMessage?: string
}

const { getUserId } = accountSelectors
const { getOptimisticSupporters, getOptimisticSupporting } = tippingSelectors

const { fetchSupportersForUser } = tippingActions
const { createChat, blockUser, unblockUser, fetchPermissions } = chatActions
const { getBlockees, getCanCreateChat } = chatSelectors

const renderTrigger = (
  anchorRef: React.MutableRefObject<any>,
  triggerPopup: () => void
) => (
  <IconButton
    ref={anchorRef}
    aria-label={messages.moreOptions}
    icon={<IconKebabHorizontal className={styles.icon} />}
    onClick={triggerPopup}
  />
)

const renderCustomChip = (callToAction: ChatPermissionAction) => {
  switch (callToAction) {
    case ChatPermissionAction.TIP:
      return (
        <div className={styles.notPermitted}>
          <IconMessageBlock className={styles.icon} />
          <span>{messages.sendTipRequired}</span>
        </div>
      )
    case ChatPermissionAction.UNBLOCK:
      return (
        <div className={styles.notPermitted}>
          <IconMessageBlock className={styles.icon} />
          <span>{messages.unblockRequired}</span>
        </div>
      )
    default:
      return (
        <div className={styles.notPermitted}>
          <IconMessageBlock className={styles.icon} />
          <span>{messages.notPermitted}</span>
        </div>
      )
  }
}

export const CreateChatUserResult = (props: UserResultComposeProps) => {
  const dispatch = useDispatch()
  const { user, closeParentModal, openInboxUnavailableModal, presetMessage } =
    props
  const currentUserId = useSelector(getUserId)
  const supportingMap = useSelector(getOptimisticSupporting)
  const supportersMap = useSelector(getOptimisticSupporters)
  const blockeeList = useSelector(getBlockees)
  const isBlockee = blockeeList.includes(user.user_id)

  const { canCreateChat, callToAction } = useSelector((state) =>
    getCanCreateChat(state, { userId: user.user_id })
  )

  const handleComposeClicked = useCallback(() => {
    if (canCreateChat) {
      closeParentModal()
      dispatch(createChat({ userIds: [user.user_id], presetMessage }))
    } else {
      openInboxUnavailableModal(user)
    }
  }, [
    dispatch,
    user,
    canCreateChat,
    openInboxUnavailableModal,
    closeParentModal,
    presetMessage
  ])

  const handleVisitClicked = useCallback(() => {
    dispatch(pushRoute(profilePage(user.handle)))
    closeParentModal()
  }, [dispatch, user, closeParentModal])

  const handleBlockClicked = useCallback(() => {
    dispatch(blockUser({ userId: user.user_id }))
  }, [dispatch, user])

  const handleUnblockClicked = useCallback(() => {
    dispatch(unblockUser({ userId: user.user_id }))
  }, [dispatch, user])

  const items = [
    canCreateChat
      ? {
          icon: <IconMessage />,
          text: messages.message,
          onClick: handleComposeClicked
        }
      : null,
    { icon: <IconUser />, text: messages.visit, onClick: handleVisitClicked },
    isBlockee
      ? {
          icon: <IconUnblockMessages />,
          text: messages.unblock,
          onClick: handleUnblockClicked
        }
      : {
          icon: <IconMessageBlock />,
          text: messages.block,
          onClick: handleBlockClicked
        }
  ].filter(removeNullable)

  useEffect(() => {
    if (
      currentUserId &&
      supportingMap[currentUserId]?.[user.user_id] &&
      !supportersMap[user.user_id]
    ) {
      dispatch(fetchSupportersForUser({ userId: user.user_id }))
    }
  }, [dispatch, currentUserId, supportingMap, supportersMap, user])

  useEffect(() => {
    dispatch(fetchPermissions({ userIds: [user.user_id] }))
  }, [dispatch, user])

  if (currentUserId === user.user_id) {
    return null
  }

  return (
    <div className={styles.root}>
      <ArtistChip
        className={styles.artistChip}
        user={user}
        showPopover={false}
        showSupportFor={currentUserId ?? undefined}
        customChips={canCreateChat ? null : renderCustomChip(callToAction)}
        onClickArtistName={handleComposeClicked}
      />
      <PopupMenu
        renderTrigger={renderTrigger}
        items={items}
        zIndex={zIndex.MODAL_OVERFLOW_MENU_POPUP}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      />
    </div>
  )
}
