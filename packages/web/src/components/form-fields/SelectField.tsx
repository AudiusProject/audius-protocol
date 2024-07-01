import { Select, SelectProps } from '@audius/harmony'
import { useField } from 'formik'

export type SelectFieldProps = SelectProps & {
  name: string
}

export const SelectField = (props: SelectFieldProps) => {
  const { name, ...other } = props
  const [field, { touched, error }, { setValue }] = useField(name)

  const hasError = Boolean(touched && error)

  return (
    <Select
      {...field}
      selection={field.value}
      error={hasError}
      helperText={hasError ? error : undefined}
      onChange={setValue}
      {...other}
    />
  )
}
