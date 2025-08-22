import { useMemo } from 'react'

import { UserCoinParsed, useCurrentUserId, useUserCoins } from '~/api'
import { getTierForUserNonWei } from '~/store'
import { AUDIUS_DISCORD_OAUTH_LINK } from '~/utils/route'

// TODO: make this structure more legit this if we add more coins with tiered rewards
const COIN_TIER_MAP = {
  AUDIO: getTierForUserNonWei
}

// Returns a json string of the user's coin tiers
// e.g. { AUDIO: 'bronze', BONK: 'holder' }
// The discord bot looks at this to determine what roles to give everyone
const makeDiscordOauthStateString = (
  userCoins: UserCoinParsed[],
  currentCoin: string = '$AUDIO' // uses ticker strings
) => {
  const coinTiers = userCoins.reduce(
    (acc, coin) => {
      const cleanTicker = coin.ticker.replace('$', '')
      if (COIN_TIER_MAP[cleanTicker]) {
        // coin tier map has the methods used to calculate the tier
        const tier = COIN_TIER_MAP[cleanTicker](coin.balance)
        acc[cleanTicker] = tier
      } else {
        // default to just "holder"
        acc[cleanTicker] = 'holder'
      }
      return acc
    },
    {} as Record<string, string>
  )

  // Tells the discord bot which channel to redirect into
  coinTiers.currentCoin = currentCoin.replace('$', '')

  return JSON.stringify(coinTiers)
}

export const useDiscordOAuthLink = (currentCoin?: string) => {
  const { data: currentUserId } = useCurrentUserId()
  const { data: userCoins } = useUserCoins({ userId: currentUserId })

  return useMemo(() => {
    const tierStateString = makeDiscordOauthStateString(
      userCoins ?? [],
      currentCoin
    )
    return `${AUDIUS_DISCORD_OAUTH_LINK}&state=${tierStateString}`
  }, [userCoins, currentCoin])
}
