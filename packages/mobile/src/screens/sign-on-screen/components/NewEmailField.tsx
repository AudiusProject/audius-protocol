import { emailSchemaMessages } from '@audius/common'
import { useField, useFormikContext } from 'formik'
import { usePrevious } from 'react-use'

import { EmailField, type EmailFieldProps } from './EmailField'
import type { EmailInUseHintProps } from './EmailInUseHint'
import { EmailInUseHint } from './EmailInUseHint'

type NewEmailFieldProps = EmailFieldProps & EmailInUseHintProps

export const NewEmailField = (props: NewEmailFieldProps) => {
  const { onChangeScreen, ...other } = props
  const { name } = other

  const [, { error }] = useField(name)
  const { isValidating } = useFormikContext()
  const emailInUse = error === emailSchemaMessages.emailInUse
  // Used to ensure the hint doesn't go away while validation is ocurring
  const hadError = usePrevious(emailInUse)

  return (
    <>
      <EmailField
        {...props}
        error={emailInUse ? false : undefined}
        helperText={emailInUse ? false : undefined}
      />
      {emailInUse || (hadError && isValidating) ? (
        <EmailInUseHint onChangeScreen={onChangeScreen} />
      ) : null}
    </>
  )
}
