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

const { SIGN_IN_PAGE } = route

export const NewEmailField = () => {
  const [, { error }] = useField('email')
  const { isValidating } = useFormikContext()
  const emailInUse = error === emailSchemaMessages.emailInUse
  const isGuest = error === emailSchemaMessages.completeYourProfile
  const hasSpecialError = emailInUse || isGuest

  // Track which specific error was shown last
  const lastShownError = usePrevious(error)

  const signInLink = (
    <TextLink variant='visible' asChild>
      <Link to={SIGN_IN_PAGE}>{createEmailPageMessages.signIn}</Link>
    </TextLink>
  )

  const showEmailInUseError =
    emailInUse ||
    (isValidating && lastShownError === emailSchemaMessages.emailInUse)

  return (
    <>
      <EmailField
        error={!!error && !hasSpecialError}
        helperText={hasSpecialError ? '' : undefined}
      />
      {showEmailInUseError ? (
        <Hint icon={IconError}>
          {emailSchemaMessages.emailInUse} {signInLink}
        </Hint>
      ) : null}
    </>
  )
}
