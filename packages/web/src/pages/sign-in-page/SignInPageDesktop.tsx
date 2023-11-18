import { Box, Button, Flex, IconArrowRight, Text } from '@audius/harmony'
import { Button as ButtonTmp } from '@audius/stems'
import { Form } from 'formik'
import { Link } from 'react-router-dom'

import audiusLogoColored from 'assets/img/audiusLogoColored.png'
import { HarmonyPasswordField } from 'components/form-fields/HarmonyPasswordField'
import { HarmonyTextField } from 'components/form-fields/HarmonyTextField'
import PreloadImage from 'components/preload-image/PreloadImage'
import { useNavigateToPage } from 'hooks/useNavigateToPage'
import {
  ArtworkContainer,
  AudiusValues
} from 'pages/sign-on/components/AudiusValues'
import { LeftContentContainer } from 'pages/sign-on/components/desktop/LeftContentContainer'
import { MetaMaskOption } from 'pages/sign-on/components/desktop/MetaMaskOption'
import { SignOnContainerDesktop } from 'pages/sign-on/components/desktop/SignOnContainerDesktop'
import { userHasMetaMask } from 'pages/sign-up-page/utils/metamask'
import { FEED_PAGE, SIGN_UP_PAGE } from 'utils/route'

import styles from './SignInPage.module.css'

const messages = {
  title: 'Sign Into Audius',
  emailLabel: 'Email',
  passwordLabel: 'Password',
  signIn: 'Sign In',
  createAccount: 'Create An Account',
  forgotPassword: 'Forgot password?'
}

export const SignInPageDesktop = () => {
  const navigate = useNavigateToPage()

  const handleSignInWithMetaMask = async () => {
    try {
      window.localStorage.setItem('useMetaMask', JSON.stringify(true))
    } catch (err) {
      console.error(err)
    }
    navigate(FEED_PAGE)
    window.location.reload()
  }

  return (
    <Flex h='100%' alignItems='center' justifyContent='center'>
      <SignOnContainerDesktop>
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
                    <HarmonyPasswordField
                      name='password'
                      label={messages.passwordLabel}
                    />
                  </Flex>
                  <Flex direction='column' gap='l'>
                    <Flex direction='column' w='100%'>
                      <Button iconRight={IconArrowRight} type='submit'>
                        {messages.signIn}
                      </Button>
                      {userHasMetaMask ? (
                        <MetaMaskOption
                          text='Sign In With'
                          onClick={handleSignInWithMetaMask}
                        />
                      ) : null}
                    </Flex>
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
        <ArtworkContainer>
          <AudiusValues />
        </ArtworkContainer>
      </SignOnContainerDesktop>
    </Flex>
  )
}
