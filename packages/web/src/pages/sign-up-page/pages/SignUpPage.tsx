import { useCallback } from 'react'

import {
  Button,
  ButtonType,
  Divider,
  Flex,
  IconArrowRight,
  Text,
  TextInput
} from '@audius/harmony'
import cn from 'classnames'
import { Form, Formik } from 'formik'

import audiusLogoColored from 'assets/img/audiusLogoColored.png'
import { Link } from 'components/link'

import PreloadImage from '../../../components/preload-image/PreloadImage'
import { SIGN_IN_PAGE } from '../../../utils/route'
import { SocialButton } from '../components/SocialButton'

import { CreatePasswordState } from './CreatePasswordPage'
import styles from './SignUpPage.module.css'

const messages = {
  title: 'Sign Up For Audius',
  emailLabel: 'Email',
  signUp: 'Sign Up Free',
  haveAccount: 'Already have an account?',
  signIn: 'Sign In',
  subHeader:
    'Join the revolution in music streaming! Discover, connect, and create on Audius.',
  dividerText: 'Or, get started with one of your socials'
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
    (_values: SignUpEmailValues) => {
      onNext({ stage: 'create-password' })
    },
    [onNext]
  )

  return (
    <>
      <Formik initialValues={initialValues} onSubmit={handleSubmit}>
        <Form>
          <Flex
            direction='column'
            alignItems='center'
            ph='2xl'
            pv='4xl'
            style={{ background: 'white' }}
            gap='2xl'
          >
            <PreloadImage
              src={audiusLogoColored}
              className={styles.logo}
              alt='Audius Colored Logo'
            />
            <Flex
              direction='column'
              gap='l'
              alignItems='flex-start'
              w='100%'
              className={styles.leftAlignText}
            >
              <Text color='heading' size='l' variant='heading' tag='h1'>
                {messages.title}
              </Text>
              <Text color='default' size='l' variant='body' tag='h2'>
                {messages.subHeader}
              </Text>
            </Flex>
            <Flex direction='column' gap='l' w='100%'>
              <TextInput name='email' label={messages.emailLabel} />
              <Flex w='100%' alignItems='center' gap='s'>
                <Divider className={styles.flex1} />
                <Text variant='body' size='m' tag='p' color='subdued'>
                  {messages.dividerText}
                </Text>
                <Divider className={styles.flex1} />
              </Flex>
              <Flex gap='s' w='100%' direction='row'>
                <SocialButton
                  type='twitter'
                  className={cn(styles.flex1, styles.w100)}
                />
                <SocialButton
                  type='instagram'
                  className={cn(styles.flex1, styles.w100)}
                />
                <SocialButton
                  type='tiktok'
                  className={cn(styles.flex1, styles.w100)}
                />
              </Flex>
            </Flex>
            <Flex direction='column' gap='l' alignItems='flex-start' w='100%'>
              <Button
                variant={ButtonType.PRIMARY}
                type='submit'
                fullWidth
                iconRight={IconArrowRight}
              >
                {messages.signUp}
              </Button>

              <Text variant='body' size='l' tag='p' color='default'>
                {messages.haveAccount}{' '}
                <Link
                  to={SIGN_IN_PAGE}
                  variant='body'
                  size='medium'
                  strength='strong'
                  color='secondary'
                >
                  {messages.signIn}
                </Link>
              </Text>
            </Flex>
          </Flex>
        </Form>
      </Formik>
    </>
  )
}
