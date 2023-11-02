import {
  Box,
  Button,
  Flex,
  IconArrowRight,
  IconVisibilityHidden,
  Text
} from '@audius/harmony'
import { Button as ButtonTmp } from '@audius/stems'
import { Form } from 'formik'
import { Link } from 'react-router-dom'

import audiusLogoColored from 'assets/img/audiusLogoColored.png'
import { HarmonyTextField } from 'components/form-fields/HarmonyTextField'
import PreloadImage from 'components/preload-image/PreloadImage'
import { PageWithAudiusValues } from 'pages/sign-on/components/desktop/PageWithAudiusValues'
import { SIGN_UP_PAGE } from 'utils/route'

import styles from './SignInPage.module.css'
import { LeftContentContainer } from 'pages/sign-on/components/desktop/LeftContentContainer'

const messages = {
  title: 'Sign Into Audius',
  emailLabel: 'Email',
  passwordLabel: 'Password',
  signIn: 'Sign In',
  createAccount: 'Create An Account',
  forgotPassword: 'Forgot password?'
}

export const SignInPageDesktop = () => {
  return (
    <Flex h='100%' alignItems='center' justifyContent='center'>
      <PageWithAudiusValues>
        <LeftContentContainer gap='2xl' justifyContent='space-between'>
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
            <Box w='100%'>
              <Form>
                <Flex direction='column' gap='2xl' w='100%'>
                  <Flex direction='column' gap='l'>
                    {/* TODO: replace old TextField */}
                    <HarmonyTextField
                      name='email'
                      label={messages.emailLabel}
                    />
                    {/* TODO: password visibility icon and toggle */}
                    <HarmonyTextField
                      name='password'
                      label={messages.passwordLabel}
                      endIcon={IconVisibilityHidden}
                      type='password'
                    />
                  </Flex>
                  <Flex direction='column' gap='l'>
                    <Button iconRight={IconArrowRight} type='submit'>
                      {messages.signIn}
                    </Button>
                    <Flex direction='row' alignItems='flexStart'>
                      <Text color='heading'>
                        {/* TODO: link destination */}
                        <Link to={''}>{messages.forgotPassword}</Link>
                      </Text>
                    </Flex>
                  </Flex>
                </Flex>
              </Form>
            </Box>
          </Flex>
          {/* TODO: switch to stems button when we have asChild support */}
          <ButtonTmp
            // @ts-ignore
            as={Link}
            to={SIGN_UP_PAGE}
            text={messages.createAccount}
          />{' '}
        </LeftContentContainer>
      </PageWithAudiusValues>
    </Flex>
  )
}
