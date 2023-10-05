import { useCallback } from 'react'

import { Formik } from 'formik'
import { View } from 'react-native'

import { Button, Text } from 'app/components/core'
import { TextField } from 'app/components/fields'

import { CoverPhotoField } from '../components/CoverPhotoField'
import { ProfilePictureField } from '../components/ProfilePictureField'

const messages = {
  header: 'Finish Your Profile',
  description:
    'Your photos & display name is how others see you. Customize with special character, spaces, emojis, whatever!',
  displayName: 'Display Name',
  continue: 'Continue'
}

const initialValues = {
  profile_picture: null,
  cover_photo: null,
  displayName: ''
}

type FinishProfileValues = {
  displayName: string
}

export const FinishProfileScreen = () => {
  const handleSubmit = useCallback((values: FinishProfileValues) => {}, [])

  return (
    <View>
      <Text>{messages.header}</Text>
      <Text>{messages.description}</Text>

      <Formik initialValues={initialValues} onSubmit={handleSubmit}>
        {({ handleSubmit }) => (
          <View>
            <CoverPhotoField />
            <ProfilePictureField />
            <TextField name='displayName' label={messages.displayName} />
            <Button title={messages.continue} onPress={() => handleSubmit()} />
          </View>
        )}
      </Formik>
    </View>
  )
}
