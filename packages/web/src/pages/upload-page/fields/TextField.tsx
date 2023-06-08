import { useField } from 'formik'
import { capitalize } from 'lodash'

import Input from 'components/data-entry/Input'

import { FieldProps } from './types'

type TextFieldProps = FieldProps

export const TextField = (props: TextFieldProps) => {
  const {
    name,
    label: labelProp,
    required,
    errorMessage: errorMessageProp,
    // styles: stylesProp,
    ...other
  } = props
  const [{ value, onChange, onBlur }, { touched, error }] = useField(name)
  const label = required ? `${labelProp} *` : labelProp
  const errorMessage =
    errorMessageProp || (error ? `${capitalize(name)} ${error}` : undefined)

  return (
    <>
      <Input
        label={label}
        // styles={{
        //   ...stylesProp,
        //   input: [styles.input, stylesProp?.input],
        //   labelText: [styles.labelText, stylesProp?.labelText]
        // }}
        defaultValue={value ?? undefined}
        onChange={onChange(name)}
        onBlur={(e: any) => onBlur(name)(e)}
        returnKeyType='done'
        {...other}
      />
      {/* TODO: styling */}
      {error && touched && errorMessage ? errorMessage : null}
    </>
  )
}
