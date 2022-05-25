import { useCallback } from 'react'

import { useNavigation } from '@react-navigation/native'

import IconRemove from 'app/assets/images/iconRemove.svg'
import { Screen, Text } from 'app/components/core'

import { TopBarIconButton } from '../app-screen'

const messages = {
  title: 'Tip Sent',
  sent: 'Sent Successfully'
}

export const TipSentScreen = () => {
  const navigation = useNavigation()

  const handleClose = useCallback(() => {
    navigation.getParent()?.goBack()
  }, [navigation])

  return (
    <Screen
      title={messages.title}
      topbarLeft={<TopBarIconButton icon={IconRemove} onPress={handleClose} />}
    >
      <Text>{messages.sent}</Text>
    </Screen>
  )
}
