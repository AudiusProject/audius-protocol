import { useCallback, useState } from 'react'

import { formatNumberCommas } from 'audius-client/src/common/utils/formatUtil'

import { Audio, TextInput, TextInputProps } from 'app/components/core'
import { makeStyles } from 'app/styles'

const messages = {
  placeholder: 'Enter an amount'
}

const useStyles = makeStyles(({ spacing, palette }) => ({
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
    fontSize: 20
  }
}))

type TipInputProps = TextInputProps

export const TipInput = (props: TipInputProps) => {
  const { value, onChangeText, ...other } = props
  const styles = useStyles()

  const handleChangeText = useCallback(
    (newValue: string) => {
      const unformattedValue = newValue.replace(/,/g, '')
      onChangeText?.(unformattedValue)
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
      keyboardType='numeric'
      Icon={() => <Audio weight='bold' fontSize='xl' />}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      value={formattedValue}
      onChangeText={handleChangeText}
      {...other}
    />
  )
}
