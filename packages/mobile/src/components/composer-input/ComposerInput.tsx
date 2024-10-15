import type { Ref } from 'react'
import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'

import {
  useGetCurrentUserId,
  useGetUserByHandle,
  useGetTrackById
} from '@audius/common/api'
import { useAudiusLinkResolver } from '@audius/common/hooks'
import type { ID, UserMetadata } from '@audius/common/models'
import {
  getDurationFromTimestampMatch,
  handleRegex,
  splitOnNewline,
  timestampRegex
} from '@audius/common/utils'
import { Platform, TouchableOpacity, View } from 'react-native'
import type { TextInput as RnTextInput } from 'react-native'
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
const AT_KEY = '@'
const SPACE_KEY = ' '

const messages = {
  sendMessage: 'Send Message',
  sendMessagePlaceholder: 'Start typing...'
}

const createTextSections = (text: string) => {
  const splitText = splitOnNewline(text)
  return splitText.map((t) => (
    // eslint-disable-next-line react/jsx-key
    <Text>{`${t === '\n' ? '\n\n' : t}`}</Text>
  ))
}

const useStyles = makeStyles(({ spacing, palette, typography }) => ({
  composeTextContainer: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingLeft: spacing(4),
    paddingVertical: spacing(2),
    borderRadius: spacing(1),
    maxHeight: 240
  },
  composeTextInput: {
    fontSize: typography.fontSize.medium,
    lineHeight: spacing(6),
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 0
  },
  hideText: {
    color: 'transparent'
  },
  overlayTextContainer: {
    position: 'absolute',
    pointerEvents: 'none',
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

export const ComposerInput = forwardRef(function ComposerInput(
  props: ComposerInputProps,
  ref: Ref<RnTextInput>
) {
  const styles = useStyles()
  const {
    onSubmit,
    onChange,
    onAutocompleteChange,
    setAutocompleteHandler,
    isLoading,
    messageId,
    placeholder,
    presetMessage,
    entityId,
    styles: propStyles,
    TextInputComponent
  } = props
  const { data: currentUserId } = useGetCurrentUserId({})
  const [value, setValue] = useState(presetMessage ?? '')
  const [autocompletePosition, setAutocompletePosition] = useState(0)
  const [isAutocompleteActive, setIsAutocompleteActive] = useState(false)
  const [userMentions, setUserMentions] = useState<string[]>([])
  const [userIdMap, setUserIdMap] = useState<Record<string, ID>>({})
  const [presetUserMention, setPresetUserMention] = useState('')
  const { data: replyUser } = useGetUserByHandle({
    handle: presetUserMention.slice(1), // slice to remove the @
    currentUserId
  })
  const [selection, setSelection] = useState<{ start: number; end: number }>()
  const { primary, neutralLight7 } = useThemeColors()
  const hasLength = value.length > 0
  const messageIdRef = useRef(messageId)
  const lastKeyPressMsRef = useRef<number | null>(null)
  const { data: track } = useGetTrackById({ id: entityId ?? -1 })

  const getAutocompleteRange = useCallback(() => {
    if (!isAutocompleteActive) return null

    const startPosition = Math.min(autocompletePosition, value.length)
    const endPosition = value
      .slice(startPosition + 1)
      .split('')
      .findIndex((c) => {
        return c === SPACE_KEY || c === AT_KEY
      })

    return [
      startPosition,
      endPosition === -1 ? value.length : endPosition + startPosition + 1
    ]
  }, [autocompletePosition, isAutocompleteActive, value])

  const autocompleteText = useMemo(() => {
    if (!isAutocompleteActive) return ''
    return value.slice(...getAutocompleteRange()!)
  }, [getAutocompleteRange, isAutocompleteActive, value])

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

  const getTimestamps = useCallback(
    (value: string) => {
      if (!track || !track.access.stream) return []

      const { duration } = track
      return Array.from(value.matchAll(timestampRegex))
        .filter((match) => getDurationFromTimestampMatch(match) <= duration)
        .map((match) => ({
          type: 'timestamp',
          text: match[0],
          index: match.index,
          link: ''
        }))
    },
    [track]
  )

  useEffect(() => {
    const fn = async () => {
      if (presetMessage) {
        const editedValue = await resolveLinks(presetMessage)
        setValue(editedValue)
        if (handleRegex.test(editedValue.trimEnd())) {
          setPresetUserMention(editedValue.trimEnd())
        }
      }
    }
    fn()
  }, [presetMessage, resolveLinks])

  useEffect(() => {
    if (replyUser && !userMentions.includes(presetUserMention)) {
      setUserMentions((mentions) => [...mentions, presetUserMention])
      setUserIdMap((map) => {
        map[presetUserMention] = replyUser.user_id
        return map
      })
    }
  }, [presetUserMention, replyUser, userMentions])

  useEffect(() => {
    onChange?.(restoreLinks(value), linkEntities)
  }, [linkEntities, onChange, restoreLinks, value])

  useEffect(() => {
    if (messageId !== messageIdRef.current) {
      messageIdRef.current = messageId
      setValue('')
    }
  }, [messageId])

  const getUserMentions = useCallback(
    (value: string) => {
      const regexString = [...userMentions]
        .sort((a, b) => b.length - a.length)
        .join('|')
      const regex = regexString.length ? new RegExp(regexString, 'g') : null

      return regex
        ? Array.from(value.matchAll(regex)).map((match) => ({
            type: 'mention',
            text: match[0],
            index: match.index,
            link: ''
          }))
        : null
    },
    [userMentions]
  )

  const handleAutocomplete = useCallback(
    (user: UserMetadata) => {
      if (!user) return
      const autocompleteRange = getAutocompleteRange() ?? [0, 1]
      const mentionText = `@${user.handle}`

      if (!userMentions.includes(mentionText)) {
        setUserMentions((mentions) => [...mentions, mentionText])
        setUserIdMap((map) => {
          map[mentionText] = user.user_id
          return map
        })
      }
      setValue((value) => {
        const textBeforeMention = value.slice(0, autocompleteRange[0])
        const textAfterMention = value.slice(autocompleteRange[1])
        const fillText =
          mentionText + (textAfterMention.startsWith(' ') ? '' : ' ')

        return `${textBeforeMention}${fillText}${textAfterMention}`
      })
      setIsAutocompleteActive(false)
    },
    [getAutocompleteRange, userMentions]
  )

  useEffect(() => {
    onAutocompleteChange?.(isAutocompleteActive, autocompleteText.slice(1))
  }, [onAutocompleteChange, isAutocompleteActive, autocompleteText])

  useEffect(() => {
    if (isAutocompleteActive && setAutocompleteHandler) {
      setAutocompleteHandler(handleAutocomplete)
    }
  }, [handleAutocomplete, isAutocompleteActive, setAutocompleteHandler])

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
    const userIds =
      getUserMentions(value)?.map((match) => userIdMap[match.text]) ?? []
    onSubmit?.(restoreLinks(value), userIds)
  }, [getUserMentions, onSubmit, restoreLinks, userIdMap, value])

  const handleKeyDown = useCallback(
    (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
      const { key } = e.nativeEvent
      const isBackspaceAvailable =
        lastKeyPressMsRef.current === null ||
        Date.now() - lastKeyPressMsRef.current > 300

      if (key === BACKSPACE_KEY) {
        if (!isBackspaceAvailable) return
      } else {
        lastKeyPressMsRef.current = Date.now()
      }

      if (isAutocompleteActive && selection) {
        if (key === SPACE_KEY) {
          setIsAutocompleteActive(false)
        }

        if (key === BACKSPACE_KEY && selection) {
          const cursorPosition = selection.start
          const deletedChar = value[cursorPosition - 1]
          if (deletedChar === AT_KEY) {
            setIsAutocompleteActive(false)
          }
        }

        const autocompleteRange = getAutocompleteRange()
        const cursorPosition = selection.start

        if (
          autocompleteRange &&
          (autocompleteRange[0] >= cursorPosition ||
            autocompleteRange[1] < cursorPosition)
        ) {
          setIsAutocompleteActive(false)
        }

        return
      }

      // Start user autocomplete
      if (key === AT_KEY && onAutocompleteChange) {
        const cursorPosition = selection?.start ?? 0
        setAutocompletePosition(cursorPosition)
        setIsAutocompleteActive(true)
      }

      if (key === BACKSPACE_KEY && selection) {
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
    [
      getAutocompleteRange,
      handleBackspace,
      isAutocompleteActive,
      onAutocompleteChange,
      selection,
      value
    ]
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

  const isTextHighlighted = useMemo(() => {
    const matches = getMatches(value) ?? []
    const timestamps = getTimestamps(value)
    const mentions = getUserMentions(value) ?? []
    const fullMatches = [...matches, ...mentions, ...timestamps]
    return Boolean(fullMatches.length || isAutocompleteActive)
  }, [getMatches, getTimestamps, getUserMentions, isAutocompleteActive, value])

  const renderDisplayText = useCallback(
    (value: string) => {
      const matches = getMatches(value) ?? []
      const timestamps = getTimestamps(value)
      const mentions = getUserMentions(value) ?? []
      const fullMatches = [...matches, ...mentions, ...timestamps]

      // If there are no highlightable sections, render text normally
      if (!fullMatches.length && !isAutocompleteActive) {
        return createTextSections(value)
      }

      const renderedTextSections: JSX.Element[] = []
      const autocompleteRange = getAutocompleteRange()

      // Filter out matches split by an autocomplete section
      const filteredMatches = fullMatches.filter(({ index }) => {
        if (index === undefined) return false
        if (autocompleteRange) {
          return !(
            index >= autocompleteRange[0] && index <= autocompleteRange[1]
          )
        }
        return true
      })

      // Add the autocomplete section
      if (
        autocompleteRange &&
        autocompleteRange[0] >= 0 &&
        autocompleteRange[1] >= autocompleteRange[0]
      ) {
        filteredMatches.push({
          type: 'autocomplete',
          text: value.slice(autocompleteRange[0], autocompleteRange[1]),
          index: autocompleteRange[0],
          link: ''
        })
      }

      // Sort match sections by index
      const sortedMatches = filteredMatches.sort(
        (a, b) => (a.index ?? 0) - (b.index ?? 0)
      )

      let lastIndex = 0
      for (const match of sortedMatches) {
        const { index, text } = match
        if (index === undefined) {
          continue
        }

        if (index > lastIndex) {
          // Add text before the match
          renderedTextSections.push(
            ...createTextSections(value.slice(lastIndex, index))
          )
        }
        // Add the matched word with accent color
        renderedTextSections.push(<Text color='secondary'>{text}</Text>)

        // Update lastIndex to the end of the current match
        lastIndex = index + text.length
      }

      // Add remaining text after the last match
      if (lastIndex < value.length) {
        renderedTextSections.push(...createTextSections(value.slice(lastIndex)))
      }

      return renderedTextSections
    },
    [
      getMatches,
      getTimestamps,
      getUserMentions,
      isAutocompleteActive,
      getAutocompleteRange
    ]
  )

  return (
    <>
      <TextInput
        ref={ref}
        placeholder={placeholder ?? messages.sendMessagePlaceholder}
        Icon={renderIcon}
        styles={{
          root: [styles.composeTextContainer, propStyles?.container],
          input: [
            styles.composeTextInput,
            Platform.OS === 'ios' ? { paddingBottom: spacing(1.5) } : null,
            isTextHighlighted ? styles.hideText : null
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
        TextInputComponent={TextInputComponent}
      />
      {isTextHighlighted ? (
        <View
          style={[
            styles.overlayTextContainer,
            Platform.OS === 'ios' ? { paddingBottom: spacing(1.5) } : null
          ]}
        >
          <Text style={styles.overlayText}>{renderDisplayText(value)}</Text>
        </View>
      ) : null}
    </>
  )
})
