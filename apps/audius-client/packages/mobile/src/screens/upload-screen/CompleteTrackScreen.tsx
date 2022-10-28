import { View } from 'react-native'

import IconUpload from 'app/assets/images/iconUpload.svg'
import { Screen } from 'app/components/core'

const messages = {
  screenTitle: 'Complete Track'
}

export const CompleteTrackScreen = () => {
  return (
    <Screen title={messages.screenTitle} icon={IconUpload}>
      <View />
    </Screen>
  )
}
