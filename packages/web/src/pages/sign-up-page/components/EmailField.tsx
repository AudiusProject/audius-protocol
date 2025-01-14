import { ChangeEvent } from 'react'

import { createEmailPageMessages } from '@audius/common/messages'
import { useDispatch } from 'react-redux'

import { setValueField } from 'common/store/pages/signon/actions'
import {
  HarmonyTextField,
  HarmonyTextFieldProps
} from 'components/form-fields/HarmonyTextField'

export const EmailField = (props: Partial<HarmonyTextFieldProps>) => {
  const dispatch = useDispatch()
  // We use email inputs in multiple places and want to keep values up to date whenever swapping between them
  // So we keep the value in redux constantly up to date
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    dispatch(setValueField('email', e.target.value))
  }

  return (
    <HarmonyTextField
      name='email'
      autoComplete='email'
      label={createEmailPageMessages.emailLabel}
      autoFocus
      onChange={handleChange}
      {...props}
    />
  )
}
