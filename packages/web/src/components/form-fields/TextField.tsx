import { useField } from 'formik'

import {
  InputV2,
  InputV2Props,
  InputV2Variant
} from 'components/data-entry/InputV2'

export type TextFieldProps = InputV2Props & {
  name: string
}

export const TextField = (props: TextFieldProps) => {
  const { name, ...other } = props
  const [field, { touched, error }] = useField(name)

  const hasError = Boolean(touched && error)

  return (
    <InputV2
      variant={InputV2Variant.ELEVATED_PLACEHOLDER}
      {...field}
      error={hasError}
      helperText={hasError ? error : undefined}
      {...other}
    />
  )
}
