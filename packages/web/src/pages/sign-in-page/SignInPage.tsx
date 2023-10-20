import { useCallback } from 'react'

import { Button, ButtonType, Flex, Text } from '@audius/harmony'
import { Form, Formik } from 'formik'
import { useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'

import audiusLogoColored from 'assets/img/audiusLogoColored.png'
import { signIn } from 'common/store/pages/signon/actions'
import { TextField } from 'components/form-fields'
import PreloadImage from 'components/preload-image/PreloadImage'
import { SIGN_UP_PAGE } from 'utils/route'

import styles from './SignInPage.module.css'

const messages = {
  title: 'Sign Into Audius',
  emailLabel: 'Email',
  passwordLabel: 'Password',
  signIn: 'Sign In',
  createAccount: 'Create An Account',
  forgotPassword: 'Forgot password?'
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
    <Flex
      className={styles.root}
      h='100%'
      w={480}
      // want 80px but don't have var for it
      pv='4xl'
      ph='2xl'
      direction='column'
      gap='2xl'
      justifyContent='space-between'
    >
      {/* TODO: confirm 40px spacing value */}
      <Flex direction='column' gap='2xl' alignItems='center'>
        <PreloadImage
          src={audiusLogoColored}
          className={styles.logo}
          alt='Audius Colored Logo'
        />
        <Flex w='100%' direction='row' justifyContent='flex-start'>
          <Text variant='heading' size='l' tag='h1' color='heading'>
            {messages.title}
          </Text>
        </Flex>
        <Formik initialValues={initialValues} onSubmit={handleSubmit}>
          <Form className={styles.form}>
            <Flex direction='column' gap='2xl' w='100%'>
              <Flex direction='column' gap='l'>
                <TextField name='email' label={messages.emailLabel} />
                <TextField
                  name='password'
                  label={messages.passwordLabel}
                  type='password'
                />
              </Flex>
              <Flex direction='column' gap='l'>
                <Button text={messages.signIn} type='submit' />
                <Flex direction='row' alignItems='flexStart'>
                  <Text color='heading'>
                    {/* TODO: link destination */}
                    <Link to={''}>{messages.forgotPassword}</Link>
                  </Text>
                </Flex>
              </Flex>
            </Flex>
          </Form>
        </Formik>
      </Flex>
      <Button
        // @ts-ignore
        asChild={Link}
        variant={ButtonType.SECONDARY}
        to={SIGN_UP_PAGE}
        text={messages.createAccount}
      />
    </Flex>
  )
}
