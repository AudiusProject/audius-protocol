import { useField } from 'formik'

import { Text } from 'app/components/core'
import { makeStyles } from 'app/styles'

import type { TextFieldProps } from './TextField'
import { TextField } from './TextField'

const useStyles = makeStyles(() => ({
  input: { height: 128, textAlignVertical: 'top' }
}))

type TextAreaFieldProps = TextFieldProps

export const TextAreaField = (props: TextAreaFieldProps) => {
  const { styles: stylesProp, ...other } = props
  const { name, maxLength } = other
  const styles = useStyles()
  const [{ value }] = useField(name)

  const charCount = value?.length ?? 0
  const charCountColor = maxLength
    ? charCount < maxLength * 0.8
      ? 'neutralLight4'
      : charCount < maxLength * 0.95
      ? 'warning'
      : 'error'
    : undefined

  return (
    <TextField
      styles={{ ...styles, ...stylesProp }}
      multiline
      numberOfLines={5}
      endAdornment={
        charCountColor ? (
          <Text variant='body' color={charCountColor}>
            {charCount}/{maxLength}
          </Text>
        ) : undefined
      }
      returnKeyType='default'
      {...other}
    />
  )
}
