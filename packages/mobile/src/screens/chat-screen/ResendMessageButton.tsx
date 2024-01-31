import { chatActions, chatSelectors } from '@audius/common/store'
import { useCallback } from 'react'

import { View, TouchableOpacity } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import IconError from 'app/assets/images/iconError.svg'
import { Text } from 'app/components/core'
import { makeStyles } from 'app/styles'
import { useThemeColors } from 'app/utils/theme'

const { getChatMessageById } = chatSelectors
const { sendMessage } = chatActions

const messages = {
  error: 'Message Failed to Send. Tap to Retry.'
}

const useStyles = makeStyles(({ spacing, palette, typography }) => ({
  errorContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1),
    marginTop: spacing(2)
  },
  errorText: {
    letterSpacing: 0.2,
    color: palette.accentRed
  },
  iconError: {
    width: spacing(3),
    height: spacing(3)
  }
}))

type ResendMessageButtonProps = {
  messageId: string
  chatId: string
}

export const ResendMessageButton = ({
  messageId,
  chatId
}: ResendMessageButtonProps) => {
  const styles = useStyles()
  const { accentRed } = useThemeColors()
  const dispatch = useDispatch()

  const message = useSelector((state) =>
    getChatMessageById(state, chatId, messageId)
  )

  const handleErrorPress = useCallback(() => {
    if (message) {
      dispatch(
        sendMessage({
          chatId,
          message: message.message,
          resendMessageId: message.message_id
        })
      )
    }
  }, [chatId, dispatch, message])

  return (
    <TouchableOpacity onPress={handleErrorPress}>
      <View style={styles.errorContainer}>
        <IconError
          fill={accentRed}
          width={styles.iconError.width}
          height={styles.iconError.height}
        />
        <Text style={styles.errorText} fontSize='xs'>
          {messages.error}
        </Text>
      </View>
    </TouchableOpacity>
  )
}
