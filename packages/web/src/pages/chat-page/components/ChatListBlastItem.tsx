import React from 'react'

import { useGetCurrentUser, useGetCurrentUserId } from '@audius/common/api'
import { Flex, IconTowerBroadcast, IconUser, Text } from '@audius/harmony'
import { ChatBlastAudience } from '@audius/sdk'

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
  audience: ChatBlastAudience
  blastId: string
  onChatClicked: (chatId: string) => void
}

export const ChatListBlastItem = (props: ChatListBlastItemProps) => {
  const { audience, blastId, onChatClicked } = props

  const { data: user } = useGetCurrentUser()
  const audienceCount = user?.follower_count ?? 0

  return (
    <Flex
      ph='xl'
      pv='l'
      direction='column'
      gap='s'
      borderBottom='default'
      onClick={() => onChatClicked(blastId)}
    >
      <Flex gap='s'>
        <IconTowerBroadcast size='l' color='default' />
        <Text size='l' strength='strong'>
          {messages[audience].title}
        </Text>
      </Flex>
      <Flex justifyContent='space-between'>
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
