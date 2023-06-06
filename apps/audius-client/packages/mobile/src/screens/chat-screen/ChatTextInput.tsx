import { useCallback, useState } from 'react'

import { chatActions, playerSelectors } from '@audius/common'
import { Platform, Pressable } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import IconSend from 'app/assets/images/iconSend.svg'
import { TextInput } from 'app/components/core'
import { makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'
import { useThemeColors } from 'app/utils/theme'

const { sendMessage } = chatActions
const { getHasTrack } = playerSelectors

const ICON_BLUR = 0.5
const ICON_FOCUS = 1

const messages = {
  startNewMessage: ' Start a New Message'
}

const useStyles = makeStyles(({ spacing, palette, typography }) => ({
  composeTextContainer: {
    display: 'flex',
    alignItems: 'flex-end',
    backgroundColor: palette.neutralLight10,
    paddingLeft: spacing(4),
    paddingVertical: spacing(1),
    borderRadius: spacing(1)
  },
  composeTextInput: {
    fontSize: typography.fontSize.medium,
    lineHeight: spacing(6),
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 0
  },
  icon: {
    width: spacing(5),
    height: spacing(5),
    fill: palette.white
  },
  iconCircle: {
    borderRadius: spacing(5),
    paddingVertical: spacing(1.5),
    paddingLeft: 5,
    paddingRight: 7
  }
}))

type ChatTextInputProps = {
  chatId: string
}

export const ChatTextInput = ({ chatId }: ChatTextInputProps) => {
  const styles = useStyles()
  const dispatch = useDispatch()
  const { primary, primaryDark2 } = useThemeColors()

  const [inputMessage, setInputMessage] = useState('')
  const hasLength = inputMessage.length > 0
  const hasCurrentlyPlayingTrack = useSelector(getHasTrack)

  const handleSubmit = useCallback(() => {
    if (chatId && inputMessage) {
      dispatch(sendMessage({ chatId, message: inputMessage }))
      setInputMessage('')
    }
  }, [inputMessage, chatId, dispatch])

  const renderIcon = () => (
    <Pressable
      onPress={handleSubmit}
      style={({ pressed }) => [
        styles.iconCircle,
        {
          backgroundColor: pressed && hasLength ? primaryDark2 : primary,
          opacity: hasLength ? ICON_FOCUS : ICON_BLUR
        }
      ]}
    >
      <IconSend
        width={styles.icon.width}
        height={styles.icon.height}
        fill={styles.icon.fill}
      />
    </Pressable>
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
    />
  )
}
