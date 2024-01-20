import { setValueField } from 'audius-client/src/common/store/pages/signon/actions'
import { useDispatch } from 'react-redux'

import type { TextInputChangeEvent } from '@audius/harmony-native'
import {
  HarmonyTextField,
  type HarmonyTextFieldProps
} from 'app/components/fields'

export type EmailFieldProps = HarmonyTextFieldProps

export const EmailField = (props: EmailFieldProps) => {
  const dispatch = useDispatch()

  // We use email inputs in multiple places and want to keep values up to date whenever swapping between them
  // So we keep the value in redux constantly up to date
  const handleChange = (e: TextInputChangeEvent) => {
    dispatch(setValueField(props.name, e.nativeEvent.text))
    props.onChange?.(e)
  }

  return (
    <HarmonyTextField
      keyboardType='email-address'
      autoComplete='off'
      autoCorrect={false}
      autoCapitalize='none'
      {...props}
      onChange={handleChange}
    />
  )
}
