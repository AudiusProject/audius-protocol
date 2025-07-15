import { useTokenBalance, useUser } from '@audius/common/api'
import { useFeatureFlag } from '@audius/common/hooks'
import type { ID } from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import { useTierAndVerifiedForUser } from '@audius/common/store'

import type { IconSize } from '@audius/harmony-native'
import { Flex, IconTokenBonk, IconVerified } from '@audius/harmony-native'
import { IconAudioBadge } from 'app/components/audio-rewards'

type UserBadgesProps = {
  userId: ID
  badgeSize?: IconSize
}

export const UserBadges = (props: UserBadgesProps) => {
  const { userId, badgeSize = 's' } = props
  const { isEnabled: isArtistCoinEnabled } = useFeatureFlag(
    FeatureFlags.ARTIST_COINS
  )

  const { data: isVerified } = useUser(userId, {
    select: (user) => user?.is_verified
  })
  const { tier } = useTierAndVerifiedForUser(userId)

  const { data: coinBalance } = useTokenBalance({
    userId,
    token: 'BONK'
  })

  return (
    <Flex row gap='xs' alignItems='center'>
      {isVerified ? <IconVerified size={badgeSize} /> : null}
      <IconAudioBadge tier={tier} size={badgeSize} />
      {coinBalance && isArtistCoinEnabled ? (
        <IconTokenBonk size={badgeSize} />
      ) : null}
    </Flex>
  )
}
