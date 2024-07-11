import { useField } from 'formik'
import { View } from 'react-native'

import { IconIndent } from '@audius/harmony-native'
import { FormScreen } from 'app/screens/form-screen'

import { IsrcField, LicenseTypeField, SubmenuList } from '../fields'
import { KeyBpmField } from '../fields/KeyBpmField'

const messages = {
  screenTitle: 'Advanced'
}

export const AdvancedOptionsScreen = () => {
  const [{ value: trackId }] = useField('track_id')

  return (
    <FormScreen
      title={messages.screenTitle}
      icon={IconIndent}
      bottomSection={null}
      variant='white'
    >
      <View>
        <SubmenuList>
          <IsrcField />
          <LicenseTypeField />
          {/* Only show key and bpm field if we are in edit flow */}
          {trackId ? <KeyBpmField /> : <></>}
        </SubmenuList>
      </View>
    </FormScreen>
  )
}
