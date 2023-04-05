import { useCallback, useEffect } from 'react'

import {
  accountSelectors,
  chatActions,
  chatSelectors,
  tippingActions,
  tippingSelectors,
  User
} from '@audius/common'
import {
  IconBlockMessages,
  IconButton,
  IconKebabHorizontal,
  IconMessage,
  IconUnblockMessages,
  IconUser,
  PopupMenu,
  PopupPosition
} from '@audius/stems'
import { push as pushRoute } from 'connected-react-router'
import { useDispatch, useSelector } from 'react-redux'

import ArtistChip from 'components/artist/ArtistChip'
import { profilePage } from 'utils/route'
import zIndex from 'utils/zIndex'

import styles from './CreateChatUserResult.module.css'

const messages = {
  moreOptions: 'More options',
  message: 'Message This User',
  visit: "Visit User's Profile",
  block: 'Block Messages',
  unblock: 'Unblock Messages'
}

type UserResultComposeProps = {
  user: User
  closeModal: () => void
}

const { getUserId } = accountSelectors
const { getOptimisticSupporters, getOptimisticSupporting } = tippingSelectors

const { fetchSupportersForUser } = tippingActions
const { createChat, blockUser, unblockUser } = chatActions
const { getBlockees } = chatSelectors

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

export const MessageUserSearchResult = (props: UserResultComposeProps) => {
  const dispatch = useDispatch()
  const { user, closeModal } = props
  const currentUserId = useSelector(getUserId)
  const supportingMap = useSelector(getOptimisticSupporting)
  const supportersMap = useSelector(getOptimisticSupporters)
  const blockeeList = useSelector(getBlockees)
  const isBlocked = blockeeList.includes(user.user_id)

  const handleComposeClicked = useCallback(() => {
    dispatch(createChat({ userIds: [user.user_id] }))
  }, [dispatch, user])

  const handleVisitClicked = useCallback(() => {
    dispatch(pushRoute(profilePage(user.handle)))
    closeModal()
  }, [dispatch, user, closeModal])

  const handleBlockClicked = useCallback(() => {
    dispatch(blockUser({ userId: user.user_id }))
  }, [dispatch, user])

  const handleUnblockClicked = useCallback(() => {
    dispatch(unblockUser({ userId: user.user_id }))
  }, [dispatch, user])

  const items = [
    {
      icon: <IconMessage />,
      text: messages.message,
      onClick: handleComposeClicked
    },
    { icon: <IconUser />, text: messages.visit, onClick: handleVisitClicked },
    isBlocked
      ? {
          icon: <IconUnblockMessages />,
          text: messages.unblock,
          onClick: handleUnblockClicked
        }
      : {
          icon: <IconBlockMessages />,
          text: messages.block,
          onClick: handleBlockClicked
        }
  ]

  useEffect(() => {
    if (
      currentUserId &&
      supportingMap[currentUserId]?.[user.user_id] &&
      !supportersMap[user.user_id]
    ) {
      dispatch(fetchSupportersForUser({ userId: user.user_id }))
    }
  }, [dispatch, currentUserId, supportingMap, supportersMap, user])

  return (
    <div className={styles.root}>
      <ArtistChip
        className={styles.artistChip}
        user={user}
        showPopover={false}
        showSupportFor={currentUserId ?? undefined}
        onClickArtistName={handleComposeClicked}
      />
      <PopupMenu
        renderTrigger={renderTrigger}
        items={items}
        zIndex={zIndex.MODAL_OVERFLOW_MENU_POPUP}
        position={PopupPosition.BOTTOM_LEFT}
      />
    </div>
  )
}
