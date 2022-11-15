import { View } from 'react-native'

import IconIndent from 'app/assets/images/iconIndent.svg'

import { UploadStackScreen } from '../UploadStackScreen'
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
    <UploadStackScreen
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
    </UploadStackScreen>
  )
}
