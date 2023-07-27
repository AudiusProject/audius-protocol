import { useCallback } from 'react'

import { removeNullable } from '@audius/common'
import { useField } from 'formik'

import TagInput, { TagInputProps } from 'components/data-entry/TagInput'

type TagFieldProps = Partial<TagInputProps> & {
  name: string
}
export const TagField = (props: TagFieldProps) => {
  const { name, ...other } = props
  const [field, , { setValue }] = useField(name)
  const { value, ...otherField } = field

  const tags = value.split(',').filter(removeNullable)

  const handleChangeTags = useCallback(
    (value: Set<string>) => setValue([...value].join(',')),
    [setValue]
  )

  return (
    <TagInput
      defaultTags={tags}
      {...otherField}
      onChangeTags={handleChangeTags}
      {...other}
    />
  )
}
