import { useField } from 'formik'

import { Text } from 'app/components/core'
import { makeStyles } from 'app/styles'

import { TextField } from '../edit-track-screen/fields'

const messages = {
  label: 'Description',
  placeholder: 'Give your playlist a description'
}

const useStyles = makeStyles(() => ({
  root: { minHeight: 100 },
  labelText: { lineHeight: 28 },
  input: { height: 128, textAlignVertical: 'top' }
}))

export const PlaylistDescriptionInput = () => {
  const styles = useStyles()
  const name = 'description'
  const [{ value }] = useField(name)

  const charCount = value?.length ?? 0
  const charCountColor =
    charCount < 800 ? 'neutralLight4' : charCount < 950 ? 'warning' : 'error'
  const maxCharCount = 256

  return (
    <TextField
      placeholder={messages.placeholder}
      name={name}
      label={messages.label}
      multiline
      maxLength={maxCharCount}
      styles={styles}
      endAdornment={
        <Text variant='body' color={charCountColor}>
          {charCount}/{maxCharCount}
        </Text>
      }
    />
  )
}
