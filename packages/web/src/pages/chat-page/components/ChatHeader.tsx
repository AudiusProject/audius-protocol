import { forwardRef, useCallback } from 'react'

import {
  useProxySelector,
  chatSelectors,
  chatActions,
  User
} from '@audius/common'
import {
  IconButton,
  IconCompose,
  IconSettings,
  IconKebabHorizontal,
  PopupMenu,
  IconBlockMessages,
  IconUnblockMessages,
  IconUser,
  IconTrash
} from '@audius/stems'
import { push as pushRoute } from 'connected-react-router'
import { useDispatch, useSelector } from 'react-redux'

import { useModalState } from 'common/hooks/useModalState'
import { profilePage } from 'utils/route'

import styles from './ChatHeader.module.css'
import { ChatUser } from './ChatUser'

const messages = {
  header: 'Messages',
  settings: 'Settings',
  compose: 'Compose',
  chatSettings: 'Chat Settings',
  block: 'Block Messages',
  unblock: 'Unblock Messages',
  delete: 'Delete Conversation',
  visit: "Visit User's Profile"
}

const { getOtherChatUsers, getBlockees } = chatSelectors
const { blockUser, unblockUser, deleteChat } = chatActions

type ChatHeaderProps = { currentChatId?: string }

export const ChatHeader = forwardRef<HTMLDivElement, ChatHeaderProps>(
  ({ currentChatId }, ref) => {
    const dispatch = useDispatch()
    const [, setCreateChatVisible] = useModalState('CreateChat')
    const [, setInboxSettingsVisible] = useModalState('InboxSettings')
    const users = useProxySelector(
      (state) => getOtherChatUsers(state, currentChatId),
      [currentChatId]
    )
    const user: User | null = users[0] ?? null
    const blockeeList = useSelector(getBlockees)
    const isBlocked = user && blockeeList.includes(user.user_id)

    const handleComposeClicked = useCallback(() => {
      setCreateChatVisible(true)
    }, [setCreateChatVisible])

    const handleSettingsClicked = useCallback(() => {
      setInboxSettingsVisible(true)
    }, [setInboxSettingsVisible])

    const handleUnblockClicked = useCallback(() => {
      dispatch(unblockUser({ userId: user.user_id }))
    }, [dispatch, user])

    const handleBlockClicked = useCallback(() => {
      dispatch(blockUser({ userId: user.user_id }))
    }, [dispatch, user])

    const handleVisitClicked = useCallback(() => {
      dispatch(pushRoute(profilePage(user.handle)))
    }, [dispatch, user])

    const handleDeleteClicked = useCallback(() => {
      if (currentChatId) {
        dispatch(deleteChat({ chatId: currentChatId }))
      }
    }, [dispatch, currentChatId])

    const overflowItems = [
      isBlocked
        ? {
            text: messages.unblock,
            icon: <IconUnblockMessages />,
            onClick: handleUnblockClicked
          }
        : {
            text: messages.block,
            icon: <IconBlockMessages />,
            onClick: handleBlockClicked
          },
      {
        text: messages.delete,
        icon: <IconTrash />,
        onClick: handleDeleteClicked
      },
      {
        text: messages.visit,
        icon: <IconUser />,
        onClick: handleVisitClicked
      }
    ]

    return (
      <div ref={ref} className={styles.root}>
        <div className={styles.left}>
          <h1 className={styles.header}>{messages.header}</h1>
          <div className={styles.options}>
            <IconButton
              aria-label={messages.settings}
              icon={<IconSettings className={styles.icon} />}
              onClick={handleSettingsClicked}
            />
            <IconButton
              aria-label={messages.compose}
              icon={<IconCompose className={styles.icon} />}
              onClick={handleComposeClicked}
            />
          </div>
        </div>
        <div className={styles.right}>
          {user ? <ChatUser user={user} key={user.user_id} /> : null}
          {user ? (
            <div className={styles.overflow}>
              <PopupMenu
                items={overflowItems}
                transformOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                renderTrigger={(ref, trigger) => (
                  <IconButton
                    ref={ref}
                    aria-label={messages.chatSettings}
                    icon={<IconKebabHorizontal />}
                    onClick={trigger}
                  />
                )}
              />
            </div>
          ) : null}
        </div>
      </div>
    )
  }
)
