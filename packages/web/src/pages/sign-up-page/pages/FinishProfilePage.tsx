import { useCallback } from 'react'

import {
  MAX_DISPLAY_NAME_LENGTH,
  finishProfilePageMessages as messages
} from '@audius/common'
import {
  Paper,
  PlainButton,
  PlainButtonType,
  Text,
  useTheme
} from '@audius/harmony'
import { Formik, Form, useField } from 'formik'
import { useDispatch, useSelector } from 'react-redux'
import { useHistory } from 'react-router-dom'
import { z } from 'zod'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import {
  setField,
  setValueField,
  setFinishedPhase1
} from 'common/store/pages/signon/actions'
import {
  getCoverPhotoField,
  getIsSocialConnected,
  getLinkedSocialOnFirstPage,
  getNameField,
  getProfileImageField
} from 'common/store/pages/signon/selectors'
import { HarmonyTextField } from 'components/form-fields/HarmonyTextField'
import { useMedia } from 'hooks/useMedia'
import { useNavigateToPage } from 'hooks/useNavigateToPage'
import { SIGN_UP_GENRES_PAGE } from 'utils/route'

import { AccountHeader } from '../components/AccountHeader'
import { ImageFieldValue } from '../components/ImageField'
import { OutOfText } from '../components/OutOfText'
import { Heading, Page, PageFooter } from '../components/layout'

export type FinishProfileValues = {
  profileImage: ImageFieldValue
  coverPhoto?: ImageFieldValue
  displayName: string
}

const formSchema = toFormikValidationSchema(
  z.object({
    displayName: z.string().max(MAX_DISPLAY_NAME_LENGTH, ''),
    profileImage: z.object({
      url: z.string()
    }),
    coverPhoto: z
      .object({
        url: z.string().optional()
      })
      .optional()
  })
)

export const FinishProfilePage = () => {
  const { isMobile } = useMedia()
  const history = useHistory()
  const dispatch = useDispatch()
  const navigate = useNavigateToPage()

  const { value: savedDisplayName } = useSelector(getNameField)
  const isSocialConnected = useSelector(getIsSocialConnected)
  const linkedSocialOnFirstPage = useSelector(getLinkedSocialOnFirstPage)
  const { value: savedCoverPhoto } = useSelector(getCoverPhotoField) ?? {}
  const { value: savedProfileImage } = useSelector(getProfileImageField) ?? {}

  // If the user comes back from a later page we start with whats in the store
  const initialValues = {
    profileImage: savedProfileImage,
    coverPhoto: savedCoverPhoto,
    displayName: savedDisplayName || ''
  }

  const handleSubmit = useCallback(
    ({ coverPhoto, profileImage, displayName }: FinishProfileValues) => {
      dispatch(setValueField('name', displayName))
      dispatch(setField('profileImage', { value: profileImage }))
      if (coverPhoto) {
        dispatch(setField('coverPhoto', { value: coverPhoto }))
      }
      dispatch(setFinishedPhase1(true))
      navigate(SIGN_UP_GENRES_PAGE)
    },
    [navigate, dispatch]
  )

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      validationSchema={formSchema}
      validateOnMount
      validateOnChange
    >
      {({ isValid, values }) => (
        <Page
          as={Form}
          centered
          transition={isMobile ? 'horizontal' : 'vertical'}
          transitionBack='horizontal'
        >
          <Heading
            prefix={
              isMobile || linkedSocialOnFirstPage ? null : (
                <OutOfText numerator={2} denominator={2} />
              )
            }
            heading={messages.header}
            description={messages.description}
            centered={!isMobile}
          />
          <Paper direction='column'>
            <AccountHeader
              mode='editing'
              formDisplayName={values.displayName}
              formProfileImage={values.profileImage}
            />
            <HarmonyTextField
              name='displayName'
              label={messages.displayName}
              placeholder={messages.inputPlaceholder}
              required
              autoFocus
              maxLength={32}
              css={(theme) => ({
                padding: theme.spacing.l,
                paddingTop: theme.spacing.unit10
              })}
            />
          </Paper>
          {isMobile ? null : <UploadProfilePhotoHelperText />}
          <PageFooter
            centered
            buttonProps={{ disabled: !isValid }}
            prefix={isMobile ? <UploadProfilePhotoHelperText /> : null}
            postfix={
              isMobile || isSocialConnected ? null : (
                <PlainButton
                  variant={PlainButtonType.SUBDUED}
                  onClick={history.goBack}
                >
                  {messages.goBack}
                </PlainButton>
              )
            }
          />
        </Page>
      )}
    </Formik>
  )
}

const UploadProfilePhotoHelperText = () => {
  const [{ value: displayName }, { touched }] = useField('displayName')
  const [{ value: profileImage }] = useField('profileImage')
  const isVisible = displayName && touched && !profileImage
  const { motion } = useTheme()

  return (
    <Text
      variant='body'
      textAlign='center'
      css={{
        opacity: isVisible ? 1 : 0,
        transition: `opacity ${motion.calm}`
      }}
    >
      {messages.uploadProfilePhoto}
    </Text>
  )
}
