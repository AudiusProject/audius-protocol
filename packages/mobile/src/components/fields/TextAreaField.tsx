import { useField } from 'formik'

import type { TextInputProps } from 'app/components/core'
import { Text, TextInput } from 'app/components/core'
import { makeStyles } from 'app/styles'

import { TextField, type TextFieldProps } from './TextField'

const useStyles = makeStyles(() => ({
  input: { height: 128, textAlignVertical: 'top' }
}))

type TextAreaFieldProps = TextFieldProps

const TextAreaInput = (props: TextInputProps) => {
  const styles = useStyles()
  return <TextInput styles={styles} {...props} />
}

export const TextAreaField = (props: TextAreaFieldProps) => {
  const { ...other } = props
  const { name, maxLength } = other
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
      TextFieldInputComponent={TextAreaInput as any}
      {...other}
    />
  )
}
