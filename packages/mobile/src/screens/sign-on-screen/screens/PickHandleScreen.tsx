import { useCallback, useMemo } from 'react'

import {
  pickHandlePageMessages as messages,
  pickHandleSchema,
  useAudiusQueryContext
} from '@audius/common'
import { css } from '@emotion/native'
import { setValueField } from 'common/store/pages/signon/actions'
import { Formik } from 'formik'
import { useDispatch } from 'react-redux'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import {
  Flex,
  IconVerified,
  Paper,
  Text,
  useTheme
} from '@audius/harmony-native'
import { TextField } from 'app/components/fields'
import { useNavigation } from 'app/hooks/useNavigation'

import { SocialMediaSignUpButtons } from '../components/SocialMediaSignUpButtons'
import { Heading, Page, PageFooter } from '../components/layout'
import { Divider } from '../components/temp-harmony/Divider'
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
}

const SocialMediaSection = ({
  onCompleteSocialMediaLogin
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
        onStart={() => {}}
        onError={() => {}}
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
      handle,
      platform
    }: {
      requiresReview: boolean
      handle: string
      platform: 'twitter' | 'instagram' | 'tiktok'
    }) => {
      dispatch(setValueField('handle', handle))
      // TODO: social media handle impl
      if (!requiresReview) {
        // navigate(SIGN_UP_FINISH_PROFILE_PAGE)
      } else {
        // navigate(SIGN_UP_REVIEW_HANDLE_PAGE)
      }
      // toast(socialMediaMessages.socialMediaLoginSucess(platform))
    },
    [dispatch]
  )

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      validationSchema={validationSchema}
    >
      {({ handleSubmit: triggerSubmit, dirty, isValid }) => (
        <Page>
          <Heading
            heading={messages.title}
            description={messages.description}
          />
          <Flex direction='column' gap='l'>
            {/* TODO: add verification flow error message to the handle field component */}
            <TextField name='handle' label={messages.handle} noGutter />
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
