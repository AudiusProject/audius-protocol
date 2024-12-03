import { ChangeEvent, useCallback } from 'react'

import {
  confirmEmailMessages,
  createEmailPageMessages
} from '@audius/common/messages'
import { emailSchemaMessages } from '@audius/common/schemas'
import { SIGN_IN_CONFIRM_EMAIL_PAGE } from '@audius/common/src/utils/route'
import { route, TEMPORARY_PASSWORD } from '@audius/common/utils'
import { Hint, IconError, TextLink } from '@audius/harmony'
import { useField, useFormikContext } from 'formik'
import { useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'
import { usePrevious } from 'react-use'

import {
  setField,
  setValueField,
  signIn
} from '@audius/web/src/common/store/pages/signon/actions'
import {
  HarmonyTextField,
  HarmonyTextFieldProps
} from 'components/form-fields/HarmonyTextField'

const { SIGN_IN_PAGE } = route

export const EmailField = (props: Partial<HarmonyTextFieldProps>) => {
  const dispatch = useDispatch()
  // We use email inputs in multiple places and want to keep values up to date whenever swapping between them
  // So we keep the value in redux constantly up to date
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    dispatch(setField('email', e.target.value))
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
  const dispatch = useDispatch()
  const [{ value: email }, { error }] = useField('email')
  const { isValidating } = useFormikContext()
  const emailInUse = error === emailSchemaMessages.emailInUse
  const isGuest = error === emailSchemaMessages.completeYourProfile
  dispatch(setField('isGuest', isGuest))
  const hasError = emailInUse || isGuest
  // Used to ensure the hint doesn't go away while validation is ocurring
  const hadError = usePrevious(hasError)

  const signInLink = (
    <TextLink variant='visible' asChild>
      <Link to={SIGN_IN_PAGE}>{createEmailPageMessages.signIn}</Link>
    </TextLink>
  )
  const handleClickConfirmEmail = useCallback(() => {
    dispatch(setValueField('email', email))
    dispatch(setValueField('password', TEMPORARY_PASSWORD))
    dispatch(signIn(email, TEMPORARY_PASSWORD))
  }, [dispatch, email])

  const confirmEmailLink = (
    <TextLink variant='visible' asChild>
      <Link to={SIGN_IN_CONFIRM_EMAIL_PAGE} onClick={handleClickConfirmEmail}>
        {confirmEmailMessages.title}
      </Link>
    </TextLink>
  )

  return (
    <>
      <EmailField
        // Don't show red error message when emailInUse
        helperText={hasError ? '' : undefined}
      />
      {isGuest || (hadError && isValidating) ? (
        <Hint icon={IconError}>
          {emailSchemaMessages.completeYourProfile} {confirmEmailLink}
        </Hint>
      ) : emailInUse || (hadError && isValidating) ? (
        <Hint icon={IconError}>
          {emailSchemaMessages.emailInUse} {signInLink}
        </Hint>
      ) : null}
    </>
  )
}
