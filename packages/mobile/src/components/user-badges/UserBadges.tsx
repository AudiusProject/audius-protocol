import { useMemo } from 'react'

import {
  useArtistCoin,
  useTokenBalance,
  useUser,
  useUserCoins,
  useUserCreatedCoins
} from '@audius/common/api'
import { useFeatureFlag } from '@audius/common/hooks'
import type { ID } from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import {
  TOKEN_LISTING_MAP,
  useTierAndVerifiedForUser
} from '@audius/common/store'

import { Flex, IconVerified } from '@audius/harmony-native'
import type { IconSize } from '@audius/harmony-native'
import { IconAudioBadge } from 'app/components/audio-rewards'
import { TokenIcon } from 'app/components/core'

type UserBadgesProps = {
  userId: ID
  badgeSize?: IconSize
  mint?: string
}

export const UserBadges = (props: UserBadgesProps) => {
  const { userId, badgeSize = 's', mint } = props
  const { isEnabled: isArtistCoinEnabled } = useFeatureFlag(
    FeatureFlags.ARTIST_COINS
  )

  const { data: isVerified } = useUser(userId, {
    select: (user) => user?.is_verified
  })
  const { tier } = useTierAndVerifiedForUser(userId)

  const { data: userCoins } = useUserCoins(
    { userId },
    {
      enabled: isArtistCoinEnabled
    }
  )
  const { data: userCreatedCoins } = useUserCreatedCoins(
    { userId },
    {
      enabled: isArtistCoinEnabled
    }
  )
  const userCreatedCoin = userCreatedCoins?.[0]

  const displayMint = useMemo(() => {
    if (mint) return mint
    if (userCreatedCoin?.mint) return userCreatedCoin.mint
    if (!userCoins || userCoins.length < 2) return null
    return userCoins[1].mint
  }, [mint, userCreatedCoin, userCoins])

  const { data: coin } = useArtistCoin(
    { mint: displayMint ?? '' },
    {
      enabled: isArtistCoinEnabled
    }
  )
  const { data: tokenBalance } = useTokenBalance({
    mint: displayMint ?? '',
    userId
  })

  const shouldShowArtistCoinBadge =
    isArtistCoinEnabled &&
    !!displayMint &&
    !!coin &&
    !!coin.logoUri &&
    ((!!tokenBalance && tokenBalance.balance.value !== BigInt(0)) ||
      !!userCreatedCoin) &&
    displayMint !== TOKEN_LISTING_MAP.AUDIO.address

  return (
    <Flex row gap='xs' alignItems='center'>
      {isVerified ? <IconVerified size={badgeSize} /> : null}
      <IconAudioBadge tier={tier} size={badgeSize} />
      {tokenBalance && shouldShowArtistCoinBadge ? (
        <TokenIcon logoURI={coin.logoUri} size={badgeSize} />
      ) : null}
    </Flex>
  )
}
