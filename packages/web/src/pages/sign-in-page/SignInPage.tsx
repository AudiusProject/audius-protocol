import { useCallback } from 'react'

import { HarmonyButton } from '@audius/stems'
import { Form, Formik } from 'formik'
import { useDispatch } from 'react-redux'

import { signIn } from 'common/store/pages/signon/actions'
import { TextField } from 'components/form-fields'

const messages = {
  header: 'Sign Into Audius',
  emailLabel: 'Email',
  passwordLabel: 'Password',
  signIn: 'Sign In'
}

type SignInValues = {
  email: string
  password: string
}

const initialValues = {
  email: '',
  password: ''
}

export const SignInPage = () => {
  const dispatch = useDispatch()
  const handleSubmit = useCallback(
    (values: SignInValues) => {
      const { email, password } = values
      dispatch(signIn(email, password))
    },
    [dispatch]
  )

  return (
    <div>
      <h1>{messages.header}</h1>
      <Formik initialValues={initialValues} onSubmit={handleSubmit}>
        <Form>
          <TextField name='email' label={messages.emailLabel} />
          <TextField name='password' label={messages.passwordLabel} />
          <HarmonyButton text={messages.signIn} type='submit' />
        </Form>
      </Formik>
    </div>
  )
}
