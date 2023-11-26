import { useCallback, useContext, useEffect, useMemo, useRef } from 'react'

import { useDebouncedCallback, useAudiusQueryContext } from '@audius/common'
import {
  Button,
  Divider,
  Flex,
  IconArrowRight,
  IconVerified,
  Paper,
  Text,
  TextLink
} from '@audius/harmony'
import { Form, Formik, FormikProps, useField, useFormikContext } from 'formik'
import { useDispatch, useSelector } from 'react-redux'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import { setValueField } from 'common/store/pages/signon/actions'
import { getHandleField } from 'common/store/pages/signon/selectors'
import { HarmonyTextField } from 'components/form-fields/HarmonyTextField'
import { ToastContext } from 'components/toast/ToastContext'
import { useMedia } from 'hooks/useMedia'
import { useNavigateToPage } from 'hooks/useNavigateToPage'
import { SIGN_UP_FINISH_PROFILE_PAGE } from 'utils/route'

import { ContinueFooter } from '../components/ContinueFooter'
import { SignupFlowInstagramAuth } from '../components/SignupFlowInstagramAuth'
import { SignupFlowTikTokAuth } from '../components/SignupFlowTikTokAuth'
import { SignupFlowTwitterAuth } from '../components/SignupFlowTwitterAuth'
import { SocialMediaLoginOptions } from '../components/SocialMediaLoginOptions'
import { generateHandleSchema, errorMessages } from '../utils/handleSchema'
import { messages as socialMediaMessages } from '../utils/socialMediaMessages'

const messages = {
  pickYourHandle: 'Pick Your Handle',
  outOf: 'of',
  handleDescription:
    'This is how others find and tag you. It is totally unique to you & cannot be changed later.',
  handle: 'Handle',
  continue: 'Continue',
  linkToClaim: 'Link to claim.',
  goBack: 'Go Back',
  or: 'or',
  claimHandleHeaderPrefix: 'Claim Your Verified',
  claimHandleDescription:
    'Verify your Audius account by linking a verified social media account.',
  claimHandleHeadsUp:
    'Heads up! 👋 Picking a handle that doesn’t match your verified account cannot be undone later.',
  ...socialMediaMessages
}

const handleAuthMap = {
  [errorMessages.twitterReservedError]: SignupFlowTwitterAuth,
  [errorMessages.instagramReservedError]: SignupFlowInstagramAuth,
  [errorMessages.tiktokReservedError]: SignupFlowTikTokAuth
}

type PickHandleValues = {
  handle: string
}

type HandleFieldProps = {
  onCompleteSocialMediaLogin: (info: {
    requiresReview: boolean
    handle: string
    platform: 'twitter' | 'instagram' | 'tiktok'
  }) => void
}

const HandleField = ({ onCompleteSocialMediaLogin }: HandleFieldProps) => {
  const [{ value: handle }, { error }] = useField('handle')
  const { values, validateForm, setFieldError } =
    useFormikContext<PickHandleValues>()

  const { toast } = useContext(ToastContext)

  const debouncedValidate = useDebouncedCallback(
    validateForm,
    [validateForm],
    1000
  )

  useEffect(() => {
    debouncedValidate(values)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedValidate, values.handle])

  const handleVerifyHandleError = useCallback(() => {
    setFieldError('handle', messages.verificationError)
  }, [setFieldError])

  const handleLoginSuccess = useCallback(
    ({
      handle,
      requiresReview,
      platform
    }: {
      requiresReview: boolean
      handle: string
      platform: 'twitter' | 'instagram' | 'tiktok'
    }) => {
      toast(messages.socialMediaLoginSucess(platform))
      onCompleteSocialMediaLogin({
        handle,
        requiresReview,
        platform
      })
    },
    [onCompleteSocialMediaLogin, toast]
  )

  const AuthComponent = error ? handleAuthMap[error] : undefined

  const helperText =
    error && AuthComponent ? (
      <>
        {error}{' '}
        <TextLink variant='visible' asChild>
          <AuthComponent
            onFailure={handleVerifyHandleError}
            onSuccess={handleLoginSuccess}
          >
            <span>{messages.linkToClaim}</span>
          </AuthComponent>
        </TextLink>
      </>
    ) : null

  return (
    <HarmonyTextField
      name='handle'
      label={messages.handle}
      error={error && handle}
      helperText={helperText}
      startAdornmentText='@'
      placeholder={messages.handle}
      transformValue={(value) => value.replace(/\s/g, '')}
    />
  )
}

type SocialMediaSectionProps = {
  onCompleteSocialMediaLogin: (info: {
    requiresReview: boolean
    handle: string
    platform: 'twitter' | 'instagram' | 'tiktok'
  }) => void
}

