import { useCallback } from 'react'

import { HarmonyButton, HarmonyButtonType } from '@audius/stems'
import { Form, Formik } from 'formik'
import { useDispatch, useSelector } from 'react-redux'

import { setValueField } from 'common/store/pages/signon/actions'
import { getEmailField } from 'common/store/pages/signon/selectors'
import { TextField } from 'components/form-fields'

const messages = {
  emailHeader: 'Sign Up For Audius',
  emailLabel: 'Email',
  signUp: 'Sign Up Free',
  passwordHeader: 'Create Your Password'
}

const initialValues = {
  email: ''
}

type SignUpEmailValues = {
  email: string
}

export const SignUpPage = () => {
  const dispatch = useDispatch()
  const { value: isEmailSubmitted } = useSelector(getEmailField)

  const handleSubmit = useCallback(
    (values: SignUpEmailValues) => {
      const { email } = values
      dispatch(setValueField('email', email))
    },
    [dispatch]
  )

  const emailForm = (
    <Formik initialValues={initialValues} onSubmit={handleSubmit}>
      <Form>
        <h1>{messages.emailHeader}</h1>
        <TextField name='email' label={messages.emailLabel} />
        <HarmonyButton
          variant={HarmonyButtonType.PRIMARY}
          text={messages.signUp}
          type='submit'
        />
      </Form>
    </Formik>
  )

  const passwordForm = <h1>{messages.passwordHeader}</h1>

  return (
    <div>
      {!isEmailSubmitted ? emailForm : null}
      {isEmailSubmitted ? passwordForm : null}
    </div>
  )
}
