import { forwardRef, useCallback } from 'react'

import { useProxySelector, chatSelectors } from '@audius/common'
import { IconButton, IconCompose, IconSettings } from '@audius/stems'

import { useModalState } from 'common/hooks/useModalState'

import styles from './ChatHeader.module.css'
import { ChatUser } from './ChatUser'

const messages = {
  header: 'Messages',
  settings: 'Settings',
  compose: 'Compose'
}

const { getOtherChatUsers } = chatSelectors

type ChatHeaderProps = { currentChatId?: string }

export const ChatHeader = forwardRef<HTMLDivElement, ChatHeaderProps>(
  ({ currentChatId }, ref) => {
    const [, setCreateChatVisible] = useModalState('CreateChat')
    const [, setInboxSettingsVisible] = useModalState('InboxSettings')
    const users = useProxySelector(
      (state) => getOtherChatUsers(state, currentChatId),
      [currentChatId]
    )

    const handleComposeClicked = useCallback(() => {
      setCreateChatVisible(true)
    }, [setCreateChatVisible])

    const handleSettingsClicked = useCallback(() => {
      setInboxSettingsVisible(true)
    }, [setInboxSettingsVisible])

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
          {users.length > 0 ? <ChatUser user={users[0]} /> : null}
        </div>
      </div>
    )
  }
)
