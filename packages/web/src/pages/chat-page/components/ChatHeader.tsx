import { forwardRef, useCallback } from 'react'

import {
  chatSelectors,
  CommonState,
  useCreateChatModal
} from '@audius/common/store'
import {
  IconCompose,
  IconSettings,
  IconButton,
  Paper,
  Flex
} from '@audius/harmony'
import { useSelector } from 'react-redux'

import { useModalState } from 'common/hooks/useModalState'
import { HeaderGutter } from 'components/header/desktop/HeaderGutter'

import { ChatBlastHeader } from './ChatBlastHeader'
import styles from './ChatHeader.module.css'
import { UserChatHeader } from './UserChatHeader'

const messages = {
  header: 'Messages',
  settings: 'Settings',
  compose: 'Compose'
}

type ChatHeaderProps = {
  currentChatId?: string
  scrollBarWidth?: number
  headerContainerRef?: React.RefObject<HTMLDivElement>
}

export const ChatHeader = forwardRef<HTMLDivElement, ChatHeaderProps>(
  ({ currentChatId, scrollBarWidth, headerContainerRef }, ref) => {
    const { onOpen: openCreateChatModal } = useCreateChatModal()
    const [, setInboxSettingsVisible] = useModalState('InboxSettings')
    const chat = useSelector((state: CommonState) =>
      chatSelectors.getChat(state, currentChatId ?? '')
    )
    const isBlast = chat?.is_blast

    const handleComposeClicked = useCallback(() => {
      openCreateChatModal()
    }, [openCreateChatModal])

    const handleSettingsClicked = useCallback(() => {
      setInboxSettingsVisible(true)
    }, [setInboxSettingsVisible])

    return (
      <>
        <HeaderGutter
          headerContainerRef={headerContainerRef}
          scrollBarWidth={scrollBarWidth}
          className={styles.gutterOverride}
        />
        <Paper
          shadow='flat'
          ref={ref}
          css={{
            marginLeft: -20,
            height: 112
          }}
        >
          <Flex className={styles.left}>
            <h1 className={styles.header}>{messages.header}</h1>
            <div className={styles.options}>
              <IconButton
                aria-label={messages.settings}
                icon={IconSettings}
                color='default'
                onClick={handleSettingsClicked}
              />
              <IconButton
                aria-label={messages.compose}
                icon={IconCompose}
                color='default'
                onClick={handleComposeClicked}
              />
            </div>
          </Flex>
          <Flex className={styles.right}>
            {isBlast ? (
              <ChatBlastHeader chat={chat} />
            ) : (
              <UserChatHeader chatId={chat?.chat_id} />
            )}
          </Flex>
        </Paper>
      </>
    )
  }
)
