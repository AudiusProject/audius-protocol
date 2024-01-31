import { chatSelectors } from '@audius/common/store'
import { useCallback, useMemo } from 'react'

import { useProxySelector } from '@audius/common/hooks'
import { View, TouchableHighlight } from 'react-native'

import { Text } from 'app/components/core'
import { ProfilePicture } from 'app/components/user'
import { UserBadges } from 'app/components/user-badges'
import { useNavigation } from 'app/hooks/useNavigation'
import { makeStyles } from 'app/styles'

import type { AppTabScreenParamList } from '../app-screen'

import { ChatListItemSkeleton } from './ChatListItemSkeleton'

const { getSingleOtherChatUser, getChat } = chatSelectors

const messages = {
  new: 'new'
}

export const useStyles = makeStyles(({ spacing, palette, typography }) => ({
  root: {
    paddingVertical: spacing(4),
    paddingHorizontal: spacing(6),
    backgroundColor: palette.white,
    borderColor: palette.neutralLight8,
    borderBottomWidth: 1
  },
  contentRoot: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  profilePicture: {
    width: spacing(12),
    height: spacing(12),
    borderWidth: 1,
    borderColor: palette.neutralLight9
  },
  userContainer: {
    display: 'flex',
    flexDirection: 'row'
  },
  userTextContainer: {
    display: 'flex',
    flexDirection: 'column',
    paddingTop: 2,
    marginLeft: spacing(2),
    marginBottom: spacing(2)
  },
  userNameContainer: {
    display: 'flex',
    flexDirection: 'row',
    marginBottom: spacing(1)
  },
  userName: {
    fontSize: typography.fontSize.large,
    fontFamily: typography.fontByWeight.bold,
    color: palette.neutral
  },
  handle: {
    fontSize: typography.fontSize.small
  },
  unreadCountContainer: {
    paddingVertical: spacing(1.5),
    paddingHorizontal: spacing(2),
    borderRadius: spacing(0.5),
    backgroundColor: palette.secondary
  },
  unreadCount: {
    fontSize: typography.fontSize.xxs,
    textTransform: 'uppercase',
    fontFamily: typography.fontByWeight.heavy,
    color: palette.white,
    letterSpacing: 0.5
  }
}))

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
  const navigation = useNavigation<AppTabScreenParamList>()
  const styles = useStyles()

  const chat = useProxySelector((state) => getChat(state, chatId), [chatId])
  const otherUser = useProxySelector(
    (state) => getSingleOtherChatUser(state, chatId),
    [chatId]
  )
  const lastMessage = useRemoveLeadingWhitespace(chat?.last_message ?? '')

  const handlePress = useCallback(() => {
    navigation.push('Chat', { chatId })
  }, [navigation, chatId])

  return (
    <TouchableHighlight onPress={handlePress}>
      {otherUser ? (
        <View style={styles.root}>
          <View style={styles.contentRoot}>
            <View style={styles.userContainer}>
              <ProfilePicture
                profile={otherUser}
                style={styles.profilePicture}
              />
              <View style={styles.userTextContainer}>
                <View style={styles.userNameContainer}>
                  <Text style={styles.userName}>{otherUser.name}</Text>
                  <UserBadges user={otherUser} hideName />
                </View>
                <Text style={styles.handle}>@{otherUser.handle}</Text>
              </View>
            </View>
            {chat?.unread_message_count && chat?.unread_message_count > 0 ? (
              <View>
                <View style={styles.unreadCountContainer}>
                  <Text style={styles.unreadCount}>
                    {clipMessageCount(chat?.unread_message_count ?? 0)}{' '}
                    {messages.new}
                  </Text>
                </View>
              </View>
            ) : null}
          </View>
          <Text numberOfLines={1}>{lastMessage}</Text>
        </View>
      ) : (
        <ChatListItemSkeleton />
      )}
    </TouchableHighlight>
  )
}
