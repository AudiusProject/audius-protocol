import {
  emailSchemaMessages,
  createEmailPageMessages as messages
} from '@audius/common'
import { Hint, IconError, TextLink } from '@audius/harmony'
import { useField, useFormikContext } from 'formik'
import { Link } from 'react-router-dom'
import { usePrevious } from 'react-use'

import { HarmonyTextField } from 'components/form-fields/HarmonyTextField'
import { SIGN_IN_PAGE } from 'utils/route'

export const EmailField = () => {
  const [, { error }] = useField('email')
  const { isValidating } = useFormikContext()
  const emailInUse = error === emailSchemaMessages.emailInUse
  // Used to ensure the hint doesn't go away while validation is ocurring
  const hadError = usePrevious(emailInUse)

  const signInLink = (
    <TextLink variant='visible' asChild>
      <Link to={SIGN_IN_PAGE}>{messages.signIn}</Link>
    </TextLink>
  )

  return (
    <>
      <HarmonyTextField
        name='email'
        autoComplete='email'
        label={messages.emailLabel}
        debouncedValidationMs={500}
        autoFocus
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
