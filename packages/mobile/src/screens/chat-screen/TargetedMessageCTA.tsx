import React, { useCallback } from 'react'

import { useGetCurrentUserId } from '@audius/common/api'
import { useSelectTierInfo } from '@audius/common/hooks'

import {
  Box,
  Flex,
  Text,
  IconTowerBroadcast,
  IconCaretRight,
  useTheme,
  IconVerified,
  IconTokenBronze
} from '@audius/harmony-native'

import { useTargetedMessageModal } from '../../../../common/src/store/ui/modals/create-targeted-message-modal'

const messages = {
  title: 'Send a Targeted Message',
  description: 'Send messages to your fans in bulk.',
  badgeRequired: 'Badge Required',
  or: 'or'
}

type TargetedMessageCTAProps = {
  onClick: () => void
}

export const TargetedMessageCTA = (props: TargetedMessageCTAProps) => {
  const { onClick } = props
  const { color } = useTheme()

  const { onOpen: openTargetedMessageModal } = useTargetedMessageModal()

  const { data: userId } = useGetCurrentUserId({})
  const { tierNumber, isVerified } = useSelectTierInfo(userId ?? 0) ?? {}
  const userMeetsRequirements = isVerified || (tierNumber && tierNumber > 0)

  const handleClick = useCallback(() => {
    onClick()
    openTargetedMessageModal()
  }, [onClick, openTargetedMessageModal])

  // DEBUG
  if (!userMeetsRequirements) {
    return <TargetedMessageDisabled />
  }

  return (
    <Box
      backgroundColor='surface1'
      ph='xl'
      pv='l'
      borderTop='strong'
      // css={{
      //   ':hover': {
      //     backgroundColor: color.background.surface2
      //   }
      // }}
      onTouchEnd={handleClick}
    >
      <Flex
        direction='row'
        alignItems='center'
        gap='l'
        justifyContent='space-between'
      >
        <Flex direction='row' alignItems='center' gap='s'>
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

const TargetedMessageDisabled = () => {
  const { spacing } = useTheme()

  return (
    <Flex
      direction='row'
      backgroundColor='surface1'
      ph='xl'
      pv='l'
      borderTop='strong'
      wrap='nowrap'
      justifyContent='space-between'
    >
      <Flex
        direction='row'
        alignItems='center'
        gap='s'
        style={{ opacity: 0.5 }}
      >
        <IconTowerBroadcast size='l' color='default' />
        <Text variant='title'>{messages.title}</Text>
      </Flex>
      <Flex direction='row' border='strong' borderRadius='m' wrap='nowrap'>
        <Box ph='s' pv={spacing.unitHalf}>
          <Text size='s' strength='strong'>
            {messages.badgeRequired}
          </Text>
        </Box>
        <Flex
          direction='row'
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
