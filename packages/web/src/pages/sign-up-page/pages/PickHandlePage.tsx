import { useCallback, useContext, useMemo } from 'react'

import { useAudiusQueryContext } from '@audius/common'
import {
  Button,
  Divider,
  Flex,
  IconArrowRight,
  IconVerified,
  Paper,
  Text
} from '@audius/harmony'
import { Form, Formik } from 'formik'
import { useDispatch, useSelector } from 'react-redux'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import { setValueField } from 'common/store/pages/signon/actions'
import {
  getHandleField,
  getLinkedSocialOnFirstPage
} from 'common/store/pages/signon/selectors'
import { ToastContext } from 'components/toast/ToastContext'
import { useMedia } from 'hooks/useMedia'
import { useNavigateToPage } from 'hooks/useNavigateToPage'
import {
  SIGN_UP_CREATE_LOGIN_DETAILS,
  SIGN_UP_FINISH_PROFILE_PAGE,
  SIGN_UP_REVIEW_HANDLE_PAGE
} from 'utils/route'

import { ContinueFooter } from '../components/ContinueFooter'
import { HandleField } from '../components/HandleField'
import { SocialMediaLoginOptions } from '../components/SocialMediaLoginOptions'
import { generateHandleSchema } from '../utils/handleSchema'
import { socialMediaMessages } from '../utils/socialMediaMessages'

const messages = {
  pickYourHandle: 'Pick Your Handle',
  outOf: (numerator: number, denominator: number) =>
    `${numerator} of ${denominator}`,
  handleDescription:
    'This is how others find and tag you. It is totally unique to you & cannot be changed later.',
  handle: 'Handle',
  continue: 'Continue',
  goBack: 'Go Back',
  or: 'or',
  claimHandleHeaderPrefix: 'Claim Your Verified',
  claimHandleDescription:
    'Verify your Audius account by linking a verified social media account.',
  claimHandleHeadsUp:
    'Heads up! 👋 Picking a handle that doesn’t match your verified account cannot be undone later.',
  ...socialMediaMessages
}

type PickHandleValues = {
  handle: string
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

  const dispatch = useDispatch()
  const navigate = useNavigateToPage()
  const { toast } = useContext(ToastContext)
  const audiusQueryContext = useAudiusQueryContext()
  const validationSchema = useMemo(() => {
    return toFormikValidationSchema(
      generateHandleSchema({ audiusQueryContext })
    )
  }, [audiusQueryContext])

  const { value: handle } = useSelector(getHandleField)
  const isLinkingSocialOnFirstPage = useSelector(getLinkedSocialOnFirstPage)

  const handleSubmit = useCallback(
    (values: PickHandleValues) => {
      const { handle } = values
      dispatch(setValueField('handle', handle))
      navigate(
        isLinkingSocialOnFirstPage
          ? SIGN_UP_CREATE_LOGIN_DETAILS
          : SIGN_UP_FINISH_PROFILE_PAGE
      )
    },
    [dispatch, navigate, isLinkingSocialOnFirstPage]
  )

  const handleCompleteSocialMediaLogin = useCallback(
    ({
      requiresReview,
      handle,
      platform
    }: {
      requiresReview: boolean
      handle: string
      platform: 'twitter' | 'instagram' | 'tiktok'
    }) => {
      dispatch(setValueField('handle', handle))
      if (!requiresReview) {
        navigate(SIGN_UP_FINISH_PROFILE_PAGE)
      } else {
        navigate(SIGN_UP_REVIEW_HANDLE_PAGE)
      }
      toast(messages.socialMediaLoginSucess(platform))
    },
    [dispatch, navigate, toast]
  )

  const initialValues = {
    handle
  }

  return (
    <Formik
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
                  {messages.outOf(1, 2)}
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
                onCompleteSocialMediaLogin={handleCompleteSocialMediaLogin}
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
                onCompleteSocialMediaLogin={handleCompleteSocialMediaLogin}
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
