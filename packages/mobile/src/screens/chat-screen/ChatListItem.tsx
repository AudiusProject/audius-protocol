import { useCallback } from 'react'

import { chatSelectors, useProxySelector } from '@audius/common'
import { View, TouchableHighlight } from 'react-native'

import { Text } from 'app/components/core'
import { ProfilePicture } from 'app/components/user'
import { UserBadges } from 'app/components/user-badges'
import { useNavigation } from 'app/hooks/useNavigation'
import { makeStyles } from 'app/styles'

import type { AppTabScreenParamList } from '../app-screen'

const { getSingleOtherChatUser, getChat } = chatSelectors

const useStyles = makeStyles(({ spacing, palette, typography }) => ({
  root: {
    height: spacing(28),
    paddingVertical: spacing(4),
    paddingHorizontal: spacing(6),
    backgroundColor: palette.white,
    borderColor: palette.neutralLight8,
    borderBottomWidth: 1
  },
  loadingSpinnerContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  contentRoot: {
    display: 'flex',
    flexDirection: 'row'
  },
  profilePicture: {
    width: spacing(12),
    height: spacing(12),
    borderWidth: 1,
    borderColor: palette.neutralLight9
  },
  userContainer: {
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
    fontWeight: 'bold',
    color: palette.neutral
  },
  handle: {
    fontSize: typography.fontSize.small
  }
}))

export const ChatListItem = ({ chatId }: { chatId: string }) => {
  const navigation = useNavigation<AppTabScreenParamList>()
  const styles = useStyles()

  const chat = useProxySelector((state) => getChat(state, chatId), [chatId])
  const otherUser = useProxySelector(
    (state) => getSingleOtherChatUser(state, chatId),
    [chatId]
  )

  const handlePress = useCallback(() => {
    navigation.push('Chat', { chatId })
  }, [navigation, chatId])

  return (
    <TouchableHighlight onPress={handlePress}>
      <View style={styles.root}>
        {otherUser ? (
          <>
            <View style={styles.contentRoot}>
              <ProfilePicture
                profile={otherUser}
                style={styles.profilePicture}
              />
              <View style={styles.userContainer}>
                <View style={styles.userNameContainer}>
                  <Text style={styles.userName}>{otherUser.name}</Text>
                  <UserBadges user={otherUser} hideName />
                </View>
                <Text style={styles.handle}>@{otherUser.handle}</Text>
              </View>
            </View>
            <Text numberOfLines={1}>{chat?.last_message}</Text>
          </>
        ) : null}
      </View>
    </TouchableHighlight>
  )
}
