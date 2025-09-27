import { useCallback } from 'react'

import { useArtistOwnedCoin, useProfileUser } from '@audius/common/api'
import { useFeatureFlag } from '@audius/common/hooks'
import { FeatureFlags } from '@audius/common/services'

import { Button, useTheme } from '@audius/harmony-native'
import { useNavigation } from 'app/hooks/useNavigation'

const messages = {
  title: 'Buy Artist Coin'
}

export const BuyArtistCoinButton = () => {
  const { color } = useTheme()
  const navigation = useNavigation()
  const { isEnabled: isArtistCoinsEnabled } = useFeatureFlag(
    FeatureFlags.ARTIST_COINS
  )

  const { user_id } =
    useProfileUser({
      select: (user) => ({
        user_id: user.user_id
      })
    }).user ?? {}

  const { data: artistCoin } = useArtistOwnedCoin(user_id)

  const handlePress = useCallback(() => {
    if (artistCoin?.ticker) {
      navigation.navigate('BuySell', {
        initialTab: 'buy',
        coinTicker: artistCoin.ticker
      })
    }
  }, [navigation, artistCoin?.ticker])

  // Don't render if artist coins feature is disabled or user doesn't own a coin
  if (!isArtistCoinsEnabled || !artistCoin?.mint) {
    return null
  }

  return (
    <Button
      size='small'
      gradient={color.special.coinGradient}
      fullWidth
      onPress={handlePress}
    >
      {messages.title}
    </Button>
  )
}
