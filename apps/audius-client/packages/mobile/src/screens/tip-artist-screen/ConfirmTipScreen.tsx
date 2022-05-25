import { useCallback } from 'react'

import { Button, Screen } from 'app/components/core'
import { useNavigation } from 'app/hooks/useNavigation'

import { TipArtistNavigationParamList } from './navigation'

const messages = {
  title: 'Confirm Tip',
  confirm: 'Confirm Tip'
}

export const ConfirmTipScreen = () => {
  const navigation = useNavigation<TipArtistNavigationParamList>()

  const handleConfirm = useCallback(() => {
    navigation.navigate({ native: { screen: 'TipSent' } })
  }, [navigation])

  return (
    <Screen title={messages.title}>
      <Button
        variant='primary'
        size='large'
        title={messages.confirm}
        onPress={handleConfirm}
      />
    </Screen>
  )
}
