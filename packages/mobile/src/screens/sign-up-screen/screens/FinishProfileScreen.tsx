import { useCallback } from 'react'

import { setValueField } from 'common/store/pages/signon/actions'
import { Formik } from 'formik'
import { View } from 'react-native'
import { useDispatch } from 'react-redux'

import { Button, Text } from 'app/components/core'
import { TextField } from 'app/components/fields'
import { useNavigation } from 'app/hooks/useNavigation'

import { CoverPhotoField } from '../components/CoverPhotoField'
import { ProfilePictureField } from '../components/ProfilePictureField'
import type { SignUpScreenParamList } from '../types'

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
  const navigation = useNavigation<SignUpScreenParamList>()
  const dispatch = useDispatch()

  const handleSubmit = useCallback(
    (values: FinishProfileValues) => {
      const { displayName } = values
      dispatch(setValueField('name', displayName))
      navigation.navigate('SelectGenre')
    },
    [dispatch, navigation]
  )

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
