import { useField } from 'formik'
import { SetRequired } from 'type-fest'

import DropdownInput, {
  DropdownInputProps
} from 'components/data-entry/DropdownInput'

export type DropdownFieldProps = SetRequired<
  Partial<DropdownInputProps>,
  'placeholder' | 'menu'
> & {
  name: string
}

export const DropdownField = (props: DropdownFieldProps) => {
  const { name, ...other } = props
  const [field, { touched, error }, { setValue }] = useField(name)

  const hasError = Boolean(touched && error)
  return (
    <DropdownInput
      {...field}
      error={hasError}
      helperText={hasError ? error : undefined}
      onChange={setValue}
      {...other}
    />
  )
}
