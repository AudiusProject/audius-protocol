import { useCallback, useEffect, useRef, useState } from 'react'

import { useAudiusLinkResolver } from '@audius/common/hooks'
import { splitOnNewline } from '@audius/common/utils'
import { Platform, TouchableOpacity, View } from 'react-native'
import type {
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
  TextInputSelectionChangeEventData
} from 'react-native/types'

import { IconSend } from '@audius/harmony-native'
import { Text, TextInput } from 'app/components/core'
import { env } from 'app/env'
import { audiusSdk } from 'app/services/sdk/audius-sdk'
import { makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'
import { useThemeColors } from 'app/utils/theme'

import LoadingSpinner from '../loading-spinner/LoadingSpinner'

import type { ComposerInputProps } from './types'

const BACKSPACE_KEY = 'Backspace'

const messages = {
  sendMessage: 'Send Message',
  sendMessagePlaceholder: 'Start typing...'
}

const useStyles = makeStyles(({ spacing, palette, typography }) => ({
  composeTextContainer: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingLeft: spacing(4),
    paddingVertical: spacing(2),
    borderRadius: spacing(1)
  },
  composeTextInput: {
    fontSize: typography.fontSize.medium,
    lineHeight: spacing(6),
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 0,
    color: 'transparent'
  },
  overlayTextContainer: {
    position: 'absolute',
    right: spacing(10),
    left: 0,
    zIndex: 0,
    paddingLeft: spacing(4) + 1,
    paddingVertical: spacing(3) - 1
  },
  overlayText: {
    fontSize: typography.fontSize.medium,
    lineHeight: spacing(6),
    justifyContent: 'center',
    alignItems: 'center',
    color: palette.neutral,
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

export const ComposerInput = (props: ComposerInputProps) => {
  const styles = useStyles()
  const {
    onSubmit,
    onChange,
    isLoading,
    messageId,
    placeholder,
    presetMessage
  } = props
  const [value, setValue] = useState(presetMessage ?? '')
  const [selection, setSelection] = useState<{ start: number; end: number }>()
  const { primary, neutralLight7 } = useThemeColors()
  const hasLength = value.length > 0
  const messageIdRef = useRef(messageId)

  const {
    linkEntities,
    resolveLinks,
    restoreLinks,
    getMatches,
    handleBackspace
  } = useAudiusLinkResolver({
    value,
    hostname: env.PUBLIC_HOSTNAME,
    audiusSdk
  })

  useEffect(() => {
    const fn = async () => {
      if (presetMessage) {
        const editedValue = await resolveLinks(presetMessage)
        setValue(editedValue)
      }
    }
    fn()
  }, [presetMessage, resolveLinks])

  useEffect(() => {
    onChange?.(restoreLinks(value), linkEntities)
  }, [linkEntities, onChange, restoreLinks, value])

  useEffect(() => {
    if (messageId !== messageIdRef.current) {
      messageIdRef.current = messageId
      setValue('')
    }
  }, [messageId])

  const handleChange = useCallback(
    async (value: string) => {
      setValue(value)
      const editedValue = await resolveLinks(value)
      setValue(editedValue)
    },
    [resolveLinks]
  )

  const handleSelectionChange = useCallback(
    (e: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => {
      setSelection(e.nativeEvent.selection)
    },
    [setSelection]
  )

  const handleSubmit = useCallback(() => {
    onSubmit?.(restoreLinks(value), linkEntities)
  }, [linkEntities, onSubmit, restoreLinks, value])

  const handleKeyDown = useCallback(
    (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
      if (e.nativeEvent.key === BACKSPACE_KEY && selection) {
        const textBeforeCursor = value.slice(0, selection.start)
        const cursorPosition = selection.start
        const { editValue } = handleBackspace({
          cursorPosition,
          textBeforeCursor
        })

        if (editValue) {
          // Delay the deleting of the matched word because
          // in react native text change will fire on backspace anyway
          // and we want the handleChange callback to run first.
          // This is a bit of a hack. In search of a better way!
          setTimeout(() => {
            setValue(editValue)
          }, 100)
        }
      }
    },
    [handleBackspace, selection, value]
  )

  const renderIcon = () => (
    <TouchableOpacity
      onPress={handleSubmit}
      hitSlop={spacing(2)}
      style={styles.submit}
    >
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <IconSend
          width={styles.icon.width}
          height={styles.icon.height}
          fill={hasLength ? primary : neutralLight7}
        />
      )}
    </TouchableOpacity>
  )

  const renderTextDisplay = (value: string) => {
    const matches = getMatches(value)
    if (!matches) {
      const text = splitOnNewline(value)
      return text.map((t, i) => (
        <Text key={i}>{`${t === '\n' ? '\n\n' : t}`}</Text>
      ))
    }
    const parts: JSX.Element[] = []
    let lastIndex = 0
    for (const match of matches) {
      const { index, text } = match
      if (index === undefined) {
        continue
      }

      if (index > lastIndex) {
        // Add text before the match
        const text = splitOnNewline(value.slice(lastIndex, index))
        parts.push(
          ...text.map((t, i) => (
            <Text key={`${lastIndex}${i}`}>{`${t === '\n' ? '\n\n' : t}`}</Text>
          ))
        )
      }
      // Add the matched word with accent color
      parts.push(
        <Text color='secondary' key={index}>
          {text}
        </Text>
      )

      // Update lastIndex to the end of the current match
      lastIndex = index + text.length
    }

    // Add remaining text after the last match
    if (lastIndex < value.length) {
      const text = splitOnNewline(value.slice(lastIndex))
      parts.push(
        ...text.map((t, i) => <Text key={`${lastIndex}${i}`}>{`${t}\n`}</Text>)
      )
    }

    return parts
  }

  return (
    <>
      <View
        style={[
          styles.overlayTextContainer,
          Platform.OS === 'ios' ? { paddingBottom: spacing(1.5) } : null
          // { maxHeight: hasCurrentlyPlayingTrack ? spacing(70) : spacing(80) }
        ]}
      >
        <Text style={styles.overlayText}>{renderTextDisplay(value)}</Text>
      </View>
      <TextInput
        placeholder={placeholder ?? messages.sendMessagePlaceholder}
        Icon={renderIcon}
        styles={{
          root: styles.composeTextContainer,
          input: [
            styles.composeTextInput,
            Platform.OS === 'ios' ? { paddingBottom: spacing(1.5) } : null
            // {
            //   maxHeight: hasCurrentlyPlayingTrack ? spacing(70) : spacing(80)
            // }
          ]
        }}
        onChangeText={handleChange}
        onKeyPress={handleKeyDown}
        onSelectionChange={handleSelectionChange}
        inputAccessoryViewID='none'
        multiline
        value={value}
        maxLength={10000}
        autoCorrect
      />
    </>
  )
}
