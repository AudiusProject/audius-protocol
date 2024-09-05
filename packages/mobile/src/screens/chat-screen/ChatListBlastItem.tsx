import { useCallback } from 'react'

import { useChatBlastAudienceContent } from '@audius/common/hooks'
import { css } from '@emotion/native'
import { TouchableHighlight } from 'react-native'

import {
  Text,
  Flex,
  IconTowerBroadcast,
  IconUser
} from '@audius/harmony-native'
import { useNavigation } from 'app/hooks/useNavigation'

import type { AppTabScreenParamList } from '../app-screen'

const messages = {
  audience: 'audience'
}

export const ChatListBlastItem = ({ chatId }: { chatId: string }) => {
  const navigation = useNavigation<AppTabScreenParamList>()

  const handlePress = useCallback(() => {
    navigation.push('Chat', { chatId })
  }, [navigation, chatId])

  const { audienceCount, contentTitle, chatBlastTitle } =
    useChatBlastAudienceContent({ chatId })

  return (
    <TouchableHighlight onPress={handlePress}>
      <Flex
        ph='xl'
        pv='l'
        backgroundColor='white'
        borderBottom='default'
        gap='s'
      >
        <Flex row gap='s' w='100%' style={css({ overflow: 'hidden' })}>
          <IconTowerBroadcast width={24} height={24} color='default' />
          <Text variant='body' size='l' strength='strong'>
            {chatBlastTitle}
          </Text>
          {contentTitle ? (
            <Text
              variant='body'
              size='l'
              color='subdued'
              strength='strong'
              // numberOfLines={1}
              // ellipses
            >
              {contentTitle}
            </Text>
          ) : null}
        </Flex>
        <Flex row justifyContent='space-between' w='100%'>
          <Text variant='label' textTransform='uppercase' color='subdued'>
            {messages.audience}
          </Text>
          {audienceCount ? (
            <Flex row gap='xs'>
              <IconUser width={16} height={16} color='subdued' />
              <Text variant='label' color='subdued'>
                {audienceCount}
              </Text>
            </Flex>
          ) : null}
        </Flex>
      </Flex>
    </TouchableHighlight>
  )
}
