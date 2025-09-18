import { useMemo } from 'react'

import { useUser } from '@audius/common/api'
import { useFeatureFlag } from '@audius/common/hooks'
import type { ID } from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import { useTierAndVerifiedForUser } from '@audius/common/store'

import type { IconSize } from '@audius/harmony-native'
import { Flex, IconVerified } from '@audius/harmony-native'
import { IconAudioBadge } from 'app/components/audio-rewards'
import { TokenIcon } from 'app/components/core'
import { env } from 'app/services/env'

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

  const { data: userData } = useUser(userId, {
    select: (user) => ({
      isVerified: user?.is_verified,
      artistCoinBadge: user?.artist_coin_badge
    })
  })
  const { isVerified: userIsVerified, artistCoinBadge: userArtistCoinBadge } =
    userData ?? {}
  const { tier } = useTierAndVerifiedForUser(userId)

  const displayMint = useMemo(() => {
    // Priority: explicit mint prop > user's artist_coin_badge > null
    if (mint) return mint
    if (userArtistCoinBadge?.mint) return userArtistCoinBadge.mint
    return null
  }, [mint, userArtistCoinBadge?.mint])

  const shouldShowArtistCoinBadge =
    isArtistCoinEnabled &&
    !!displayMint &&
    displayMint !== env.WAUDIO_MINT_ADDRESS

  return (
    <Flex row gap='xs' alignItems='center'>
      {userIsVerified ? <IconVerified size={badgeSize} /> : null}
      <IconAudioBadge tier={tier} size={badgeSize} />
      {shouldShowArtistCoinBadge ? (
        <TokenIcon logoURI={userArtistCoinBadge?.logo_uri} size={badgeSize} />
      ) : null}
    </Flex>
  )
}
