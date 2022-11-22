import { View } from 'react-native'

import IconIndent from 'app/assets/images/iconIndent.svg'

import { FormScreen } from '../components'
import {
  IsrcField,
  LicenseTypeField,
  ReleaseDateField,
  SubmenuList,
  TrackVisibilityField
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
        <SubmenuList>
          <TrackVisibilityField />
        </SubmenuList>
        <ReleaseDateField />
        <SubmenuList>
          <IsrcField />
          <LicenseTypeField />
        </SubmenuList>
      </View>
    </FormScreen>
  )
}
