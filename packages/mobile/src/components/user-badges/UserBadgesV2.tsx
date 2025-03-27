import React from 'react'

import { useUser } from '@audius/common/api'
import { useSelectTierInfo } from '@audius/common/hooks'
import type { ID } from '@audius/common/models'

import type { IconSize } from '@audius/harmony-native'
import { IconVerified } from '@audius/harmony-native'
import { IconAudioBadge } from 'app/components/audio-rewards'

type UserBadgesProps = {
  userId: ID
  badgeSize?: IconSize
}

export const UserBadgesV2 = (props: UserBadgesProps) => {
  const { userId, badgeSize = 's' } = props

  const { data: isVerified } = useUser(userId, {
    select: (user) => user?.is_verified
  })

  const { tier } = useSelectTierInfo(userId)

  return (
    <>
      {isVerified ? <IconVerified size={badgeSize} /> : null}
      <IconAudioBadge tier={tier} size={badgeSize} />
    </>
  )
}
