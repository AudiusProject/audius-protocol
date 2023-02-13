import {
  accountSelectors,
  decodeHashId,
  formatMessageDate
} from '@audius/common'
import type { ChatMessage } from '@audius/sdk'
import { View } from 'react-native'
import { useSelector } from 'react-redux'

import { Text } from 'app/components/core'
import { makeStyles } from 'app/styles'

const { getUserId } = accountSelectors

const useStyles = makeStyles(({ spacing, palette, typography }) => ({
  root: {
    display: 'flex'
  },
  rootOtherUser: {
    alignItems: 'flex-start'
  },
  rootIsAuthor: {
    alignItems: 'flex-end'
  },
  bubble: {
    padding: spacing(4),
    marginTop: spacing(2),
    backgroundColor: palette.white,
    borderRadius: spacing(3),
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    fontSize: typography.fontSize.medium
  },
  isAuthor: {
    backgroundColor: palette.secondary
  },
  textIsAuthor: {
    color: palette.white
  },
  dateContainer: {
    marginTop: spacing(2),
    marginBottom: spacing(6)
  },
  date: {
    fontSize: typography.fontSize.xs,
    color: palette.neutralLight2
  }
}))

type ChatMessageListItemProps = {
  message: ChatMessage
  hasTail: boolean
}

export const ChatMessageListItem = (props: ChatMessageListItemProps) => {
  const styles = useStyles()

  const { message, hasTail } = props
  const userId = useSelector(getUserId)
  const senderUserId = decodeHashId(message.sender_user_id)
  const isAuthor = senderUserId === userId

  return (
    <View
      style={[
        styles.root,
        isAuthor ? styles.rootIsAuthor : styles.rootOtherUser
      ]}
    >
      <View style={[styles.bubble, isAuthor && styles.isAuthor]}>
        <Text style={isAuthor && styles.textIsAuthor}>{message.message}</Text>
      </View>
      {hasTail && (
        <View style={styles.dateContainer}>
          <Text style={styles.date}>
            {formatMessageDate(message.created_at)}
          </Text>
        </View>
      )}
    </View>
  )
}
