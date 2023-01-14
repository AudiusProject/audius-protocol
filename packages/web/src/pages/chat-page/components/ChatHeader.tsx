import { forwardRef } from 'react'

import { useProxySelector, chatSelectors } from '@audius/common'
import { IconSettings } from '@audius/stems'

import styles from './ChatHeader.module.css'
import { ChatUser } from './ChatUser'

const messages = {
  header: 'Messages'
}

const { getOtherChatUsers } = chatSelectors

type ChatHeaderProps = { currentChatId?: string }

export const ChatHeader = forwardRef<HTMLDivElement, ChatHeaderProps>(
  ({ currentChatId }, ref) => {
    const users = useProxySelector(
      (state) => getOtherChatUsers(state, currentChatId),
      [currentChatId]
    )
    return (
      <div ref={ref} className={styles.root}>
        <div className={styles.left}>
          <h1 className={styles.header}>{messages.header}</h1>
          <div className={styles.options}>
            <IconSettings />
            {/* <IconCompose /> */}
          </div>
        </div>
        <div className={styles.right}>
          {users.length > 0 ? <ChatUser user={users[0]} /> : null}
        </div>
      </div>
    )
  }
)
