import {
  Box,
  Button,
  Flex,
  IconArrowRight,
  IconAudiusLogoHorizontalColor,
  Text,
  TextLink
} from '@audius/harmony'
import { Form } from 'formik'
import { Link } from 'react-router-dom'

import { HarmonyPasswordField } from 'components/form-fields/HarmonyPasswordField'
import { HarmonyTextField } from 'components/form-fields/HarmonyTextField'
<<<<<<< HEAD
import MobilePageContainer from 'components/mobile-page-container/MobilePageContainer'
import { SIGN_UP_PAGE } from 'utils/route'
=======
import { ArtworkContainer } from 'pages/sign-on/components/AudiusValues'
import { SignOnContainerMobile } from 'pages/sign-on/components/mobile/SignOnContainerMobile'
>>>>>>> main

import styles from './SignInPageMobile.module.css'

const messages = {
  title: 'Sign Into Audius',
  emailLabel: 'Email',
  passwordLabel: 'Password',
  signIn: 'Sign In',
  newToAudius: 'New to Audius?',
  createAccount: 'Create an Account',
  forgotPassword: 'Forgot password?'
}

type SignInPageProps = {
  title: string
  description: string
  canonicalUrl: string
}

export const SignInPageMobile = (props: SignInPageProps) => {
  const { title, description, canonicalUrl } = props

  return (
<<<<<<< HEAD
    <MobilePageContainer
      title={title}
      description={description}
      canonicalUrl={canonicalUrl}
      fullHeight
    >
      <Flex
        className={styles.root}
        direction='column'
        w='100%'
        h='100%'
        justifyContent='space-between'
        pb='4xl'
      >
=======
    <SignOnContainerMobile>
      <ArtworkContainer justifyContent='space-between'>
>>>>>>> main
        <Flex
          className={styles.content}
          w='100%'
          pv='2xl'
          ph='l'
          direction='column'
          gap='2xl'
          justifyContent='space-between'
        >
          <Flex direction='column' gap='2xl' alignItems='center'>
            <IconAudiusLogoHorizontalColor />
<<<<<<< HEAD
            <Text variant='heading' size='l' tag='h1' color='accent'>
=======
            <Text variant='heading' size='l' tag='h1' color='heading'>
>>>>>>> main
              {messages.title}
            </Text>
            <Box w='100%'>
              <Form>
                <Flex direction='column' gap='2xl' w='100%'>
                  <Flex direction='column' gap='l'>
<<<<<<< HEAD
=======
                    {/* TODO: replace old TextField */}
>>>>>>> main
                    <HarmonyTextField
                      name='email'
                      label={messages.emailLabel}
                    />
                    <HarmonyPasswordField
                      name='password'
                      label={messages.passwordLabel}
                    />
                  </Flex>
<<<<<<< HEAD
                  <Flex direction='column' gap='l' alignItems='center'>
                    <Button iconRight={IconArrowRight} type='submit' fullWidth>
                      {messages.signIn}
                    </Button>
                    <TextLink variant='visible' textVariant='body'>
                      {messages.forgotPassword}
                    </TextLink>
=======
                  <Flex direction='column' gap='l'>
                    <Button iconRight={IconArrowRight} type='submit'>
                      {messages.signIn}
                    </Button>
                    <Text color='heading' variant='body'>
                      {/* TODO: link destination */}
                      {messages.forgotPassword}
                    </Text>
>>>>>>> main
                  </Flex>
                </Flex>
              </Form>
            </Box>
          </Flex>
<<<<<<< HEAD
        </Flex>
        <Flex
          direction='row'
          w='100%'
          justifyContent='center'
          gap='xs'
          mb='4xl'
        >
          <Text variant='title' strength='weak' color='staticWhite'>
            {messages.newToAudius}{' '}
            <TextLink variant='inverted' asChild>
              <Link to={SIGN_UP_PAGE}>{messages.createAccount}</Link>
            </TextLink>
          </Text>
        </Flex>
      </Flex>
    </MobilePageContainer>
=======
        </Flex>
        <Flex
          className={styles.createAccountRow}
          direction='row'
          w='100%'
          justifyContent='center'
          gap='xs'
          mb='4xl'
        >
          {/* TODO: args look good but style doesn't match design */}
          <Text variant='title'>{messages.newToAudius}</Text>
          <Link to={''}>{messages.createAccount}</Link>
        </Flex>
      </ArtworkContainer>
    </SignOnContainerMobile>
>>>>>>> main
  )
}
