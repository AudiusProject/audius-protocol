import {
  Button,
  ButtonType,
  Divider,
  Flex,
  IconArrowRight,
  SocialButton,
  Text,
  TextLink
} from '@audius/harmony'
import cn from 'classnames'
import { useFormikContext } from 'formik'
import { Link } from 'react-router-dom'

import audiusLogoColored from 'assets/img/audiusLogoColored.png'
import { HarmonyTextField } from 'components/form-fields/HarmonyTextField'
import PreloadImage from 'components/preload-image/PreloadImage'
import {
  ArtworkContainer,
  AudiusValues
} from 'pages/sign-on/components/AudiusValues'
import { LeftContentContainer } from 'pages/sign-on/components/desktop/LeftContentContainer'
import { SignOnContainerDesktop } from 'pages/sign-on/components/desktop/SignOnContainerDesktop'
import { SIGN_IN_PAGE } from 'utils/route'

import styles from './CreateEmailPage.module.css'
import { messages } from './messages'

export const CreateEmailPageDesktop = () => {
  const { isSubmitting } = useFormikContext()
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
              <Divider css={{ flex: 1, alignSelf: 'center' }} />
              <Text variant='body' size='m' tag='p' color='subdued'>
                {messages.socialsDividerText}
              </Text>
              <Divider css={{ flex: 1, alignSelf: 'center' }} />
            </Flex>
            <Flex direction='row' gap='s' w='100%'>
              <SocialButton
                socialType='twitter'
                css={{ flex: 1 }}
                aria-label='Sign up with Twitter'
              />
              <SocialButton
                socialType='instagram'
                css={{ flex: 1 }}
                aria-label='Sign up with Instagram'
              />
              <SocialButton
                socialType='tiktok'
                css={{ flex: 1 }}
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

            <Text variant='body' size='l'>
              {messages.haveAccount}{' '}
              <TextLink variant='visible' asChild>
                <Link to={SIGN_IN_PAGE}>{messages.signIn}</Link>
              </TextLink>
            </Text>
          </Flex>
        </LeftContentContainer>
        <ArtworkContainer>
          <AudiusValues />
        </ArtworkContainer>
      </SignOnContainerDesktop>
    </Flex>
  )
}
