import { useCallback } from 'react'

import IconGoldBadge from 'app/assets/images/IconGoldBadge.svg'
import { Button } from 'app/components/core'
import { useNavigation } from 'app/hooks/useNavigation'

const messages = {
  title: 'Tip $AUDIO',
  label: 'Tip Audio tokens'
}

export const TipArtistButton = () => {
  const navigation = useNavigation()

  const handlePress = useCallback(() => {
    navigation.navigate({ native: { screen: 'TipArtist' } })
  }, [navigation])

  return (
    <Button
      variant='primary'
      accessibilityLabel={messages.label}
      title={messages.title}
      icon={IconGoldBadge}
      iconPosition='left'
      fullWidth
      onPress={handlePress}
    />
  )
}
