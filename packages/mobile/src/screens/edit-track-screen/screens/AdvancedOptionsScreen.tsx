import { View } from 'react-native'

import { IconIndent } from '@audius/harmony-native'
import { FormScreen } from 'app/screens/form-screen'

import {
  IsrcField,
  LicenseTypeField,
  SubmenuList,
  ReleaseDateFieldLegacy
} from '../fields'

const messages = {
  screenTitle: 'Advanced'
}

export const AdvancedOptionsScreen = () => {
  return (
    <FormScreen
      title={messages.screenTitle}
      icon={IconIndent}
      bottomSection={null}
      variant='white'
    >
      <View>
        <ReleaseDateFieldLegacy />
        <SubmenuList>
          <IsrcField />
          <LicenseTypeField />
        </SubmenuList>
      </View>
    </FormScreen>
  )
}
