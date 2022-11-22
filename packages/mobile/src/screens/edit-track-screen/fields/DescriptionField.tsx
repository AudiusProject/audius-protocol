import { useField } from 'formik'

import { Text } from 'app/components/core'
import { makeStyles } from 'app/styles'

import { TextField } from './TextField'

const messages = {
  description: 'Description'
}

const maxCharCount = 1000

const useStyles = makeStyles(() => ({
  input: { height: 128, textAlignVertical: 'top' }
}))

export const DescriptionField = () => {
  const name = 'description'
  const styles = useStyles()
  const [{ value }] = useField(name)

  const charCount = value?.length ?? 0
  const charCountColor =
    charCount < 800 ? 'neutralLight4' : charCount < 950 ? 'warning' : 'error'

  return (
    <TextField
      styles={styles}
      multiline
      numberOfLines={5}
      maxLength={maxCharCount}
      name={name}
      label={messages.description}
      endAdornment={
        <Text variant='body' color={charCountColor}>
          {charCount}/{maxCharCount}
        </Text>
      }
      returnKeyType='default'
    />
  )
}
