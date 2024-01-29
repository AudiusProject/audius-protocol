import { useCallback, useRef } from 'react'

import {
  MAX_DISPLAY_NAME_LENGTH,
  Name,
  finishProfileSchema,
  finishProfilePageMessages as messages
} from '@audius/common'
import { Flex, Paper, PlainButton, Text, useTheme } from '@audius/harmony'
import { Formik, Form, useField, useFormikContext } from 'formik'
import { useDispatch, useSelector } from 'react-redux'
import { useHistory } from 'react-router-dom'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import { make } from 'common/store/analytics/actions'
import {
  setField,
  setValueField,
  setFinishedPhase1,
  signUp
} from 'common/store/pages/signon/actions'
import {
  getCoverPhotoField,
  getEmailField,
  getHandleField,
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
  profileImage?: ImageFieldValue
  coverPhoto?: ImageFieldValue
  displayName: string
}

const formSchema = toFormikValidationSchema(finishProfileSchema)

const ImageUploadErrorText = () => {
  const { errors } = useFormikContext<FinishProfileValues>()
  let errorText
  if (errors.coverPhoto === messages.coverPhotoUploadError) {
    errorText = errors.coverPhoto
  }
  // Profile image error takes priority
  if (errors.profileImage === messages.profileImageUploadError) {
    // If both images have errors, we show a combined error message
    if (errorText !== undefined) {
      errorText = messages.bothImageUploadError
    } else {
      errorText = errors.profileImage
    }
  }

  return (
    <Flex ph='l' pt='2xl'>
      {errorText ? (
        <Text variant='body' size='m' strength='default' color='danger'>
          {errorText}
        </Text>
      ) : null}
    </Flex>
  )
}

export const FinishProfilePage = () => {
  const { isMobile } = useMedia()
  const history = useHistory()
  const dispatch = useDispatch()
  const navigate = useNavigateToPage()
  const displayNameInputRef = useRef<HTMLInputElement>(null)

  const { value: savedDisplayName } = useSelector(getNameField)
  const handle = useSelector(getHandleField)
  const email = useSelector(getEmailField)
  const isSocialConnected = useSelector(getIsSocialConnected)
  const linkedSocialOnFirstPage = useSelector(getLinkedSocialOnFirstPage)
  const savedCoverPhoto = useSelector(getCoverPhotoField)
  const savedProfileImage = useSelector(getProfileImageField)

  // If the user comes back from a later page we start with whats in the store
  const initialValues = {
    profileImage: savedProfileImage || undefined,
    coverPhoto: savedCoverPhoto || undefined,
    displayName: savedDisplayName || ''
  }

  const setCoverPhoto = useCallback(
    (value: ImageFieldValue) => {
      dispatch(setField('coverPhoto', value))
      dispatch(make(Name.CREATE_ACCOUNT_UPLOAD_COVER_PHOTO, { handle, email }))
    },
    [dispatch, email, handle]
  )

  const setProfileImage = useCallback(
    (value: ImageFieldValue) => {
      dispatch(setField('profileImage', value))
      dispatch(
        make(Name.CREATE_ACCOUNT_UPLOAD_PROFILE_PHOTO, { handle, email })
      )
    },
    [dispatch, email, handle]
  )

  const setDisplayName = useCallback(
    (value: string) => {
      dispatch(setValueField('name', value))
    },
    [dispatch]
  )

  const handleSubmit = useCallback(
    ({ coverPhoto, profileImage, displayName }: FinishProfileValues) => {
      dispatch(setValueField('name', displayName))
      dispatch(setField('profileImage', profileImage))
      if (coverPhoto) {
        dispatch(setField('coverPhoto', coverPhoto))
      }
      dispatch(setFinishedPhase1(true))
      navigate(SIGN_UP_GENRES_PAGE)
      dispatch(signUp())
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
          autoFocusInputRef={displayNameInputRef}
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
          <Paper direction='column' style={{ flexShrink: 0 }}>
            <AccountHeader
              mode='editing'
              formDisplayName={values.displayName}
              formProfileImage={values.profileImage}
              onProfileImageChange={setProfileImage}
              onCoverPhotoChange={setCoverPhoto}
            />
            <ImageUploadErrorText />
            <HarmonyTextField
              ref={displayNameInputRef}
              name='displayName'
              label={messages.displayName}
              placeholder={messages.inputPlaceholder}
              maxLength={MAX_DISPLAY_NAME_LENGTH}
              onChange={(e) => setDisplayName(e.currentTarget.value)}
              css={(theme) => ({
                padding: theme.spacing.l
              })}
            />
          </Paper>
          {isMobile ? null : <UploadProfilePhotoHelperText />}
          <PageFooter
            centered
            sticky
            buttonProps={{ disabled: !isValid }}
            prefix={isMobile ? <UploadProfilePhotoHelperText /> : null}
            postfix={
              isMobile || isSocialConnected ? null : (
                <PlainButton variant='subdued' onClick={history.goBack}>
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