const SocialMediaSection = ({
  onCompleteSocialMediaLogin
}: SocialMediaSectionProps) => {
  const { isMobile } = useMedia()
  return (
    <Paper direction='column' backgroundColor='surface2' p='l' gap='l'>
      <Flex direction='column' gap='s'>
        <Text
          variant={isMobile ? 'title' : 'heading'}
          size={isMobile ? 'm' : 's'}
        >
          {messages.claimHandleHeaderPrefix}{' '}
          <Text color='heading' tag='span'>
            @{messages.handle}
          </Text>{' '}
          <IconVerified
            size={isMobile ? 's' : 'm'}
            css={{ verticalAlign: 'sub' }}
          />
        </Text>
        <Text variant='body' size={isMobile ? 'm' : 'l'}>
          {messages.claimHandleDescription}
        </Text>
      </Flex>
      <SocialMediaLoginOptions
        onCompleteSocialMediaLogin={onCompleteSocialMediaLogin}
      />
      <Text variant='body' size={isMobile ? 'm' : 'l'}>
        {messages.claimHandleHeadsUp}
      </Text>
    </Paper>
  )
}

export const PickHandlePage = () => {
  const { isMobile } = useMedia()
  const formikRef = useRef<FormikProps<PickHandleValues>>(null)

  const dispatch = useDispatch()
  const navigate = useNavigateToPage()
  const { toast } = useContext(ToastContext)
  const audiusQueryContext = useAudiusQueryContext()
  const validationSchema = useMemo(() => {
    return toFormikValidationSchema(
      generateHandleSchema({ audiusQueryContext })
    )
  }, [audiusQueryContext])

  const { value } = useSelector(getHandleField)

  const handleSubmit = useCallback(
    (values: PickHandleValues) => {
      const { handle } = values
      dispatch(setValueField('handle', handle))
      navigate(SIGN_UP_FINISH_PROFILE_PAGE)
    },
    [dispatch, navigate]
  )

  const processSocialLoginResult = useCallback(
    ({
      requiresReview,
      handle,
      platform
    }: {
      requiresReview: boolean
      handle: string
      platform: 'twitter' | 'instagram' | 'tiktok'
    }) => {
      if (!requiresReview) {
        dispatch(setValueField('handle', handle))
        navigate(SIGN_UP_FINISH_PROFILE_PAGE)
        // TODO(nkang): Disable handle input + other login methods
      } else {
        formikRef.current?.setFieldValue('handle', handle, true)
      }
      toast(messages.socialMediaLoginSucess(platform))
    },
    [dispatch, navigate, toast]
  )

  const initialValues = {
    handle: value || ''
  }

  return (
    <Formik
      innerRef={formikRef}
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
      validateOnChange={false}
    >
      {({ isSubmitting, isValid, isValidating }) => (
        <Flex as={Form} direction='column' h='100%'>
          <Flex
            direction='column'
            gap='2xl'
            alignSelf='center'
            pv='xl'
            ph={isMobile ? 'l' : 'xl'}
            css={!isMobile && { maxWidth: 610 }}
          >
            <Flex gap={isMobile ? 's' : 'l'} direction='column'>
              {isMobile ? null : (
                <Text size='s' variant='label' color='subdued'>
                  1 {messages.outOf} 2
                </Text>
              )}
              <Text
                color='heading'
                size={isMobile ? 'm' : 'l'}
                strength='default'
                variant='heading'
              >
                {messages.pickYourHandle}
              </Text>
              <Text size={isMobile ? 'm' : 'l'} variant='body'>
                {messages.handleDescription}
              </Text>
            </Flex>
            <Flex direction='column' gap={isMobile ? 'l' : 'xl'}>
              <HandleField
                onCompleteSocialMediaLogin={processSocialLoginResult}
              />
              <Divider>
                <Text
                  variant='body'
                  color='subdued'
                  size='s'
                  css={{ textTransform: 'uppercase' }}
                >
                  {messages.or}
                </Text>
              </Divider>
              <SocialMediaSection
                onCompleteSocialMediaLogin={processSocialLoginResult}
              />
            </Flex>
          </Flex>
          <ContinueFooter>
            <Button
              type='submit'
              disabled={!isValid || isSubmitting}
              isLoading={isSubmitting || isValidating}
              iconRight={IconArrowRight}
              fullWidth={isMobile}
              css={!isMobile && { width: 343 }}
            >
              {messages.continue}
            </Button>
          </ContinueFooter>
        </Flex>
      )}
    </Formik>
  )
}
