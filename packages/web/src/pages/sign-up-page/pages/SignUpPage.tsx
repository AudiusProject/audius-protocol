import { useCallback } from 'react'

import { Text } from '@audius/harmony'
import { HarmonyButton, HarmonyButtonType } from '@audius/stems'
import { Form, Formik } from 'formik'

import { TextField } from 'components/form-fields'
import { Link } from 'components/link'
import { SIGN_IN_PAGE } from 'utils/route'

import { CreatePasswordState } from './CreatePasswordPage'

const messages = {
  header: 'Sign Up For Audius',
  emailLabel: 'Email',
  signUp: 'Sign Up Free',
  haveAccount: 'Already have an account?',
  signIn: 'Sign In'
}

export type SignUpState = {
  stage: 'sign-up'
  email?: string
}

export type SignUpPageProps = {
  onNext: (state: CreatePasswordState) => void
}

const initialValues = {
  email: ''
}

type SignUpEmailValues = {
  email: string
}

export const SignUpPage = (props: SignUpPageProps) => {
  const { onNext } = props

  const handleSubmit = useCallback(
    (values: SignUpEmailValues) => {
      const { email } = values
      onNext({ stage: 'create-password', params: { email } })
    },
    [onNext]
  )

  return (
    <>
      <Formik initialValues={initialValues} onSubmit={handleSubmit}>
        <Form>
          <h1>{messages.header}</h1>
          <TextField name='email' label={messages.emailLabel} />
          <HarmonyButton
            variant={HarmonyButtonType.PRIMARY}
            text={messages.signUp}
            type='submit'
          />
        </Form>
      </Formik>
      <Text>{messages.haveAccount}</Text>
      <Link to={SIGN_IN_PAGE}>{messages.signIn}</Link>
    </>
  )
}
