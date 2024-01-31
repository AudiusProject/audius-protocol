import { ChangeEvent } from 'react'

import { createEmailPageMessages } from '@audius/common/messages'
import { emailSchemaMessages } from '@audius/common/utils'
import { Hint, IconError, TextLink } from '@audius/harmony'
import { useField, useFormikContext } from 'formik'
import { useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'
import { usePrevious } from 'react-use'

import { setValueField } from 'common/store/pages/signon/actions'
import {
  HarmonyTextField,
  HarmonyTextFieldProps
} from 'components/form-fields/HarmonyTextField'
import { SIGN_IN_PAGE } from 'utils/route'

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

export const NewEmailField = () => {
  const [, { error }] = useField('email')
  const { isValidating } = useFormikContext()
  const emailInUse = error === emailSchemaMessages.emailInUse
  // Used to ensure the hint doesn't go away while validation is ocurring
  const hadError = usePrevious(emailInUse)

  const signInLink = (
    <TextLink variant='visible' asChild>
      <Link to={SIGN_IN_PAGE}>{createEmailPageMessages.signIn}</Link>
    </TextLink>
  )

  return (
    <>
      <EmailField
        // Don't show red error message when emailInUse
        helperText={emailInUse ? '' : undefined}
      />
      {emailInUse || (hadError && isValidating) ? (
        <Hint icon={IconError}>
          {emailSchemaMessages.emailInUse} {signInLink}
        </Hint>
      ) : null}
    </>
  )
}
