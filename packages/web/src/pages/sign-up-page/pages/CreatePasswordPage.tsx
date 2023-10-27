import { useCallback } from 'react'

import { Button, ButtonType } from '@audius/harmony'
import { Formik, Form } from 'formik'
import { useDispatch } from 'react-redux'

import { setValueField } from 'common/store/pages/signon/actions'
import { TextField } from 'components/form-fields'
import { useNavigateToPage } from 'hooks/useNavigateToPage'
import { SIGN_UP_HANDLE_PAGE } from 'utils/route'

const messages = {
  header: 'Create Your Password',
  description:
    "Create a password that's secure and easy to remember! We can't reset your password, so write it down or use a password manager.",
  yourEmail: 'Your Email',
  passwordLabel: 'Password',
  confirmPasswordLabel: 'Confirm Password',
  continue: 'Continue'
}

const initialValues = {
  password: '',
  confirmPassword: ''
}

type CreatePasswordValues = {
  password: string
  confirmPassword: string
}

type CreatePasswordPageProps = {}

export const CreatePasswordPage = (props: CreatePasswordPageProps) => {
  // TODO: PR #6443 replaces this logic
  const { email } = { email: '' }
  const dispatch = useDispatch()
  const navigate = useNavigateToPage()

  const handleSubmit = useCallback(
    (values: CreatePasswordValues) => {
      const { password } = values
      dispatch(setValueField('password', password))
      navigate(SIGN_UP_HANDLE_PAGE)
    },
    [dispatch, navigate]
  )

  return (
    <div>
      <h1>{messages.header}</h1>
      <p>{messages.description}</p>

      <p>{messages.yourEmail}</p>
      <p>{email}</p>

      <Formik initialValues={initialValues} onSubmit={handleSubmit}>
        <Form>
          <TextField name='password' label={messages.passwordLabel} />
          <TextField
            name='confirmPassword'
            label={messages.confirmPasswordLabel}
          />
          <Button variant={ButtonType.PRIMARY} type='submit'>
            {messages.continue}
          </Button>
        </Form>
      </Formik>
    </div>
  )
}
