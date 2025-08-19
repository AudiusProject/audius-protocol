import { useMemo } from 'react'

import { UserCoin, useCurrentUserId, useUserCoins } from '~/api'
import { getTierForUserNonWei } from '~/store'
import { AUDIUS_DISCORD_OAUTH_LINK } from '~/utils/route'

// TODO: make this structure more legit this if we add more coins with tiered rewards
const COIN_TIER_MAP = {
  $AUDIO: getTierForUserNonWei
}

// Returns a json string of the user's coin tiers
// e.g. { AUDIO: 'bronze', BONK: 'holder' }
// The discord bot looks at this to determine what roles to give everyone
const makeDiscordOauthStateString = (userCoins: UserCoin[]) => {
  const coinTiers = userCoins.reduce(
    (acc, coin) => {
      const cleanTicker = coin.ticker.replace('$', '')
      if (COIN_TIER_MAP[coin.ticker]) {
        const tier = COIN_TIER_MAP[coin.ticker](coin.balance)
        acc[cleanTicker] = tier
      } else {
        acc[cleanTicker] = 'holder'
      }
      return acc
    },
    {} as Record<string, string>
  )

  return JSON.stringify(coinTiers)
}

export const useDiscordOAuthLink = () => {
  const { data: currentUserId } = useCurrentUserId()
  const { data: userCoins } = useUserCoins({ userId: currentUserId })

  return useMemo(() => {
    const tierStateString = makeDiscordOauthStateString(userCoins ?? [])
    return `${AUDIUS_DISCORD_OAUTH_LINK}&state=${tierStateString}`
  }, [userCoins])
}
