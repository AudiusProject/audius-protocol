import { useCallback, useState } from 'react'

import { trimToAlphaNumeric } from '@audius/common'
import { uniq } from 'lodash'
import type {
  NativeSyntheticEvent,
  TextInputFocusEventData,
  TextInputKeyPressEventData
} from 'react-native'
import { View } from 'react-native'

import IconSave from 'app/assets/images/iconSave.svg'
import { makeStyles } from 'app/styles'
import { useThemeColors } from 'app/utils/theme'

import { Text } from './Text'
import type { TextInputProps } from './TextInput'
import { TextInput } from './TextInput'

type TagInputProps = TextInputProps

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
    borderRadius: 2,
    height: 20
  },
  tagText: {
    textTransform: 'uppercase',
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontByWeight.bold,
    color: palette.white
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
  const { value, onChangeText, placeholder, onFocus, onBlur, ...other } = props
  const [inputValue, setInputValue] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const { white } = useThemeColors()
  const styles = useStyles()

  const tags = value === '' ? emptyTags : value?.split(',') ?? emptyTags

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
          <IconSave fill={white} height={12} width={12} />
        </View>
      ) : null}
    </View>
  ) : null

  const handleChangeText = useCallback((value: string) => {
    if (!value.includes(' ')) {
      setInputValue(value)
    }
  }, [])

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
      setIsFocused(false)
    },
    [onBlur]
  )

  const handleKeyPress = useCallback(
    (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
      const { key: keyValue } = e.nativeEvent

      if (!inputValue && keyValue === 'Backspace') {
        onChangeText?.(tags.slice(0, -1).join(','))
      } else if (inputValue && (keyValue === ' ' || keyValue === ',')) {
        onChangeText?.(
          uniq([...tags, trimToAlphaNumeric(inputValue)]).join(',')
        )
        setInputValue('')
      }
    },
    [inputValue, tags, setInputValue, onChangeText]
  )

  return (
    <TextInput
      value={inputValue}
      onChangeText={handleChangeText}
      onKeyPress={handleKeyPress}
      startAdornment={startAdornment}
      returnKeyType='default'
      onFocus={handleFocus}
      onBlur={handleBlur}
      styles={{ input: styles.input }}
      {...other}
    />
  )
}
