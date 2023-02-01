import { chatSelectors, useProxySelector } from '@audius/common'
import type { UserChat } from '@audius/sdk'
import { View, TouchableHighlight } from 'react-native'

import { Text } from 'app/components/core'
import LoadingSpinner from 'app/components/loading-spinner'
import { makeStyles } from 'app/styles'

import { ChatUser } from './ChatUser'

const { getOtherChatUsersFromChat } = chatSelectors

const useStyles = makeStyles(({ spacing, palette, typography }) => ({
  root: {
    width: '100%',
    height: spacing(28),
    paddingVertical: spacing(4),
    paddingHorizontal: spacing(6),
    backgroundColor: palette.white,
    borderColor: palette.neutralLight8,
    borderBottomWidth: 1
  },
  preview: {
    fontSize: typography.fontSize.medium,
    lineHeight: spacing(6)
  }
}))

type ChatListItemProps = {
  chat: UserChat
}

export const ChatListItem = (props: ChatListItemProps) => {
  const { chat } = props
  const styles = useStyles()
  const users = useProxySelector(
    (state) => getOtherChatUsersFromChat(state, chat),
    [chat]
  )

  if (!users[0]) {
    return <LoadingSpinner />
  }

  return (
    <TouchableHighlight>
      <View style={styles.root}>
        <ChatUser user={users[0]} />
        <Text numberOfLines={1} style={styles.preview}>
          {chat.last_message}
        </Text>
      </View>
    </TouchableHighlight>
  )
}
