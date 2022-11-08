import type { TrackMetadata } from '@audius/common'
import { useField } from 'formik'

import { TagInput, Text } from 'app/components/core'
import { makeStyles } from 'app/styles'

const useStyles = makeStyles(({ spacing }) => ({
  root: {
    marginVertical: spacing(2),
    paddingVertical: spacing(6)
  }
}))

const messages = {
  placeholder: 'New Tag'
}

export const TagField = () => {
  const styles = useStyles()
  const name = 'tags'
  const [{ value, onChange, onBlur }] = useField<TrackMetadata['tags']>(name)

  const tagCount = value?.split(',').length ?? 0
  const tagCountColor =
    tagCount < 8 ? 'neutralLight4' : tagCount < 9 ? 'warning' : 'error'

  return (
    <TagInput
      style={styles.root}
      value={value ?? ''}
      endAdornment={
        <Text variant='body' color={tagCountColor}>
          {tagCount}/10
        </Text>
      }
      onChangeText={onChange(name)}
      onBlur={onBlur(name)}
      placeholder={messages.placeholder}
    />
  )
}
