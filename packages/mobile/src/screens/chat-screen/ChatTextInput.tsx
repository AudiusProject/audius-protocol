import { useCallback, useEffect, useMemo, useState } from 'react'

import { useAudiusLinkResolver } from '@audius/common/hooks'
import { chatActions, playerSelectors } from '@audius/common/store'
import { decodeHashId, splitOnNewline } from '@audius/common/utils'
import { Platform, TouchableOpacity, View } from 'react-native'
import type {
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
  TextInputSelectionChangeEventData
} from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import { Flex, IconSend } from '@audius/harmony-native'
import { Text, TextInput } from 'app/components/core'
import { env } from 'app/env'
import { audiusSdk } from 'app/services/sdk/audius-sdk'
import { makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'
import { useThemeColors } from 'app/utils/theme'

import { ComposerCollectionInfo, ComposerTrackInfo } from './ComposePreviewInfo'

const { sendMessage } = chatActions
const { getHasTrack } = playerSelectors

const messages = {
  startNewMessage: ' Start typing...'
}

const BACKSPACE_KEY = 'Backspace'

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
  const [selection, setSelection] = useState<{ start: number; end: number }>()

  const {
    linkEntities,
    resolveLinks,
    restoreLinks,
    getMatches,
    handleBackspace
  } = useAudiusLinkResolver({
    value: inputMessage,
    hostname: env.PUBLIC_HOSTNAME,
    audiusSdk
  })

  const trackId = useMemo(() => {
    const track = linkEntities.find((e) => e.type === 'track')
    return track ? decodeHashId(track.data.id) : null
  }, [linkEntities])

  const collectionId = useMemo(() => {
    const collection = linkEntities.find((e) => e.type === 'collection')
    return collection ? decodeHashId(collection.data.id) : null
  }, [linkEntities])

  useEffect(() => {
    const fn = async () => {
      if (presetMessage) {
        const editedValue = await resolveLinks(presetMessage)
        setInputMessage(editedValue)
      }
    }
    fn()
  }, [presetMessage, resolveLinks])

  const handleChange = useCallback(
    async (value: string) => {
      setInputMessage(value)
      const editedValue = await resolveLinks(value)
      setInputMessage(editedValue)
    },
    [setInputMessage, resolveLinks]
  )

  const handleSelectionChange = useCallback(
    (e: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => {
      setSelection(e.nativeEvent.selection)
    },
    [setSelection]
  )

  const handleKeyDown = useCallback(
    (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
      if (e.nativeEvent.key === BACKSPACE_KEY && selection) {
        const textBeforeCursor = inputMessage.slice(0, selection.start)
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
            setInputMessage(editValue)
          }, 100)
        }
      }
    },
    [selection, handleBackspace, setInputMessage, inputMessage]
  )

  const handleSubmit = useCallback(() => {
    if (chatId && inputMessage) {
      dispatch(sendMessage({ chatId, message: restoreLinks(inputMessage) }))
      setInputMessage('')
      onMessageSent()
    }
  }, [inputMessage, chatId, dispatch, onMessageSent, restoreLinks])

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

  const renderChatDisplay = (value: string) => {
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
    <Flex>
      {trackId ? (
        <ComposerTrackInfo trackId={trackId} />
      ) : collectionId ? (
        <ComposerCollectionInfo collectionId={collectionId} />
      ) : null}
      <Flex
        style={{
          position: 'relative',
          maxHeight: hasCurrentlyPlayingTrack ? spacing(70) : spacing(80),
          paddingBottom: Platform.OS === 'ios' ? spacing(1.5) : undefined
        }}
      >
        <View
          style={[
            styles.overlayTextContainer,
            Platform.OS === 'ios' ? { paddingBottom: spacing(1.5) } : null,
            { maxHeight: hasCurrentlyPlayingTrack ? spacing(70) : spacing(80) }
          ]}
        >
          <Text style={styles.overlayText}>
            {renderChatDisplay(inputMessage)}
          </Text>
        </View>
        <TextInput
          placeholder={messages.startNewMessage}
          Icon={renderIcon}
          styles={{
            root: styles.composeTextContainer,
            input: [
              styles.composeTextInput,
              Platform.OS === 'ios' ? { paddingBottom: spacing(1.5) } : null,
              {
                maxHeight: hasCurrentlyPlayingTrack ? spacing(70) : spacing(80)
              }
            ]
          }}
          onChangeText={handleChange}
          onKeyPress={handleKeyDown}
          onSelectionChange={handleSelectionChange}
          inputAccessoryViewID='none'
          multiline
          value={inputMessage}
          maxLength={10000}
          autoCorrect
        />
      </Flex>
    </Flex>
  )
}
