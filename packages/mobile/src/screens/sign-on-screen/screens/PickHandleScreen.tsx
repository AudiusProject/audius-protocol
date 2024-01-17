import { useCallback, useMemo } from 'react'

import {
  pickHandlePageMessages as messages,
  pickHandleSchema,
  useAudiusQueryContext
} from '@audius/common'
import { css } from '@emotion/native'
import { getIsSocialConnected } from 'audius-client/src/common/store/pages/signon/selectors'
import {
  setValueField,
  unsetSocialProfile
} from 'common/store/pages/signon/actions'
import { Formik } from 'formik'
import { useDispatch, useSelector } from 'react-redux'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import {
  Divider,
  Flex,
  IconVerified,
  Paper,
  Text,
  useTheme
} from '@audius/harmony-native'
import { useNavigation } from 'app/hooks/useNavigation'

import { HandleField } from '../components/HandleField'
import { SocialMediaLoading } from '../components/SocialMediaLoading'
import { SocialMediaSignUpButtons } from '../components/SocialMediaSignUpButtons'
import { Heading, Page, PageFooter } from '../components/layout'
import { useSocialMediaLoader } from '../components/useSocialMediaLoader'
import type { SignUpScreenParamList } from '../types'
import { restrictedHandles } from '../utils/restrictedHandles'

const initialValues = {
  handle: ''
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
  onStart: () => void
  onError: () => void
  onClose: () => void
}

const SocialMediaSection = ({
  onCompleteSocialMediaLogin,
  onStart,
  onError,
  onClose
}: SocialMediaSectionProps) => {
  const { spacing } = useTheme()
  return (
    <Paper direction='column' backgroundColor='surface2' p='l' gap='l'>
      <Flex direction='column' gap='s'>
        <Text variant='title' size='m'>
          {messages.claimHandleHeaderPrefix}{' '}
          <Text color='accent'>@{messages.handle}</Text>
          <IconVerified size='s' style={{ marginLeft: spacing.xs }} />
        </Text>
        <Text variant='body' size='m'>
          {messages.claimHandleDescription}
        </Text>
      </Flex>
      <SocialMediaSignUpButtons
        onStart={onStart}
        onError={onError}
        onClose={onClose}
        onCompleteSocialMediaLogin={onCompleteSocialMediaLogin}
      />
      <Text variant='body' size='m'>
        {messages.claimHandleHeadsUp}
      </Text>
    </Paper>
  )
}

export const PickHandleScreen = () => {
  const navigation = useNavigation<SignUpScreenParamList>()
  const dispatch = useDispatch()
  const alreadyLinkedSocial = useSelector(getIsSocialConnected)
  const {
    isWaitingForSocialLogin,
    handleStartSocialMediaLogin,
    handleErrorSocialMediaLogin,
    handleCloseSocialMediaLogin,
    setIsWaitingForSocialLogin
  } = useSocialMediaLoader({
    resetAction: unsetSocialProfile,
    linkedSocialOnThisPagePreviously: alreadyLinkedSocial
  })

  const audiusQueryContext = useAudiusQueryContext()
  const validationSchema = useMemo(
    () =>
      toFormikValidationSchema(
        pickHandleSchema({ audiusQueryContext, restrictedHandles })
      ),
    [audiusQueryContext]
  )

  const handleSubmit = useCallback(
    (values: PickHandleValues) => {
      const { handle } = values
      dispatch(setValueField('handle', handle))
      navigation.navigate('FinishProfile')
    },
    [dispatch, navigation]
  )

  const handleCompleteSocialMediaLogin = useCallback(
    ({
      requiresReview,
      handle
    }: {
      requiresReview: boolean
      handle: string
      platform: 'twitter' | 'instagram' | 'tiktok'
    }) => {
      setIsWaitingForSocialLogin(false)
      dispatch(setValueField('handle', handle))
      if (requiresReview) {
        navigation.navigate('ReviewHandle')
      } else {
        navigation.navigate('FinishProfile')
      }
    },
    [dispatch, navigation, setIsWaitingForSocialLogin]
  )

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      validationSchema={validationSchema}
      validateOnChange={false}
    >
      {({ handleSubmit: triggerSubmit, dirty, isValid }) => (
        <Page>
          {isWaitingForSocialLogin ? (
            <SocialMediaLoading onClose={handleCloseSocialMediaLogin} />
          ) : null}
          <Heading
            heading={messages.title}
            description={messages.description}
          />
          <Flex direction='column' gap='l'>
            <HandleField />
            <Divider>
              <Text
                variant='body'
                color='subdued'
                size='s'
                style={css({ textTransform: 'uppercase' })}
              >
                {messages.or}
              </Text>
            </Divider>
            <SocialMediaSection
              onStart={handleStartSocialMediaLogin}
              onError={handleErrorSocialMediaLogin}
              onClose={handleCloseSocialMediaLogin}
              onCompleteSocialMediaLogin={handleCompleteSocialMediaLogin}
            />
          </Flex>
          <PageFooter
            p='l'
            buttonProps={{ disabled: !(dirty && isValid) }}
            onSubmit={triggerSubmit}
          />
        </Page>
      )}
    </Formik>
  )
}
