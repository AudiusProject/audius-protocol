import { View } from 'react-native'

import { Text } from 'app/components/core'

const messages = {
  header: 'Pick Your Handle'
}
export const PickHandleScreen = () => {
  return (
    <View>
      <Text>{messages.header}</Text>
    </View>
  )
}
