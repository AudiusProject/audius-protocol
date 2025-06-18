import React from 'react'

import { useUser } from '@audius/common/api'
import type { ID } from '@audius/common/models'
import { useTierAndVerifiedForUser } from '@audius/common/store'

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

  const { tier } = useTierAndVerifiedForUser(userId)

  return (
    <>
      {isVerified ? <IconVerified size={badgeSize} /> : null}
      <IconAudioBadge tier={tier} size={badgeSize} />
    </>
  )
}
