import { useCallback, useState } from 'react'

import { chatActions, playerSelectors } from '@audius/common/store'
import { Platform, TouchableOpacity } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import { IconSend } from '@audius/harmony-native'
import { TextInput } from 'app/components/core'
import { makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'
import { useThemeColors } from 'app/utils/theme'

const { sendMessage } = chatActions
const { getHasTrack } = playerSelectors

const messages = {
  startNewMessage: ' Start typing...'
}

const useStyles = makeStyles(({ spacing, palette, typography }) => ({
  composeTextContainer: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: palette.neutralLight10,
    paddingLeft: spacing(4),
    paddingVertical: spacing(2),
    borderRadius: spacing(1)
  },
  composeTextInput: {
    fontSize: typography.fontSize.medium,
    lineHeight: spacing(6),
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 0
  },
  submit: {
    paddingRight: spacing(1)
  },
  icon: {
    width: spacing(6),
    height: spacing(6)
  }
}))

type ChatTextInputProps = {
  chatId: string
  presetMessage?: string
  onMessageSent: () => void
}

export const ChatTextInput = ({
  chatId,
  presetMessage,
  onMessageSent
}: ChatTextInputProps) => {
  const styles = useStyles()
  const dispatch = useDispatch()
  const { primary, neutralLight7 } = useThemeColors()

  const [inputMessage, setInputMessage] = useState(presetMessage ?? '')
  const hasLength = inputMessage.length > 0
  const hasCurrentlyPlayingTrack = useSelector(getHasTrack)

  const handleSubmit = useCallback(() => {
    if (chatId && inputMessage) {
      dispatch(sendMessage({ chatId, message: inputMessage }))
      setInputMessage('')
      onMessageSent()
    }
  }, [inputMessage, chatId, dispatch, onMessageSent])

  const renderIcon = () => (
    <TouchableOpacity
      onPress={handleSubmit}
      hitSlop={spacing(2)}
      style={styles.submit}
    >
      <IconSend
        width={styles.icon.width}
        height={styles.icon.height}
        fill={hasLength ? primary : neutralLight7}
      />
    </TouchableOpacity>
  )

  return (
    <TextInput
      placeholder={messages.startNewMessage}
      Icon={renderIcon}
      styles={{
        root: styles.composeTextContainer,
        input: [
          styles.composeTextInput,
          Platform.OS === 'ios' ? { paddingBottom: spacing(1.5) } : null,
          { maxHeight: hasCurrentlyPlayingTrack ? spacing(70) : spacing(80) }
        ]
      }}
      onChangeText={setInputMessage}
      inputAccessoryViewID='none'
      multiline
      value={inputMessage}
      maxLength={10000}
      autoCorrect
    />
  )
}
