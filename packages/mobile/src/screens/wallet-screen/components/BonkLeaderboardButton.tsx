import React, { useCallback } from 'react'

import { Button, IconTrophy } from '@audius/harmony-native'
import { useNavigation } from 'app/hooks/useNavigation'

const messages = {
  viewLeaderboard: 'View BONK Leaderboard'
}

// Hardcoded example for now. When we add mobile token pages, this should slot into there
export const BonkLeaderboardButton = () => {
  const navigation = useNavigation()

  const handlePress = useCallback(() => {
    // Navigate to the BONK leaderboard with the BONK mint address
    navigation.navigate('CoinLeaderboard', {
      mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263'
    })
  }, [navigation])

  return (
    <Button
      variant='secondary'
      onPress={handlePress}
      fullWidth
      iconLeft={IconTrophy}
    >
      {messages.viewLeaderboard}
    </Button>
  )
} 