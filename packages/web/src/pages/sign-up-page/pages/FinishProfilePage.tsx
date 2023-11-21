import { useCallback } from 'react'

import { Button, Flex, Paper, Text, useTheme } from '@audius/harmony'
import { Formik, Form } from 'formik'
import { useDispatch, useSelector } from 'react-redux'
import { z } from 'zod'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import { setField, setValueField } from 'common/store/pages/signon/actions'
import {
  getCoverPhotoField,
  getNameField,
  getProfileImageField
} from 'common/store/pages/signon/selectors'
import { HarmonyTextField } from 'components/form-fields/HarmonyTextField'
import { useMedia } from 'hooks/useMedia'
import { useNavigateToPage } from 'hooks/useNavigateToPage'
import { SIGN_UP_GENRES_PAGE } from 'utils/route'

import { AccountHeader } from '../components/AccountHeader'
import { ContinueFooter } from '../components/ContinueFooter'
import { ImageFieldValue } from '../components/ImageField'

const messages = {
  header: 'Finish Your Profile',
  description:
    'Your photos & display name is how others see you. Customize with special character, spaces, emojis, whatever!',
  displayName: 'Display Name',
  continue: 'Continue',
  inputPlaceholder: 'express yourself 💫'
}

export type FinishProfileValues = {
  profileImage: ImageFieldValue
  coverPhoto?: ImageFieldValue
  displayName: string
}

const formSchema = toFormikValidationSchema(
  z.object({
    displayName: z.string(),
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
  const { color } = useTheme()
  const { isMobile } = useMedia()
  const dispatch = useDispatch()
  const navigate = useNavigateToPage()
  const { value: savedDisplayName } = useSelector(getNameField)
  const { value: savedCoverPhoto } = { ...useSelector(getCoverPhotoField) }
  const { value: savedProfileImage } = { ...useSelector(getProfileImageField) }

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
        <Flex
          as={Form}
          direction='column'
          h='100%'
          alignItems='center'
          justifyContent='space-between'
          w='100%'
          pt={isMobile ? 'xl' : '3xl'}
          css={{ background: color.background.white }}
        >
          <Flex
            direction='column'
            gap={isMobile ? 'xl' : '2xl'}
            css={{ maxWidth: isMobile ? undefined : '608px' }}
          >
            <Flex direction='column' gap={isMobile ? 's' : 'l'} ph='l'>
              <Text
                variant='heading'
                size={isMobile ? 'm' : 'l'}
                color='heading'
                css={{ textAlign: isMobile ? 'left' : 'center' }}
                id='profile-header'
              >
                {messages.header}
              </Text>
              <Text
                variant='body'
                size={isMobile ? 'm' : 'l'}
                css={{ textAlign: isMobile ? 'left' : 'center' }}
              >
                {messages.description}
              </Text>

              <Flex justifyContent='space-between' direction='column' h='100%'>
                <Flex
                  alignItems={isMobile ? 'flex-start' : 'center'}
                  direction='column'
                  flex={1}
                >
                  <Paper
                    role='group'
                    aria-labelledby='profile-header'
                    css={{ maxWidth: 608 }}
                    justifyContent={isMobile ? 'flex-start' : 'center'}
                    alignItems='flex-start'
                    gap='s'
                    wrap='wrap'
                    w='100%'
                  >
                    <AccountHeader
                      mode='editing'
                      formDisplayName={values.displayName}
                      formProfileImage={values.profileImage}
                    />
                    <Flex
                      p='m'
                      pt='2xl'
                      w='100%'
                      css={{ textAlign: 'left' }}
                      direction='column'
                    >
                      <HarmonyTextField
                        name='displayName'
                        label={messages.displayName}
                        placeholder={messages.inputPlaceholder}
                        required
                        maxLength={32}
                      />
                    </Flex>
                  </Paper>
                </Flex>
              </Flex>
            </Flex>
          </Flex>
          <ContinueFooter>
            <Button type='submit' disabled={!isValid}>
              {messages.continue}
            </Button>
          </ContinueFooter>
        </Flex>
      )}
    </Formik>
  )
}
