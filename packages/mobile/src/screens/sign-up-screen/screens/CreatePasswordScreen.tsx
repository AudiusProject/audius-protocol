import { View } from 'react-native'

import { Text } from 'app/components/core'

const messages = {
  header: 'Create Your Password'
}

export const CreatePasswordScreen = () => {
  return (
    <View>
      <Text>{messages.header}</Text>
    </View>
  )
}
