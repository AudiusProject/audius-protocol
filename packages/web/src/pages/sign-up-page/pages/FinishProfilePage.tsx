import { useCallback } from 'react'

import { Nullable } from '@audius/common'
import { Button, Flex, Paper, Text, useTheme } from '@audius/harmony'
import { Formik, Form } from 'formik'
import { useDispatch, useSelector } from 'react-redux'
import { z } from 'zod'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import { setValueField } from 'common/store/pages/signon/actions'
import {
  getCoverPhotoField,
  getNameField,
  getProfileImageField
} from 'common/store/pages/signon/selectors'
import { TextField } from 'components/form-fields'
import { useMedia } from 'hooks/useMedia'
import { useNavigateToPage } from 'hooks/useNavigateToPage'
import { SIGN_UP_GENRES_PAGE } from 'utils/route'

import { AccountHeader } from '../components/AccountHeader'

const messages = {
  header: 'Finish Your Profile',
  description:
    'Your photos & display name is how others see you. Customize with special character, spaces, emojis, whatever!',
  displayName: 'Display Name',
  continue: 'Continue',
  inputPlaceholder: 'express yourself 💫'
}

type FinishProfileValues = {
  profile_image: Nullable<{ file?: File; url: string }>
  cover_photo: Nullable<{ file?: File; url: string }>
  displayName: string
}

// Schema requiring displayName
const formSchema = toFormikValidationSchema(
  z
    .object({
      displayName: z.string()
    })
    .required()
)

export const FinishProfilePage = () => {
  const { isMobile } = useMedia()
  const dispatch = useDispatch()
  const navigate = useNavigateToPage()
  const { value: savedDisplayName } = useSelector(getNameField)
  const savedPoverPhoto = useSelector(getCoverPhotoField)
  const savedProfileImage = useSelector(getProfileImageField)

  const initialValues = {
    profile_image: { url: savedProfileImage },
    cover_photo: { url: savedPoverPhoto },
    displayName: savedDisplayName || ''
  }

  const handleSubmit = useCallback(
    ({ cover_photo, profile_image }: FinishProfileValues) => {
      if (cover_photo) {
        // Only saving the url as there's no need to store the blob in the store
        dispatch(setValueField('coverPhoto', cover_photo.url))
      }
      if (profile_image) {
        // Only saving the url as there's no need to store the blob in the store
        dispatch(setValueField('profileImage', profile_image.url))
      }
      navigate(SIGN_UP_GENRES_PAGE)
    },
    [navigate, dispatch]
  )

  const { color } = useTheme()

  return (
    <Flex
      direction='column'
      h='100%'
      alignItems='center'
      w='100%'
      pt={isMobile ? 'xl' : '3xl'}
      css={{ background: color.background.white }}
    >
      <Flex
        direction='column'
        gap={isMobile ? 'xl' : '2xl'}
        // TODO: what is this 608px number 🤔
        css={{ maxWidth: isMobile ? undefined : '608px' }}
      >
        <Flex direction='column' gap={isMobile ? 's' : 'l'} ph='l'>
          <Text
            variant='heading'
            size={isMobile ? 'm' : 'l'}
            color='heading'
            css={{ textAlign: isMobile ? 'left' : 'center' }}
            id='genre-header'
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
          <Formik
            initialValues={initialValues}
            onSubmit={handleSubmit}
            validationSchema={formSchema}
          >
            {({ handleChange }) => (
              <Flex
                as={Form}
                alignItems={isMobile ? 'flex-start' : 'center'}
                direction='column'
                flex={1}
                justifyContent='space-between'
              >
                <Paper
                  role='group'
                  aria-labelledby='genre-header'
                  css={{ maxWidth: 608 }}
                  justifyContent={isMobile ? 'flex-start' : 'center'}
                  alignItems='flex-start'
                  gap='s'
                  wrap='wrap'
                  w='100%'
                >
                  <AccountHeader mode='editing' />
                  {/* <CoverPhotoFiePld /> */}
                  {/* <ProfilePictureField /> */}
                  <Flex p='m' w='100%'>
                    <TextField
                      name='displayName'
                      label={messages.displayName}
                      placeholder={messages.inputPlaceholder}
                      required
                      onChange={(e) => {
                        // Update this so that the user can see it update live
                        dispatch(setValueField('name', e.target.value))
                        handleChange(e)
                      }}
                    />
                  </Flex>
                </Paper>
                <Button type='submit'> {messages.continue} </Button>
              </Flex>
            )}
          </Formik>
        </Flex>
      </Flex>
    </Flex>
  )
}
