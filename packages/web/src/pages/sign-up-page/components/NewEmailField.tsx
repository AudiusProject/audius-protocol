import { useCallback, useEffect } from 'react'

import {
  confirmEmailMessages,
  createEmailPageMessages
} from '@audius/common/messages'
import { emailSchemaMessages } from '@audius/common/schemas'
import { route, TEMPORARY_PASSWORD } from '@audius/common/utils'
import { Hint, IconError } from '@audius/harmony'
import { useField, useFormikContext } from 'formik'
import { useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'
import { usePrevious } from 'react-use'

import {
  setField,
  setValueField,
  signIn
} from 'common/store/pages/signon/actions'
import { TextLink } from 'components/link'

import { EmailField } from './EmailField'

const { SIGN_IN_PAGE, SIGN_IN_CONFIRM_EMAIL_PAGE } = route

export const NewEmailField = () => {
  const dispatch = useDispatch()
  const [{ value: email }, { error }] = useField('email')
  const { isValidating } = useFormikContext()
  const emailInUse = error === emailSchemaMessages.emailInUse
  const isGuest = error === emailSchemaMessages.guestAccountExists
  const hasError = emailInUse || isGuest

  // Track which specific error was shown last
  const lastShownError = usePrevious(error)

  useEffect(() => {
    dispatch(setField('isGuest', isGuest))
  }, [dispatch, isGuest])

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

  const finishSigningUpLink = (
    <TextLink variant='visible' asChild>
      <Link to={SIGN_IN_CONFIRM_EMAIL_PAGE} onClick={handleClickConfirmEmail}>
        {confirmEmailMessages.finishSigningUp}
      </Link>
    </TextLink>
  )

  const showGuestError =
    isGuest ||
    (isValidating && lastShownError === emailSchemaMessages.guestAccountExists)

  const showEmailInUseError =
    emailInUse ||
    (isValidating && lastShownError === emailSchemaMessages.emailInUse)

  return (
    <>
      <EmailField helperText={hasError ? '' : undefined} />
      {showGuestError ? (
        <Hint icon={IconError}>
          {error} {finishSigningUpLink}
        </Hint>
      ) : showEmailInUseError ? (
        <Hint icon={IconError}>
          {error} {signInLink}
        </Hint>
      ) : null}
    </>
  )
}
