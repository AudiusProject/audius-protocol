import { useCallback } from 'react'

import { Button, ButtonType, Text } from '@audius/harmony'
import { Form, Formik } from 'formik'
import { useDispatch } from 'react-redux'

import { setValueField } from 'common/store/pages/signon/actions'
import { TextField } from 'components/form-fields'
import { Link } from 'components/link'
import { useNavigateToPage } from 'hooks/useNavigateToPage'
import { SIGN_IN_PAGE, SIGN_UP_PASSWORD_PAGE } from 'utils/route'

const messages = {
  header: 'Sign Up For Audius',
  emailLabel: 'Email',
  signUp: 'Sign Up Free',
  haveAccount: 'Already have an account?',
  signIn: 'Sign In'
}

export type SignUpPageProps = {}

const initialValues = {
  email: ''
}

type SignUpEmailValues = {
  email: string
}

export const SignUpPage = (props: SignUpPageProps) => {
  const navigate = useNavigateToPage()
  const dispatch = useDispatch()

  const handleSubmit = useCallback(
    (values: SignUpEmailValues) => {
      const { email } = values
      dispatch(setValueField('email', email))
      navigate(SIGN_UP_PASSWORD_PAGE)
    },
    [dispatch, navigate]
  )

  return (
    <>
      <Formik initialValues={initialValues} onSubmit={handleSubmit}>
        <Form>
          <h1>{messages.header}</h1>
          <TextField name='email' label={messages.emailLabel} />
          <Button variant={ButtonType.PRIMARY} type='submit'>
            {messages.signUp}
          </Button>
        </Form>
      </Formik>
      <Text>{messages.haveAccount}</Text>
      <Link to={SIGN_IN_PAGE}>{messages.signIn}</Link>
    </>
  )
}
