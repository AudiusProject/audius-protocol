import { useField } from 'formik'

import { TextAreaV2, TextAreaV2Props } from 'components/data-entry/TextAreaV2'

type TextAreaFieldProps = TextAreaV2Props & {
  name: string
}

export const TextAreaField = (props: TextAreaFieldProps) => {
  const { name, ...other } = props
  const [field, meta] = useField(name)

  const hasError = Boolean(meta.touched && meta.error)

  return <TextAreaV2 {...field} error={hasError} {...other} />
}
