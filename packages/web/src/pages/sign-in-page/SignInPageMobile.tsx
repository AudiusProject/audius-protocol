import {
  Box,
  Button,
  Flex,
  IconArrowRight,
  IconAudiusLogoHorizontalColor,
  Text
} from '@audius/harmony'
import { Form } from 'formik'
import { Link } from 'react-router-dom'

import { HarmonyPasswordField } from 'components/form-fields/HarmonyPasswordField'
import { HarmonyTextField } from 'components/form-fields/HarmonyTextField'
import { ArtworkContainer } from 'pages/sign-on/components/AudiusValues'
import { SignOnContainerMobile } from 'pages/sign-on/components/mobile/SignOnContainerMobile'

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

export const SignInPageMobile = () => {
  return (
    <SignOnContainerMobile>
      <ArtworkContainer justifyContent='space-between'>
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
            <Text variant='heading' size='l' tag='h1' color='heading'>
              {messages.title}
            </Text>
            <Box w='100%'>
              <Form>
                <Flex direction='column' gap='2xl' w='100%'>
                  <Flex direction='column' gap='l'>
                    {/* TODO: replace old TextField */}
                    <HarmonyTextField
                      name='email'
                      label={messages.emailLabel}
                    />
                    <HarmonyPasswordField
                      name='password'
                      label={messages.passwordLabel}
                    />
                  </Flex>
                  <Flex direction='column' gap='l'>
                    <Button iconRight={IconArrowRight} type='submit'>
                      {messages.signIn}
                    </Button>
                    <Text color='heading' variant='body'>
                      {/* TODO: link destination */}
                      {messages.forgotPassword}
                    </Text>
                  </Flex>
                </Flex>
              </Form>
            </Box>
          </Flex>
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
  )
}
