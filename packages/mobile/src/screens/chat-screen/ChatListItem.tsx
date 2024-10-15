import { useCallback, useMemo } from 'react'

import { useProxySelector } from '@audius/common/hooks'
import { chatSelectors } from '@audius/common/store'
import { css } from '@emotion/native'
import { useTheme } from '@emotion/react'
import { TouchableHighlight } from 'react-native'

import { Box, Flex, Text } from '@audius/harmony-native'
import { ProfilePicture } from 'app/components/core'
import { UserBadges } from 'app/components/user-badges'
import { useNavigation } from 'app/hooks/useNavigation'

import type { AppTabScreenParamList } from '../app-screen'

import { ChatListItemSkeleton } from './ChatListItemSkeleton'

const { getSingleOtherChatUser, getChat } = chatSelectors

const messages = {
  new: 'new'
}

const clipMessageCount = (count: number) => {
  if (count > 9) {
    return '9+'
  }
  return count.toString()
}

const useRemoveLeadingWhitespace = (message: string) => {
  return useMemo(() => message.replace(/^\s+/, ''), [message])
}

export const ChatListItem = ({ chatId }: { chatId: string }) => {
  const { spacing } = useTheme()
  const navigation = useNavigation<AppTabScreenParamList>()

  const chat = useProxySelector((state) => getChat(state, chatId), [chatId])
  const otherUser = useProxySelector(
    (state) => getSingleOtherChatUser(state, chatId),
    [chatId]
  )
  const lastMessage = useRemoveLeadingWhitespace(
    (!chat?.is_blast && chat?.last_message) || ''
  )

  const handlePress = useCallback(() => {
    navigation.push('Chat', { chatId })
  }, [navigation, chatId])

  return (
    <TouchableHighlight onPress={handlePress}>
      {otherUser ? (
        <Flex
          column
          pv='l'
          ph='xl'
          backgroundColor='white'
          borderBottom='default'
          w='100%'
        >
          <Flex row justifyContent='space-between' w='100%' gap='s'>
            <Flex row flex={1} justifyContent='space-between'>
              <ProfilePicture
                userId={otherUser.user_id}
                style={css({ width: spacing.unit12, height: spacing.unit12 })}
              />
              <Flex column pt='2xs' ml='s' mb='s' flex={1}>
                <Flex row mb='xs' wrap='nowrap'>
                  <Text
                    size='l'
                    strength='strong'
                    numberOfLines={1}
                    flexShrink={1}
                  >
                    {otherUser.name}
                  </Text>
                  <UserBadges user={otherUser} hideName />
                </Flex>
                <Text size='s' numberOfLines={1}>
                  @{otherUser.handle}
                </Text>
              </Flex>
            </Flex>
            {chat?.unread_message_count && chat?.unread_message_count > 0 ? (
              <Box style={css({ flexShrink: 0 })}>
                <Flex
                  pv='xs'
                  ph='s'
                  borderRadius='xs'
                  backgroundColor='accent'
                  justifyContent='center'
                  alignItems='center'
                >
                  <Text
                    variant='heading'
                    size='xs'
                    textTransform='uppercase'
                    strength='strong'
                    color='staticWhite'
                    style={css({ letterSpacing: 0.5 })}
                  >
                    {clipMessageCount(chat?.unread_message_count ?? 0)}{' '}
                    {messages.new}
                  </Text>
                </Flex>
              </Box>
            ) : null}
          </Flex>
          <Text numberOfLines={1}>{lastMessage}</Text>
        </Flex>
      ) : (
        <ChatListItemSkeleton />
      )}
    </TouchableHighlight>
  )
}
