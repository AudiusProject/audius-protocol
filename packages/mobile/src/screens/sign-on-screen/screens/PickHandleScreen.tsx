import { useCallback, useMemo } from 'react'

import { useAudiusQueryContext } from '@audius/common/audius-query'
import { pickHandlePageMessages } from '@audius/common/messages'
import { pickHandleSchema } from '@audius/common/schemas'
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
    <Paper
      shadow='flat'
      direction='column'
      backgroundColor='surface2'
      p='l'
      gap='l'
    >
      <Flex direction='column' gap='s'>
        <Text variant='title' size='m'>
          {pickHandlePageMessages.claimHandleHeaderPrefix}{' '}
          <Text color='accent'>@{pickHandlePageMessages.handle}</Text>
          <IconVerified size='s' style={{ marginLeft: spacing.xs }} />
        </Text>
        <Text variant='body' size='m'>
          {pickHandlePageMessages.claimHandleDescription}
        </Text>
      </Flex>
      <SocialMediaSignUpButtons
        onStart={onStart}
        onError={onError}
        onClose={onClose}
        onCompleteSocialMediaLogin={onCompleteSocialMediaLogin}
      />
      <Text variant='body' size='m'>
        {pickHandlePageMessages.claimHandleHeadsUp}
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
      <Page>
        {isWaitingForSocialLogin ? (
          <SocialMediaLoading onClose={handleCloseSocialMediaLogin} />
        ) : null}
        <Heading
          heading={pickHandlePageMessages.title}
          description={pickHandlePageMessages.description}
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
              {pickHandlePageMessages.or}
            </Text>
          </Divider>
          <SocialMediaSection
            onStart={handleStartSocialMediaLogin}
            onError={handleErrorSocialMediaLogin}
            onClose={handleCloseSocialMediaLogin}
            onCompleteSocialMediaLogin={handleCompleteSocialMediaLogin}
          />
        </Flex>
        <PageFooter />
      </Page>
    </Formik>
  )
}
