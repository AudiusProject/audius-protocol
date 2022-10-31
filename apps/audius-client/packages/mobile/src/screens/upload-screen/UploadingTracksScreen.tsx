import { Screen, Text } from 'app/components/core'
import { spacing } from 'app/styles/spacing'

const messages = {
  uploading: 'Uploading...'
}

export const UploadingTracksScreen = () => (
  <Screen>
    <Text style={{ alignSelf: 'center', marginTop: spacing(4) }}>
      {messages.uploading}
    </Text>
  </Screen>
)
