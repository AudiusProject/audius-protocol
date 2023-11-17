import {
  Box,
  Button,
  ButtonType,
  Flex,
  IconArrowRight,
  IconCloseAlt,
  Text,
  TextLink,
  useTheme
} from '@audius/harmony'
import { Form } from 'formik'
import { Link } from 'react-router-dom'

import audiusLogoColored from 'assets/img/audiusLogoColored.png'
import BackgroundWaves from 'components/background-animations/BackgroundWaves'
import { HarmonyPasswordField } from 'components/form-fields/HarmonyPasswordField'
import { HarmonyTextField } from 'components/form-fields/HarmonyTextField'
import Page from 'components/page/Page'
import PreloadImage from 'components/preload-image/PreloadImage'
import { LeftContentContainer } from 'pages/sign-on/components/desktop/LeftContentContainer'
import { PageWithAudiusValues } from 'pages/sign-on/components/desktop/PageWithAudiusValues'
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

type SignInPageProps = {
  title: string
  description: string
  canonicalUrl: string
}

export const SignInPageDesktop = (props: SignInPageProps) => {
  const { title, description, canonicalUrl } = props
  const { spacing } = useTheme()

  return (
    <Page
      title={title}
      description={description}
      canonicalUrl={canonicalUrl}
      css={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <BackgroundWaves />
      <IconCloseAlt
        color='staticWhite'
        css={{
          position: 'absolute',
          left: spacing['2xl'],
          top: spacing['2xl'],
          zIndex: 1
        }}
      />
      <PageWithAudiusValues>
        <LeftContentContainer gap='2xl' justifyContent='space-between'>
          <Flex direction='column' gap='2xl' alignItems='center'>
            <PreloadImage
              src={audiusLogoColored}
              className={styles.logo}
              alt='Audius Colored Logo'
            />
            <Flex w='100%' direction='row' justifyContent='flex-start'>
              <Text variant='heading' size='l' tag='h1' color='accent'>
                {messages.title}
              </Text>
            </Flex>
            <Box w='100%'>
              <Form>
                <Flex direction='column' gap='2xl' w='100%'>
                  <Flex direction='column' gap='l'>
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
                    <TextLink variant='visible' textVariant='body'>
                      {messages.forgotPassword}
                    </TextLink>
                  </Flex>
                </Flex>
              </Form>
            </Box>
          </Flex>
          <Button variant={ButtonType.SECONDARY} asChild>
            <Link to={SIGN_UP_PAGE}>{messages.createAccount}</Link>
          </Button>
        </LeftContentContainer>
      </PageWithAudiusValues>
    </Page>
  )
}
