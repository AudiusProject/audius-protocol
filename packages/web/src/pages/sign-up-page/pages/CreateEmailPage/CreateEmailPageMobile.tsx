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
import { useFormikContext } from 'formik'

import { HarmonyTextField } from 'components/form-fields/HarmonyTextField'
import { Link } from 'components/link'
import {
  ArtworkContainer,
  AudiusValues
} from 'pages/sign-on/components/AudiusValues'
import { MobileContentContainer } from 'pages/sign-on/components/desktop/MobileContentContainer'
import { SignOnContainerMobile } from 'pages/sign-on/components/mobile/SignOnContainerMobile'
import { SIGN_IN_PAGE } from 'utils/route'

import { messages } from './messages'

export const CreateEmailPageMobile = () => {
  const { isSubmitting } = useFormikContext()
  return (
    <SignOnContainerMobile>
      <ArtworkContainer>
        <MobileContentContainer
          gap='2xl'
          alignItems='center'
          css={(theme) => ({
            borderBottomLeftRadius: theme.cornerRadius['2xl'],
            borderBottomRightRadius: theme.cornerRadius['2xl']
          })}
        >
          <IconAudiusLogoHorizontalColor />
          <Flex
            direction='column'
            gap='s'
            alignItems='center'
            w='100%'
            css={{ textAlign: 'center' }}
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
            <Divider css={{ width: '100%' }}>
              <Text variant='body' size='s' tag='p' color='subdued'>
                {messages.socialsDividerText}
              </Text>
            </Divider>
            <Flex direction='row' gap='s' w='100%'>
              <SocialButton
                socialType='twitter'
                aria-label='Sign up with Twitter'
                css={{ flex: 1 }}
              />
              <SocialButton
                socialType='instagram'
                aria-label='Sign up with Instagram'
                css={{ flex: 1 }}
              />
              <SocialButton
                socialType='tiktok'
                aria-label='Sign up with TikTok'
                css={{ flex: 1 }}
              />
            </Flex>
          </Flex>
          <Flex
            direction='column'
            gap='l'
            alignItems='center'
            w='100%'
            css={{ textAlign: 'center' }}
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
        <AudiusValues />
      </ArtworkContainer>
    </SignOnContainerMobile>
  )
}
