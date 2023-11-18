import { useCallback, useContext, useEffect, useMemo, useRef } from 'react'

import { AudiusQueryContext, useDebouncedCallback } from '@audius/common'
import {
  Box,
  Button,
  Divider,
  Flex,
  IconArrowRight,
  IconVerified,
  PlainButton,
  PlainButtonType,
  Text
} from '@audius/harmony'
import { Form, Formik, FormikProps, useFormikContext } from 'formik'
import { isEmpty } from 'lodash'
import { useDispatch, useSelector } from 'react-redux'
import { useHistory } from 'react-router-dom'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import { setValueField } from 'common/store/pages/signon/actions'
import { getHandleField } from 'common/store/pages/signon/selectors'
import { HarmonyTextField } from 'components/form-fields/HarmonyTextField'
import { ToastContext } from 'components/toast/ToastContext'
import { useNavigateToPage } from 'hooks/useNavigateToPage'
import { SIGN_UP_FINISH_PROFILE_PAGE } from 'utils/route'

import { ContinueFooter } from '../components/ContinueFooter'
import { SignupFlowInstagramAuth } from '../components/SignupFlowInstagramAuth'
import { SignupFlowTikTokAuth } from '../components/SignupFlowTikTokAuth'
import { SignupFlowTwitterAuth } from '../components/SignupFlowTwitterAuth'
import { SocialMediaLoginOptions } from '../components/SocialMediaLoginOptions'
import {
  generateHandleSchema,
  errorMessages as handleErrorMessages
} from '../utils/handleSchema'
import { messages as socialMediaMessages } from '../utils/socialMediaMessages'

import styles from './PickHandlePage.module.css'

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
  ...socialMediaMessages,
  ...handleErrorMessages
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
  const {
    values,
    validateForm,
    errors: { handle: error },
    setFieldError
  } = useFormikContext<PickHandleValues>()

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

  let helperText: React.ReactNode = error

  if (error === messages.twitterReservedError) {
    helperText = (
      <>
        {messages.twitterReservedError}{' '}
        <SignupFlowTwitterAuth
          className={styles.linkToClaim}
          onFailure={handleVerifyHandleError}
          onSuccess={({ handle, requiresReview }) =>
            handleLoginSuccess({ handle, requiresReview, platform: 'twitter' })
          }
        >
          {messages.linkToClaim}
        </SignupFlowTwitterAuth>
      </>
    )
  } else if (error === messages.instagramReservedError) {
    helperText = (
      <>
        {messages.instagramReservedError}{' '}
        <SignupFlowInstagramAuth
          onFailure={handleVerifyHandleError}
          onSuccess={({ handle, requiresReview }) =>
            handleLoginSuccess({
              handle,
              requiresReview,
              platform: 'instagram'
            })
          }
          className={styles.linkToClaim}
        >
          {messages.linkToClaim}
        </SignupFlowInstagramAuth>
      </>
    )
  } else if (error === messages.tiktokReservedError) {
    helperText = (
      <>
        {messages.tiktokReservedError}{' '}
        <SignupFlowTikTokAuth
          onFailure={handleVerifyHandleError}
          onSuccess={({ handle, requiresReview }) =>
            handleLoginSuccess({ handle, requiresReview, platform: 'tiktok' })
          }
        >
          <button className={styles.linkToClaim}>{messages.linkToClaim}</button>
        </SignupFlowTikTokAuth>
      </>
    )
  }

  return (
    <HarmonyTextField
      name='handle'
      label={messages.handle}
      error={!!error && !isEmpty(values.handle)}
      helperText={!!error && !isEmpty(values.handle) ? helperText : undefined}
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
  return (
    <Flex
      borderRadius='m'
      direction='column'
      className={styles.socialsContainer}
      p='l'
      gap='l'
    >
      <Box>
        <Text tag='span' variant='heading' size='s'>
          {messages.claimHandleHeaderPrefix}{' '}
        </Text>
        <Text tag='span' variant='heading' color='heading' size='s'>
          @{messages.handle}
        </Text>
        <IconVerified size='m' className={styles.verifiedIcon} />
      </Box>
      <Box>
        <Text variant='body' size='l'>
          {messages.claimHandleDescription}
        </Text>
      </Box>
      <SocialMediaLoginOptions
        onCompleteSocialMediaLogin={onCompleteSocialMediaLogin}
      />
      <Box>
        <Text variant='body' size='l'>
          {messages.claimHandleHeadsUp}
        </Text>
      </Box>
    </Flex>
  )
}

export const PickHandlePage = () => {
  const formikRef = useRef<FormikProps<PickHandleValues>>(null)

  const dispatch = useDispatch()
  const navigate = useNavigateToPage()
  const { toast } = useContext(ToastContext)
  const history = useHistory()
  const queryContext = useContext(AudiusQueryContext)
  const validationSchema = useMemo(() => {
    if (queryContext != null) {
      return toFormikValidationSchema(
        generateHandleSchema({ audiusQueryContext: queryContext })
      )
    }
    return undefined
  }, [queryContext])

  const { value } = useSelector(getHandleField)

  const handleClickBackIcon = useCallback(() => {
    history.goBack()
  }, [history])

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
    <Box h='100%' className={styles.outerContainer}>
      <Formik
        innerRef={formikRef}
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        validateOnChange={false}
      >
        {({ isSubmitting, isValid, isValidating }) => (
          <Form>
            <Flex direction='column' justifyContent='space-between' h='100%'>
              <Flex
                pv='3xl'
                className={styles.contentContainer}
                direction='column'
                gap='xl'
              >
                <Box>
                  <Flex gap='l' direction='column'>
                    <Box>
                      <Text size='s' variant='label' color='subdued'>
                        1 {messages.outOf} 2
                      </Text>
                    </Box>
                    <Box>
                      <Text
                        color='heading'
                        size='l'
                        strength='default'
                        variant='heading'
                      >
                        {messages.pickYourHandle}
                      </Text>
                    </Box>
                    <Box>
                      <Text size='l' variant='body'>
                        {messages.handleDescription}
                      </Text>
                    </Box>
                  </Flex>
                  <Box mt='2xl'>
                    <HandleField
                      onCompleteSocialMediaLogin={processSocialLoginResult}
                    />
                  </Box>
                </Box>
                <Flex alignItems='center' justifyContent='center' gap='s'>
                  <Divider className={styles.divider} />
                  <Text
                    variant='body'
                    color='subdued'
                    size='s'
                    className={styles.dividerText}
                  >
                    {messages.or}
                  </Text>
                  <Divider className={styles.divider} />
                </Flex>
                <SocialMediaSection
                  onCompleteSocialMediaLogin={processSocialLoginResult}
                />
              </Flex>
              <ContinueFooter>
                <Button
                  type='submit'
                  disabled={!isValid || isSubmitting}
                  isLoading={isSubmitting || isValidating}
                  iconRight={IconArrowRight}
                >
                  {messages.continue}
                </Button>
                <PlainButton
                  onClick={handleClickBackIcon}
                  variant={PlainButtonType.SUBDUED}
                >
                  {messages.goBack}
                </PlainButton>
              </ContinueFooter>
            </Flex>
          </Form>
        )}
      </Formik>
    </Box>
  )
}
