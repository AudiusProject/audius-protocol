import { useCallback, useState } from 'react'

import { formatNumberCommas } from '@audius/common/utils'

import type { TextInputProps } from 'app/components/core'
import { AudioText, TextInput } from 'app/components/core'
import { makeStyles } from 'app/styles'

const messages = {
  placeholder: 'Enter an amount'
}

const useStyles = makeStyles(({ spacing, palette, typography }) => ({
  root: {
    paddingVertical: spacing(5),
    paddingHorizontal: spacing(4),
    marginBottom: spacing(6)
  },
  rootFocused: {
    borderColor: palette.neutralLight6,
    backgroundColor: palette.neutralLight9
  },
  input: {
    fontSize: typography.fontSize.xl
  }
}))

type TipInputProps = TextInputProps

export const TipInput = (props: TipInputProps) => {
  const { value, onChangeText, ...other } = props
  const styles = useStyles()

  const handleChangeText = useCallback(
    (newValue: string) => {
      // Allow whole numbers only
      const unformattedValue = newValue.replace(/[^0-9]+/g, '')
      const numericWhole = parseInt(unformattedValue, 10)
      /**
       * If not a number, e.g. we attempt to parse an empty string,
       * then set the text to an empty string.
       * Otherwise, set it as the string version of the whole number.
       */
      if (isNaN(numericWhole)) {
        onChangeText?.('')
      } else {
        onChangeText?.(numericWhole.toString())
      }
    },
    [onChangeText]
  )

  const formattedValue = formatNumberCommas(value as string)

  const [isFocused, setIsFocused] = useState(false)

  return (
    <TextInput
      styles={{
        root: [styles.root, isFocused && styles.rootFocused],
        input: styles.input
      }}
      placeholder={messages.placeholder}
      keyboardType='number-pad'
      Icon={() => <AudioText weight='bold' fontSize='xl' />}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      value={formattedValue}
      onChangeText={handleChangeText}
      contextMenuHidden
      {...other}
    />
  )
}
