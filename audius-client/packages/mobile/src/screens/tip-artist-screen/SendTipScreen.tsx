import { useCallback } from 'react'

import IconRemove from 'app/assets/images/iconRemove.svg'
import { Button, Screen } from 'app/components/core'
import { useNavigation } from 'app/hooks/useNavigation'

import { TopBarIconButton } from '../app-screen'

import { TipArtistNavigationParamList } from './navigation'

const messages = {
  sendTip: 'Send Tip'
}

export const SendTipScreen = () => {
  const navigation = useNavigation<TipArtistNavigationParamList>()

  const handleBack = useCallback(() => {
    navigation.goBack()
  }, [navigation])

  const handleSendTip = useCallback(() => {
    navigation.navigate({ native: { screen: 'ConfirmTip' } })
  }, [navigation])

  return (
    <Screen
      title='Send Tip'
      topbarLeft={<TopBarIconButton icon={IconRemove} onPress={handleBack} />}
    >
      <Button
        variant='primary'
        size='large'
        title={messages.sendTip}
        onPress={handleSendTip}
      />
    </Screen>
  )
}
