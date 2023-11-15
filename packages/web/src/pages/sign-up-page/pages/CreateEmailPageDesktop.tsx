import {
  Button,
  ButtonType,
  Divider,
  Flex,
  IconArrowRight,
  SocialButton,
  Text
} from '@audius/harmony'
import cn from 'classnames'

import audiusLogoColored from 'assets/img/audiusLogoColored.png'
import { HarmonyTextField } from 'components/form-fields/HarmonyTextField'
import { Link } from 'components/link'
import PreloadImage from 'components/preload-image/PreloadImage'
import { LeftContentContainer } from 'pages/sign-on/components/desktop/LeftContentContainer'
import {
  ArtworkContainer,
  AudiusValues,
  SignOnContainerDesktop
} from 'pages/sign-on/components/desktop/PageWithAudiusValues'
import { SIGN_IN_PAGE } from 'utils/route'

import styles from './CreateEmailPage.module.css'

const messages = {
  title: 'Sign Up For Audius',
  emailLabel: 'Email',
  signUp: 'Sign Up Free',
  haveAccount: 'Already have an account?',
  signIn: 'Sign In',
  subHeader: (
    <>
      Join the revolution in music streaming! <br /> Discover, connect, and
      create on Audius.
    </>
  ),
  socialsDividerText: 'Or, get started with one of your socials',
  invalidEmail: 'Please enter a valid email.',
  unknownError: 'Unknown error occurred.'
}

export const CreateEmailPageDesktop = ({
  isSubmitting
}: {
  isSubmitting: boolean
}) => {
  return (
    <Flex h='100%' alignItems='center' justifyContent='center'>
      <SignOnContainerDesktop>
        <LeftContentContainer gap='2xl' alignItems='center'>
          <PreloadImage
            src={audiusLogoColored}
            alt='Audius Colored Logo'
            className={cn(styles.logo, styles.desktop)}
          />
          <Flex direction='column' gap='l' alignItems='flex-start' w='100%'>
            <Text color='heading' size='l' variant='heading' tag='h1'>
              {messages.title}
            </Text>
            <Text color='default' size='l' variant='body' tag='h2'>
              {messages.subHeader}
            </Text>
          </Flex>
          <Flex direction='column' gap='l' w='100%' alignItems='flex-start'>
            <HarmonyTextField
              name='email'
              autoFocus
              autoComplete='email'
              label={messages.emailLabel}
            />
            <Flex w='100%' alignItems='center' gap='s'>
              <Divider className={styles.flex1} />
              <Text variant='body' size='m' tag='p' color='subdued'>
                {messages.socialsDividerText}
              </Text>
              <Divider className={styles.flex1} />
            </Flex>
            <Flex direction='row' gap='s' w='100%'>
              <SocialButton
                socialType='twitter'
                className={styles.flex1}
                aria-label='Sign up with Twitter'
              />
              <SocialButton
                socialType='instagram'
                className={styles.flex1}
                aria-label='Sign up with Instagram'
              />
              <SocialButton
                socialType='tiktok'
                className={styles.flex1}
                aria-label='Sign up with TikTok'
              />
            </Flex>
          </Flex>
          <Flex direction='column' gap='l' alignItems='flex-start' w='100%'>
            <Button
              variant={ButtonType.PRIMARY}
              type='submit'
              fullWidth
              iconRight={IconArrowRight}
              isLoading={isSubmitting}
            >
              {messages.signUp}
            </Button>

            <Text size='l'>
              {messages.haveAccount}{' '}
              {/* TODO [C-3278]: Update with Harmony Link */}
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
        </LeftContentContainer>
        <ArtworkContainer isDesktop>
          <AudiusValues isDesktop />
        </ArtworkContainer>
      </SignOnContainerDesktop>
    </Flex>
  )
}
