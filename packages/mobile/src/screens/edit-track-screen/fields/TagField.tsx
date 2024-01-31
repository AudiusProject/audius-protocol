import type { TrackMetadata } from '@audius/common/models'
import { useField } from 'formik'

import { TagInput } from 'app/components/core'
import { makeStyles } from 'app/styles'

const useStyles = makeStyles(({ spacing }) => ({
  root: {
    marginVertical: spacing(2),
    marginHorizontal: spacing(4),
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

  return (
    <TagInput
      style={styles.root}
      value={value ?? ''}
      onChangeText={onChange(name)}
      onBlur={onBlur(name)}
      placeholder={messages.placeholder}
      maxTags={10}
    />
  )
}
