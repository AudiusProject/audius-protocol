import { useCallback, useMemo } from 'react'

import {
  emailSchema,
  createEmailPageMessages as messages,
  useAudiusQueryContext
} from '@audius/common'
import {
  Box,
  Button,
  Divider,
  Flex,
  IconArrowRight,
  IconAudiusLogoHorizontalColor,
  Text,
  TextLink
} from '@audius/harmony'
import { Form, Formik } from 'formik'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import audiusLogoColored from 'assets/img/audiusLogoColored.png'
import {
  resetSignOn,
  setLinkedSocialOnFirstPage,
  setValueField,
  startSignUp
} from 'common/store/pages/signon/actions'
import {
  getEmailField,
  getLinkedSocialOnFirstPage
} from 'common/store/pages/signon/selectors'
import PreloadImage from 'components/preload-image/PreloadImage'
import { useMedia } from 'hooks/useMedia'
import { useNavigateToPage } from 'hooks/useNavigateToPage'
import { SocialMediaLoginOptions } from 'pages/sign-up-page/components/SocialMediaLoginOptions'
import {
  SIGN_IN_PAGE,
  SIGN_UP_CREATE_LOGIN_DETAILS,
  SIGN_UP_PASSWORD_PAGE,
  SIGN_UP_REVIEW_HANDLE_PAGE
} from 'utils/route'

import { NewEmailField } from '../components/EmailField'
import { SignUpWithMetaMaskButton } from '../components/SignUpWithMetaMaskButton'
import { SocialMediaLoading } from '../components/SocialMediaLoading'
import { Heading, Page } from '../components/layout'
import { useSocialMediaLoader } from '../hooks/useSocialMediaLoader'

export type SignUpEmailValues = {
  email: string
}

export const CreateEmailPage = () => {
  const { isMobile } = useMedia()
  const dispatch = useDispatch()
  const navigate = useNavigateToPage()
  const existingEmailValue = useSelector(getEmailField)
  const alreadyLinkedSocial = useSelector(getLinkedSocialOnFirstPage)
  const audiusQueryContext = useAudiusQueryContext()
  const EmailSchema = useMemo(
    () => toFormikValidationSchema(emailSchema(audiusQueryContext)),
    [audiusQueryContext]
  )

  const initialValues = {
    email: existingEmailValue.value ?? ''
  }

  const {
    isWaitingForSocialLogin,
    handleStartSocialMediaLogin,
    handleErrorSocialMediaLogin
  } = useSocialMediaLoader({
    resetAction: resetSignOn,
    linkedSocialOnThisPagePreviously: alreadyLinkedSocial,
    page: 'create-email'
  })

  const handleCompleteSocialMediaLogin = useCallback(
    (result: { requiresReview: boolean; handle: string }) => {
      const { handle, requiresReview } = result
      dispatch(startSignUp())
      dispatch(setLinkedSocialOnFirstPage(true))
      dispatch(setValueField('handle', handle))
      navigate(
        requiresReview
          ? SIGN_UP_REVIEW_HANDLE_PAGE
          : SIGN_UP_CREATE_LOGIN_DETAILS
      )
    },
    [dispatch, navigate]
  )

  const handleSubmit = useCallback(
    async (values: SignUpEmailValues) => {
      const { email } = values
      dispatch(setValueField('email', email))
      navigate(SIGN_UP_PASSWORD_PAGE)
    },
    [dispatch, navigate]
  )

  const signInLink = (
    <TextLink variant='visible' asChild>
      <Link to={SIGN_IN_PAGE}>{messages.signIn}</Link>
    </TextLink>
  )

  return isWaitingForSocialLogin ? (
    <SocialMediaLoading />
  ) : (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      validationSchema={EmailSchema}
      validateOnChange={false}
    >
      {({ isSubmitting }) => (
        <Page as={Form} pt={isMobile ? 'xl' : 'unit13'}>
          <Box alignSelf='center'>
            {isMobile ? (
              <IconAudiusLogoHorizontalColor />
            ) : (
              <PreloadImage
                src={audiusLogoColored}
                alt='Audius Colored Logo'
                css={{
                  height: 160,
                  width: 160,
                  objectFit: 'contain'
                }}
              />
            )}
          </Box>
          <Heading
            heading={messages.title}
            description={
              <>
                {messages.subHeader.line1}
                <br /> {messages.subHeader.line2}
              </>
            }
            tag='h1'
            centered={isMobile}
          />
          <Flex direction='column' gap='l'>
            <NewEmailField />
            <Divider>
              <Text variant='body' size={isMobile ? 's' : 'm'} color='subdued'>
                {messages.socialsDividerText}
              </Text>
            </Divider>
            <SocialMediaLoginOptions
              onError={handleErrorSocialMediaLogin}
              onStart={handleStartSocialMediaLogin}
              onCompleteSocialMediaLogin={handleCompleteSocialMediaLogin}
            />
          </Flex>
          <Flex direction='column' gap='l'>
            <Button
              variant='primary'
              type='submit'
              fullWidth
              iconRight={IconArrowRight}
              isLoading={isSubmitting}
            >
              {messages.signUp}
            </Button>

            <Text
              variant='body'
              size={isMobile ? 'm' : 'l'}
              textAlign={isMobile ? 'center' : undefined}
            >
              {messages.haveAccount} {signInLink}
            </Text>
          </Flex>
          {!isMobile && window.ethereum ? (
            <Flex direction='column' gap='s'>
              <SignUpWithMetaMaskButton />
              <Text size='s' variant='body'>
                {messages.metaMaskNotRecommended}{' '}
                <TextLink variant='visible'>{messages.learnMore}</TextLink>
              </Text>
            </Flex>
          ) : null}
        </Page>
      )}
    </Formik>
  )
}
