import { useCallback } from 'react'

import { useChatBlastAudienceContent } from '@audius/common/hooks'
import { Flex, IconTowerBroadcast, IconUser, Text } from '@audius/harmony'
import cn from 'classnames'

import styles from './ChatListItem.module.css'

const messages = {
  audience: 'AUDIENCE'
}

type ChatListBlastItemProps = {
  chatId: string
  currentChatId?: string
  onChatClicked: (chatId: string) => void
}

export const ChatListBlastItem = (props: ChatListBlastItemProps) => {
  const { chatId, onChatClicked, currentChatId } = props
  const isCurrentChat = currentChatId && currentChatId === chatId
  const { chatBlastTitle, contentTitle, audienceCount } =
    useChatBlastAudienceContent({
      chatId
    })

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
      <Flex gap='s' css={{ overflow: 'hidden' }}>
        <IconTowerBroadcast size='l' color='default' />
        <Text size='l' strength='strong' css={{ whiteSpace: 'nowrap' }}>
          {chatBlastTitle}
        </Text>
        {contentTitle ? (
          <Text
            size='l'
            color='subdued'
            css={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {contentTitle}
          </Text>
        ) : null}
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
