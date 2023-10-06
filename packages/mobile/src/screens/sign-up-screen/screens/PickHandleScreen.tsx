import { useCallback } from 'react'

import { setValueField } from 'common/store/pages/signon/actions'
import { Formik } from 'formik'
import { View } from 'react-native'
import { useDispatch } from 'react-redux'

import { Button, Text } from 'app/components/core'
import { TextField } from 'app/components/fields'
import { useNavigation } from 'app/hooks/useNavigation'

import type { SignUpScreenParamList } from '../types'

const messages = {
  header: 'Pick Your Handle',
  description:
    'This is how others find and tag you. It is totally unique to you & cannot be changed later.',
  handle: 'Handle',
  continue: 'Continue'
}

const initialValues = {
  handle: ''
}

type PickHandleValues = {
  handle: string
}

export const PickHandleScreen = () => {
  const navigation = useNavigation<SignUpScreenParamList>()
  const dispatch = useDispatch()

  const handleSubmit = useCallback(
    (values: PickHandleValues) => {
      const { handle } = values
      dispatch(setValueField('handle', handle))
      navigation.navigate('FinishProfile')
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
            <TextField name='handle' label={messages.handle} />
            <Button title={messages.continue} onPress={() => handleSubmit()} />
          </View>
        )}
      </Formik>
    </View>
  )
}
