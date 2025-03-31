import { useCallback } from 'react'

import { confirmEmailMessages } from '@audius/common/messages'
import { emailSchemaMessages } from '@audius/common/schemas'
import { route, TEMPORARY_PASSWORD } from '@audius/common/utils'
import { Hint, IconError } from '@audius/harmony'
import { useField, useFormikContext } from 'formik'
import { useDispatch } from 'react-redux'
import { usePrevious } from 'react-use'

import { useModalState } from 'common/hooks/useModalState'
import {
  setField,
  setValueField,
  signIn
} from 'common/store/pages/signon/actions'
import { TextLink } from 'components/link'

const { SIGN_IN_CONFIRM_EMAIL_PAGE } = route

type GuestEmailHintProps = {
  isGuestCheckout?: boolean
}

export const GuestEmailHint = (props: GuestEmailHintProps) => {
  const { isGuestCheckout } = props

  const [{ value: email }, { error }] = useField(
    isGuestCheckout ? 'guestEmail' : 'email'
  )
  const { isValidating } = useFormikContext()
  const dispatch = useDispatch()
  const lastShownError = usePrevious(error)
  const [, setIsOpen] = useModalState('PremiumContentPurchaseModal')

  const handleClickConfirmEmail = useCallback(() => {
    dispatch(setField('isGuest', true))
    dispatch(setValueField('email', email))
    dispatch(setValueField('password', TEMPORARY_PASSWORD))
    dispatch(signIn(email, TEMPORARY_PASSWORD))
    setIsOpen(false)
  }, [dispatch, email, setIsOpen])

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
