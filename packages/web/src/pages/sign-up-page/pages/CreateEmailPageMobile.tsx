import {
  Button,
  ButtonType,
  Divider,
  Flex,
  IconArrowRight,
  IconAudiusLogoHorizontalColor,
  SocialButton,
  Text
} from '@audius/harmony'

import { HarmonyTextField } from 'components/form-fields/HarmonyTextField'
import { Link } from 'components/link'
import { MobileContentContainer } from 'pages/sign-on/components/desktop/MobileContentContainer'
import { PageWithAudiusValues } from 'pages/sign-on/components/desktop/PageWithAudiusValues'
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

export const CreateEmailPageMobile = ({
  isSubmitting
}: {
  isSubmitting: boolean
}) => {
  return (
    <PageWithAudiusValues>
      <MobileContentContainer
        gap='2xl'
        alignItems='center'
        className={styles.mobileCurvedContainer}
      >
        <IconAudiusLogoHorizontalColor />
        <Flex
          direction='column'
          gap='s'
          alignItems='center'
          w='100%'
          className={styles.textAlignCenter}
        >
          <Text color='heading' size='m' variant='heading' tag='h1'>
            {messages.title}
          </Text>
          <Text color='default' size='m' variant='body' tag='h2'>
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
            <Text variant='body' size='s' tag='p' color='subdued'>
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
        <Flex
          direction='column'
          gap='l'
          alignItems='center'
          w='100%'
          className={styles.textAlignCenter}
        >
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
      </MobileContentContainer>
    </PageWithAudiusValues>
  )
}
