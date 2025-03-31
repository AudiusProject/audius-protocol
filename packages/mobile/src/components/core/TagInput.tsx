import { useCallback, useState } from 'react'

import { trimToAlphaNumeric } from '@audius/common/utils'
import { uniq } from 'lodash'
import type {
  NativeSyntheticEvent,
  TextInputFocusEventData,
  TextInputKeyPressEventData
} from 'react-native'
import { View } from 'react-native'

import { IconSave } from '@audius/harmony-native'
import { makeStyles } from 'app/styles'
import { useThemeColors } from 'app/utils/theme'

import { Text } from './Text'
import type { TextInputProps } from './TextInput'
import { TextInput } from './TextInput'

type TagInputProps = TextInputProps & {
  maxTags: number
}

const useStyles = makeStyles(({ palette, spacing, typography }) => ({
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.secondary,
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1),
    marginRight: spacing(1),
    marginVertical: 2,
    borderRadius: 2
  },
  tagText: {
    textTransform: 'uppercase',
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontByWeight.bold,
    color: palette.staticWhite
  },
  placeholderTag: {
    backgroundColor: palette.secondaryLight2
  },
  placeholderText: {
    marginRight: spacing(1)
  },
  input: {
    marginVertical: spacing(1)
  }
}))

const emptyTags = []

export const TagInput = (props: TagInputProps) => {
  const {
    value,
    onChangeText,
    placeholder,
    onFocus,
    onBlur,
    maxTags,
    ...other
  } = props
  const [inputValue, setInputValue] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const { staticWhite } = useThemeColors()
  const styles = useStyles()

  const tags = value === '' ? emptyTags : (value?.split(',') ?? emptyTags)

  const tagElements = tags?.map((tag, index) => (
    <View key={`${tag}-${index}`} style={styles.tag}>
      <Text style={styles.tagText}>{tag}</Text>
    </View>
  ))

  const startAdornment = tagElements ? (
    <View style={styles.tags}>
      {tagElements}
      {placeholder && !isFocused ? (
        <View style={[styles.tag, styles.placeholderTag]}>
          <Text style={[styles.tagText, styles.placeholderText]}>
            {placeholder}
          </Text>
          <IconSave fill={staticWhite} height={12} width={12} />
        </View>
      ) : null}
    </View>
  ) : null

  const tagCount = tags.length
  const nearLimit = (7.0 / 8.0) * maxTags
  const tagCountColor =
    tagCount < nearLimit
      ? 'neutralLight4'
      : tagCount < maxTags
        ? 'warning'
        : 'error'

  const endAdornment = (
    <Text variant='body' color={tagCountColor}>
      {tagCount}/10
    </Text>
  )

  const handleChangeText = useCallback(
    (value: string) => {
      if (!value.includes(' ') && tagCount !== maxTags) {
        setInputValue(value)
      }
    },
    [tagCount, maxTags]
  )

  const handleAddTag = useCallback(() => {
    onChangeText?.(uniq([...tags, trimToAlphaNumeric(inputValue)]).join(','))
    setInputValue('')
  }, [inputValue, onChangeText, tags])

  const handleFocus = useCallback(
    (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
      onFocus?.(e)
      setIsFocused(true)
    },
    [onFocus]
  )

  const handleBlur = useCallback(
    (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
      onBlur?.(e)
      if (inputValue) {
        handleAddTag()
      }
      setIsFocused(false)
    },
    [onBlur, inputValue, handleAddTag]
  )

  const handleKeyPress = useCallback(
    (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
      const { key: keyValue } = e.nativeEvent
      const removeTagKeys = ['Backspace']
      const addTagKeys = [' ', ',']

      if (!inputValue && removeTagKeys.includes(keyValue)) {
        onChangeText?.(tags.slice(0, -1).join(','))
      } else if (inputValue && addTagKeys.includes(keyValue)) {
        handleAddTag()
      }
    },
    [inputValue, tags, onChangeText, handleAddTag]
  )

  const handleSubmitEditing = useCallback(() => {
    if (inputValue) {
      handleAddTag()
    }
  }, [inputValue, handleAddTag])

  return (
    <TextInput
      value={inputValue}
      onChangeText={handleChangeText}
      onKeyPress={handleKeyPress}
      startAdornment={startAdornment}
      endAdornment={endAdornment}
      returnKeyType='next'
      blurOnSubmit={!inputValue}
      onSubmitEditing={handleSubmitEditing}
      onFocus={handleFocus}
      onBlur={handleBlur}
      styles={{ input: styles.input }}
      {...other}
    />
  )
}
