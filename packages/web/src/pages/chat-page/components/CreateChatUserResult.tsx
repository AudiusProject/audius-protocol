import { useCallback, useEffect } from 'react'

import { useSupporters } from '@audius/common/api'
import { User } from '@audius/common/models'
import {
  ChatPermissionAction,
  accountSelectors,
  chatActions,
  chatSelectors
} from '@audius/common/store'
import { removeNullable, route } from '@audius/common/utils'
import {
  IconButton,
  IconKebabHorizontal,
  IconMessage,
  IconMessageSlash,
  IconMessageUnblock as IconUnblockMessages,
  IconUser,
  PopupMenu
} from '@audius/harmony'
import { useDispatch } from 'react-redux'

import { useSelector } from 'common/hooks/useSelector'
import ArtistChip from 'components/artist/ArtistChip'
import { push } from 'utils/navigation'
import zIndex from 'utils/zIndex'

import styles from './CreateChatUserResult.module.css'
import { useComposeChat } from './useComposeChat'

const { profilePage } = route

const messages = {
  moreOptions: 'More options',
  message: 'Message This User',
  visit: "Visit User's Profile",
  block: 'Block Messages',
  unblock: 'Unblock Messages',
  notPermitted: 'Cannot Be Messaged',
  sendTipRequired: 'Send a Tip to Message',
  unblockRequired: 'Blocked',
  followRequired: 'Follow to Message'
}

type UserResultComposeProps = {
  user: User
  closeParentModal: () => void
  openInboxUnavailableModal: (user: User) => void
  presetMessage?: string
}

const { blockUser, unblockUser } = chatActions
const { getCanCreateChat } = chatSelectors

const renderTrigger = (
  anchorRef: React.MutableRefObject<any>,
  triggerPopup: () => void
) => (
  <IconButton
    ref={anchorRef}
    aria-label={messages.moreOptions}
    icon={IconKebabHorizontal}
    color='default'
    onClick={triggerPopup}
  />
)

const renderCustomChip = (callToAction: ChatPermissionAction) => {
  switch (callToAction) {
    case ChatPermissionAction.TIP:
      return (
        <div className={styles.notPermitted}>
          <IconMessageSlash size='s' color='default' />
          <span>{messages.sendTipRequired}</span>
        </div>
      )
    case ChatPermissionAction.FOLLOW:
      return (
        <div className={styles.notPermitted}>
          <IconMessageSlash size='s' color='default' />
          <span>{messages.followRequired}</span>
        </div>
      )
    case ChatPermissionAction.UNBLOCK:
      return (
        <div className={styles.notPermitted}>
          <IconMessageSlash size='s' color='default' />
          <span>{messages.unblockRequired}</span>
        </div>
      )
    default:
      return (
        <div className={styles.notPermitted}>
          <IconMessageSlash size='s' color='default' />
          <span>{messages.notPermitted}</span>
        </div>
      )
  }
}

export const CreateChatUserResult = (props: UserResultComposeProps) => {
  const dispatch = useDispatch()
  const { user, closeParentModal, openInboxUnavailableModal, presetMessage } =
    props
  const currentUserId = useSelector(accountSelectors.getUserId)
  const blockeeList = useSelector(chatSelectors.getBlockees)
  const isBlockee = blockeeList.includes(user.user_id)

  const { canCreateChat, callToAction } = useSelector((state) =>
    getCanCreateChat(state, { userId: user.user_id })
  )

  const { data: supporters = [] } = useSupporters({
    userId: user.user_id,
    limit: 1
  })

  const handleComposeClicked = useComposeChat({
    user,
    onOpenChat: closeParentModal,
    onInboxUnavailable: openInboxUnavailableModal,
    presetMessage
  })

  const handleVisitClicked = useCallback(() => {
    dispatch(push(profilePage(user.handle)))
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
          icon: <IconMessageSlash />,
          text: messages.block,
          onClick: handleBlockClicked
        }
  ].filter(removeNullable)

  useEffect(() => {
    if (
      currentUserId &&
      supporters.some((s) => s.sender.user_id === currentUserId)
    ) {
      // No need to fetch supporters if we're already a supporter
    }
  }, [currentUserId, supporters])

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
