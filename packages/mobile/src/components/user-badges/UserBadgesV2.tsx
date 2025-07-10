import { useUser, useUserCoinBalance } from '@audius/common/api'
import type { ID } from '@audius/common/models'
import { getTokenBySymbol } from '@audius/common/services'
import { useTierAndVerifiedForUser } from '@audius/common/store'

import type { IconSize } from '@audius/harmony-native'
import { IconTokenBonk, IconVerified } from '@audius/harmony-native'
import { IconAudioBadge } from 'app/components/audio-rewards'
import { env } from 'app/services/env'

type UserBadgesProps = {
  userId: ID
  badgeSize?: IconSize
}

export const UserBadgesV2 = (props: UserBadgesProps) => {
  const { userId, badgeSize = 's' } = props

  const { data: isVerified } = useUser(userId, {
    select: (user) => user?.is_verified
  })

  const { tier } = useTierAndVerifiedForUser(userId)

  const bonkToken = getTokenBySymbol(env, 'BONK')
  const bonkMint = bonkToken?.address
  const { data: coinBalance } = useUserCoinBalance(
    {
      userId,
      mint: bonkMint ?? ''
    },
    {
      enabled: !!bonkMint
    }
  )

  return (
    <>
      {isVerified ? <IconVerified size={badgeSize} /> : null}
      <IconAudioBadge tier={tier} size={badgeSize} />
      {coinBalance ? <IconTokenBonk size={badgeSize} /> : null}
    </>
  )
}
