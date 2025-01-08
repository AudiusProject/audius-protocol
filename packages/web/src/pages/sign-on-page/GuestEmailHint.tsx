import { useCallback } from 'react'

import { confirmEmailMessages } from '@audius/common/messages'
import { emailSchemaMessages } from '@audius/common/schemas'
import { route, TEMPORARY_PASSWORD } from '@audius/common/utils'
import { Hint, IconError } from '@audius/harmony'
import { useField, useFormikContext } from 'formik'
import { useDispatch } from 'react-redux'
import { usePrevious } from 'react-use'

import { signIn, setValueField } from 'common/store/pages/signon/actions'
import { TextLink } from 'components/link'

const { SIGN_IN_CONFIRM_EMAIL_PAGE } = route

export const GuestEmailHint = () => {
  const [{ value: email }, { error }] = useField('email')
  const { isValidating } = useFormikContext()
  const dispatch = useDispatch()
  const lastShownError = usePrevious(error)

  const handleClickConfirmEmail = useCallback(() => {
    dispatch(setValueField('email', email))
    dispatch(setValueField('password', TEMPORARY_PASSWORD))
  }, [dispatch, email])

  const showGuestError =
    error === emailSchemaMessages.guestAccountExists ||
    (isValidating && lastShownError === emailSchemaMessages.guestAccountExists)

  if (!showGuestError) return null

  return (
    <Hint icon={IconError}>
      {error}{' '}
      <TextLink
        to={SIGN_IN_CONFIRM_EMAIL_PAGE}
        variant='visible'
        asChild
        onClick={handleClickConfirmEmail}
      >
        {confirmEmailMessages.finishSigningUp}
      </TextLink>
    </Hint>
  )
}
