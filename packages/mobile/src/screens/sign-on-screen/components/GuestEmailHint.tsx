import { useCallback } from 'react'

import { confirmEmailMessages } from '@audius/common/messages'
import { emailSchemaMessages } from '@audius/common/schemas'
import { TEMPORARY_PASSWORD } from '@audius/common/utils'
import {
  signIn,
  setValueField,
  setField
} from 'common/store/pages/signon/actions'
import { useField, useFormikContext } from 'formik'
import { useDispatch } from 'react-redux'
import { usePrevious } from 'react-use'

import { Hint, IconError, TextLink } from '@audius/harmony-native'

export const GuestEmailHint = () => {
  const [{ value: email }, { error }] = useField('email')
  const { isValidating } = useFormikContext()
  const dispatch = useDispatch()
  const lastShownError = usePrevious(error)

  const handleClickConfirmEmail = useCallback(() => {
    console.log('asdf setting true')
    dispatch(setField('isGuest', true))
    dispatch(setValueField('email', email))
    dispatch(setValueField('password', TEMPORARY_PASSWORD))
    dispatch(signIn(email, TEMPORARY_PASSWORD))
  }, [dispatch, email])

  const showGuestError =
    error === emailSchemaMessages.guestAccountExists ||
    (isValidating && lastShownError === emailSchemaMessages.guestAccountExists)

  if (!showGuestError) return null

  return (
    <Hint icon={IconError}>
      {error}{' '}
      <TextLink
        to={{ screen: 'ConfirmEmail' }}
        variant='visible'
        onPress={handleClickConfirmEmail}
      >
        {confirmEmailMessages.finishSigningUp}
      </TextLink>
    </Hint>
  )
}
