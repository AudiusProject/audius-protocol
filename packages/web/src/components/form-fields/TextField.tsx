import { useField } from 'formik'

import { InputV2, InputV2Props } from 'components/data-entry/InputV2'

type TextFieldProps = InputV2Props & {
  name: string
}

export const TextField = (props: TextFieldProps) => {
  const { name, ...other } = props
  const [field, meta] = useField(name)

  const hasError = Boolean(meta.touched && meta.error)

  return <InputV2 {...field} error={hasError} {...other} />
}
