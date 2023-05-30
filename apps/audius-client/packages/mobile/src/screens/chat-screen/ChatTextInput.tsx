import { useCallback, useState } from 'react'

import { chatActions, playerSelectors } from '@audius/common'
import { Platform } from 'react-native'
import { TouchableWithoutFeedback } from 'react-native-gesture-handler'
import { useDispatch, useSelector } from 'react-redux'

import IconSend from 'app/assets/images/iconSend.svg'
import { TextInput } from 'app/components/core'
import { makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'

const { sendMessage } = chatActions
const { getHasTrack } = playerSelectors

const ICON_BLUR = 0.5
const ICON_FOCUS = 1

const messages = {
  startNewMessage: 'Start a New Message'
}

const useStyles = makeStyles(({ spacing, palette, typography }) => ({
  composeTextContainer: {
    display: 'flex',
    alignItems: 'flex-end',
    backgroundColor: palette.neutralLight10,
    paddingLeft: spacing(4),
    borderRadius: spacing(1)
  },
  composeTextInput: {
    fontSize: typography.fontSize.medium,
    lineHeight: spacing(6),
    paddingTop: 0
  },
  icon: {
    width: spacing(7),
    height: spacing(7),
    fill: palette.primary
  }
}))

type ChatTextInputProps = {
  chatId: string
}

export const ChatTextInput = ({ chatId }: ChatTextInputProps) => {
  const styles = useStyles()
  const dispatch = useDispatch()

  const [inputMessage, setInputMessage] = useState('')
  const hasCurrentlyPlayingTrack = useSelector(getHasTrack)

  const handleSubmit = useCallback(
    (message) => {
      if (chatId && message) {
        setInputMessage('')
        dispatch(sendMessage({ chatId, message }))
      }
    },
    [chatId, setInputMessage, dispatch]
  )

  return (
    <TextInput
      placeholder={messages.startNewMessage}
      Icon={() => (
        <TouchableWithoutFeedback onPress={() => handleSubmit(inputMessage)}>
          <IconSend
            width={styles.icon.width}
            height={styles.icon.height}
            opacity={inputMessage ? ICON_FOCUS : ICON_BLUR}
            fill={styles.icon.fill}
          />
        </TouchableWithoutFeedback>
      )}
      styles={{
        root: styles.composeTextContainer,
        input: [
          styles.composeTextInput,
          Platform.OS === 'ios' ? { paddingBottom: spacing(1) } : null,
          { maxHeight: hasCurrentlyPlayingTrack ? spacing(70) : spacing(80) }
        ]
      }}
      onChangeText={(text) => {
        setInputMessage(text)
      }}
      inputAccessoryViewID='none'
      multiline
      value={inputMessage}
      maxLength={10000}
    />
  )
}
