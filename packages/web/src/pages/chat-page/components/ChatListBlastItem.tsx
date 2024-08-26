import { useCallback } from 'react'

import { useGetCurrentUser } from '@audius/common/api'
import { Flex, IconTowerBroadcast, IconUser, Text } from '@audius/harmony'
import { ChatBlast, ChatBlastAudience } from '@audius/sdk'
import cn from 'classnames'

import styles from './ChatListItem.module.css'

const messages = {
  audience: 'AUDIENCE',
  [ChatBlastAudience.FOLLOWERS]: {
    title: 'All Followers'
  },
  [ChatBlastAudience.TIPPERS]: {
    title: 'All Supporters'
  },
  [ChatBlastAudience.CUSTOMERS]: {
    // TODO: per track messages
    title: 'All Purchasers'
  },
  [ChatBlastAudience.REMIXERS]: {
    // TODO: per track messages
    title: 'All Remix Creators'
  }
}

type ChatListBlastItemProps = {
  chat: ChatBlast
  currentChatId?: string
  onChatClicked: (chatId: string) => void
}

export const ChatListBlastItem = (props: ChatListBlastItemProps) => {
  const { chat, onChatClicked, currentChatId } = props
  const { chat_id: chatId, audience } = chat
  const isCurrentChat = currentChatId && currentChatId === chatId

  const { data: user } = useGetCurrentUser()
  const audienceCount = user?.follower_count ?? 0

  const handleClick = useCallback(() => {
    onChatClicked(chatId)
  }, [chatId, onChatClicked])

  return (
    <Flex
      ph='xl'
      pv='l'
      direction='column'
      gap='s'
      borderBottom='default'
      onClick={handleClick}
      className={cn(styles.root, { [styles.active]: isCurrentChat })}
    >
      <Flex gap='s'>
        <IconTowerBroadcast size='l' color='default' />
        <Text size='l' strength='strong'>
          {messages[audience].title}
        </Text>
      </Flex>
      <Flex justifyContent='space-between' w='100%'>
        <Text variant='label' textTransform='capitalize' color='subdued'>
          {messages.audience}
        </Text>
        <Flex gap='xs'>
          <IconUser size='s' color='subdued' />
          <Text variant='label' color='subdued'>
            {audienceCount}
          </Text>
        </Flex>
      </Flex>
    </Flex>
  )
}
