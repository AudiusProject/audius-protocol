import { View } from 'react-native'

import IconIndent from 'app/assets/images/iconIndent.svg'

import { FormScreen } from '../components'
import {
  IsrcField,
  LicenseTypeField,
  SubmenuList
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
        {/* <ReleaseDateField /> */}
        <SubmenuList>
          <IsrcField />
          <LicenseTypeField />
        </SubmenuList>
      </View>
    </FormScreen>
  )
}
