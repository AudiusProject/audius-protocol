import React, { useCallback } from 'react'

import { useGetCurrentUserId } from '@audius/common/api'
import { useRemoteVar, useSelectTierInfo } from '@audius/common/hooks'
import { IntKeys } from '@audius/common/services'
import { useChatBlastModal } from '@audius/common/src/store/ui/modals/create-chat-blast-modal'
import {
  Box,
  Flex,
  Text,
  IconTowerBroadcast,
  IconCaretRight,
  useTheme,
  IconVerified,
  IconTokenBronze
} from '@audius/harmony'

const messages = {
  title: 'Send a Targeted Message',
  description: 'Send messages to your fans in bulk.',
  badgeRequired: 'Badge Required',
  or: 'or'
}

type ChatBlastCTAProps = {
  onClick: () => void
}

export const ChatBlastCTA = (props: ChatBlastCTAProps) => {
  const { onClick } = props
  const { color } = useTheme()

  const { onOpen: openChatBlastModal } = useChatBlastModal()

  const { data: userId } = useGetCurrentUserId({})
  const { tierNumber, isVerified } = useSelectTierInfo(userId ?? 0) ?? {}
  const chatBlastTier = useRemoteVar(IntKeys.CHAT_BLAST_TIER_REQUIREMENT)
  const userMeetsRequirements =
    isVerified || (tierNumber && tierNumber >= chatBlastTier)

  const handleClick = useCallback(() => {
    onClick()
    openChatBlastModal()
  }, [onClick, openChatBlastModal])

  if (!userMeetsRequirements) {
    return <ChatBlastDisabled />
  }

  return (
    <Box
      backgroundColor='surface1'
      ph='xl'
      pv='l'
      borderTop='strong'
      css={{
        ':hover': {
          backgroundColor: color.background.surface2
        }
      }}
      onClick={handleClick}
    >
      <Flex alignItems='center' gap='l' justifyContent='space-between'>
        <Flex alignItems='center' gap='s'>
          <IconTowerBroadcast size='3xl' color='default' />
          <Flex direction='column' gap='xs'>
            <Text variant='title'>{messages.title}</Text>
            <Text size='s'>{messages.description}</Text>
          </Flex>
        </Flex>
        <IconCaretRight size='s' color='default' />
      </Flex>
    </Box>
  )
}

const ChatBlastDisabled = () => {
  const { spacing } = useTheme()

  return (
    <Flex
      backgroundColor='surface1'
      ph='xl'
      pv='l'
      borderTop='strong'
      wrap='nowrap'
      justifyContent='space-between'
    >
      <Flex alignItems='center' gap='s' css={{ opacity: 0.5 }}>
        <IconTowerBroadcast size='l' color='default' />
        <Text variant='title'>{messages.title}</Text>
      </Flex>
      <Flex border='strong' borderRadius='m' wrap='nowrap'>
        <Box ph='s' pv={spacing.unitHalf}>
          <Text size='s' strength='strong'>
            {messages.badgeRequired}
          </Text>
        </Box>
        <Flex
          borderLeft='strong'
          ph='s'
          gap='xs'
          alignItems='center'
          backgroundColor='surface2'
          borderTopRightRadius='m'
          borderBottomRightRadius='m'
        >
          <IconVerified size='s' />
          <Text size='s'>{messages.or}</Text>
          <IconTokenBronze size='s' />
        </Flex>
      </Flex>
    </Flex>
  )
}
