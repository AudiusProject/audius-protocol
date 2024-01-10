import { setValueField } from 'audius-client/src/common/store/pages/signon/actions'
import { useDispatch } from 'react-redux'

import { TextField, type TextFieldProps } from 'app/components/fields'

export type EmailFieldProps = TextFieldProps

export const EmailField = (props: EmailFieldProps) => {
  const dispatch = useDispatch()

  // We use email inputs in multiple places and want to keep values up to date whenever swapping between them
  // So we keep the value in redux constantly up to date
  const handleChange = (e) => {
    dispatch(setValueField(props.name, e.nativeEvent.text))
    props.onChange?.(e)
  }

  return (
    <TextField
      keyboardType='email-address'
      autoComplete='off'
      autoCorrect={false}
      autoCapitalize='none'
      {...props}
      onChange={handleChange}
    />
  )
}
