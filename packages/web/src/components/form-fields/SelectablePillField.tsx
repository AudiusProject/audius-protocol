import { SelectablePill, SelectablePillProps } from '@audius/harmony'
import { useField } from 'formik'

type SelectablePillFieldProps = Extract<
  SelectablePillProps,
  { type: 'checkbox' | 'radio' }
> & {
  name: string
}

export const SelectablePillField = (props: SelectablePillFieldProps) => {
  const { name, type, value } = props
  const [field] = useField({ name, type })

  const isSelected = field.value.includes(value)

  return (
    <SelectablePill
      {...field}
      {...props}
      checked={isSelected}
      isSelected={isSelected}
    />
  )
}
