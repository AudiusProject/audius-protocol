import { Hint, IconError } from '@audius/harmony'
import { ErrorMessage } from 'formik'

export const EmailTakenHint = () => {
  return (
    <ErrorMessage name='email'>
      {(errorMessage) => <Hint icon={IconError}>{errorMessage}</Hint>}
    </ErrorMessage>
  )
}
