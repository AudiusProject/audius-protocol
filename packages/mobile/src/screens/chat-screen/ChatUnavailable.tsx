import { useCallback, useMemo } from 'react'

import { useCanSendMessage } from '@audius/common/hooks'
import { ChatPermissionAction } from '@audius/common/store'
import { CHAT_BLOG_POST_URL } from '@audius/common/utils'
import { View } from 'react-native'
import { useDispatch } from 'react-redux'

import { Text, useLink } from 'app/components/core'
import { useNavigation } from 'app/hooks/useNavigation'
import { setVisibility } from 'app/store/drawers/slice'
import { makeStyles } from 'app/styles'

const messages = {
  noAction: (userName?: string) => `You can't send messages to ${userName}. `,
  tip1: 'You must send ',
  tip2: ' a tip before you can send them messages.',
  blockee: 'You cannot send messages to users you have blocked. ',
  learnMore: 'Learn More.',
  unblockUser: 'Unblock User.'
}

const useStyles = makeStyles(({ spacing, palette, typography }) => ({
  root: {
    display: 'flex',
    alignItems: 'center',
    paddingBottom: spacing(19),
    paddingHorizontal: spacing(6)
  },
  unavailableText: {
    textAlign: 'center',
    lineHeight: typography.fontSize.medium * 1.3
  },
  link: {
    color: palette.secondary
  },
  empty: {
    height: spacing(10.5)
  }
}))

type ChatUnavailableProps = {
  chatId: string
}

export const ChatUnavailable = ({ chatId }: ChatUnavailableProps) => {
  const styles = useStyles()
  const dispatch = useDispatch()
  const navigation = useNavigation()

  const { firstOtherUser: otherUser, callToAction } = useCanSendMessage(chatId)

  const { onPress: handleLearnMorePress } = useLink(CHAT_BLOG_POST_URL)

  const handleUnblockPress = useCallback(() => {
    if (otherUser) {
      dispatch(
        setVisibility({
          drawer: 'BlockMessages',
          visible: true,
          data: { userId: otherUser.user_id }
        })
      )
    }
  }, [dispatch, otherUser])

  const mapChatPermissionActionToContent = useMemo(() => {
    return {
      [ChatPermissionAction.NONE]: () => (
        <>
          <Text style={styles.unavailableText}>
            {messages.noAction(otherUser?.name)}
            <Text
              style={[styles.unavailableText, styles.link]}
              onPress={handleLearnMorePress}
            >
              {messages.learnMore}
            </Text>
          </Text>
        </>
      ),
      [ChatPermissionAction.TIP]: () => (
        <>
          <Text style={styles.unavailableText}>
            {messages.tip1}
            <Text
              onPress={() =>
                navigation.navigate('Profile', { id: otherUser?.user_id })
              }
            >
              {otherUser?.name}
            </Text>
            {messages.tip2}
          </Text>
        </>
      ),
      [ChatPermissionAction.UNBLOCK]: () => (
        <>
          <Text style={styles.unavailableText}>
            {messages.blockee}
            <Text
              style={[styles.unavailableText, styles.link]}
              onPress={handleUnblockPress}
            >
              {messages.unblockUser}
            </Text>
          </Text>
        </>
      ),
      [ChatPermissionAction.WAIT]: () => <View style={styles.empty} />
    }
  }, [
    styles.unavailableText,
    styles.link,
    styles.empty,
    otherUser,
    handleLearnMorePress,
    navigation,
    handleUnblockPress
  ])

  if (!callToAction) return null

  return (
    <View style={styles.root}>
      {mapChatPermissionActionToContent[callToAction]()}
    </View>
  )
}
