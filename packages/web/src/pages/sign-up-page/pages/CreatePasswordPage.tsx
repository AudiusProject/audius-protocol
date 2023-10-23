import { useCallback } from 'react'

import { Button, ButtonType } from '@audius/harmony'
import { Formik, Form } from 'formik'
import { useDispatch } from 'react-redux'

import { setValueField } from 'common/store/pages/signon/actions'
import { TextField } from 'components/form-fields'

import { PickHandleState } from './PickHandlePage'
import { SignUpState } from './SignUpPage'

const messages = {
  header: 'Create Your Password',
  description:
    "Create a password that's secure and easy to remember! We can't reset your password, so write it down or use a password manager.",
  yourEmail: 'Your Email',
  passwordLabel: 'Password',
  confirmPasswordLabel: 'Confirm Password',
  continue: 'Continue'
}

export type CreatePasswordState = {
  stage: 'create-password'
  params: {
    email: string
  }
}

const initialValues = {
  password: '',
  confirmPassword: ''
}

type CreatePasswordValues = {
  password: string
  confirmPassword: string
}

type CreatePasswordPageProps = {
  params: { email: string }
  onPrevious: (state: SignUpState) => void
  onNext: (state: PickHandleState) => void
}

export const CreatePasswordPage = (props: CreatePasswordPageProps) => {
  const { params, onNext } = props
  const { email } = params
  const dispatch = useDispatch()

  const handleSubmit = useCallback(
    (values: CreatePasswordValues) => {
      const { password } = values
      dispatch(setValueField('password', password))
      onNext({ stage: 'pick-handle' })
    },
    [dispatch, onNext]
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
