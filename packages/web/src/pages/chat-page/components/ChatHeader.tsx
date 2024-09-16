import { forwardRef, useCallback } from 'react'

import { useChatBlastAudienceContent } from '@audius/common/hooks'
import {
  chatSelectors,
  CommonState,
  useCreateChatModal
} from '@audius/common/store'
import { route } from '@audius/common/utils'
import {
  IconCompose,
  IconSettings,
  IconButton,
  Paper,
  Flex
} from '@audius/harmony'
import { ChatBlast } from '@audius/sdk'
import { push as pushRoute } from 'connected-react-router'
import { useDispatch, useSelector } from 'react-redux'

import { useModalState } from 'common/hooks/useModalState'
import { HeaderGutter } from 'components/header/desktop/HeaderGutter'

import { ChatBlastHeader } from './ChatBlastHeader'
import styles from './ChatHeader.module.css'
import { UserChatHeader } from './UserChatHeader'

const { profilePage } = route

const messages = {
  header: 'Messages',
  settings: 'Settings',
  compose: 'Compose',
  chatSettings: 'Chat Settings',
  block: 'Block Messages',
  unblock: 'Unblock Messages',
  report: 'Report Abuse',
  delete: 'Delete Conversation',
  visit: "Visit User's Profile"
}

const { getOtherChatUsers, getBlockees } = chatSelectors

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
    const { chatBlastTitle, contentTitle, audienceCount } =
      useChatBlastAudienceContent({
        chat: isBlast ? chat : ({} as ChatBlast)
      })

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
              <UserChatHeader chatId={chat?.chat_id ?? ''} />
            )}
          </Flex>
        </Paper>
      </>
    )
  }
)
