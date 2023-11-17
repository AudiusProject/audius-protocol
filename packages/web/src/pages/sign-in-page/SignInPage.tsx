import { useCallback } from 'react'

import { Formik } from 'formik'
import { useDispatch } from 'react-redux'

import { signIn } from 'common/store/pages/signon/actions'
import { useMedia } from 'hooks/useMedia'
import { BASE_URL, SIGN_IN_PAGE } from 'utils/route'

import { SignInPageDesktop } from './SignInPageDesktop'
import { SignInPageMobile } from './SignInPageMobile'

const messages = {
  title: 'Sign In',
  description: 'Sign into your Audius account'
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

  const { isMobile } = useMedia()
  const SignInPageComponent = isMobile ? SignInPageMobile : SignInPageDesktop

  return (
    <Formik initialValues={initialValues} onSubmit={handleSubmit}>
      <SignInPageComponent
        title={messages.title}
        description={messages.description}
        canonicalUrl={`${BASE_URL}/${SIGN_IN_PAGE}`}
      />
    </Formik>
  )
}
