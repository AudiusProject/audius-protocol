import { useSelectTierInfo } from '@audius/common/hooks'
import type { ID } from '@audius/common/models'
import { cacheUsersSelectors } from '@audius/common/store'
import { useSelector } from 'react-redux'

import type { IconSize } from '@audius/harmony-native'
import { IconVerified } from '@audius/harmony-native'
import { IconAudioBadge } from 'app/components/audio-rewards'

const { getUser } = cacheUsersSelectors

type UserBadgesProps = {
  userId: ID
  badgeSize?: IconSize
}

export const UserBadgesV2 = (props: UserBadgesProps) => {
  const { userId, badgeSize = 's' } = props

  const isVerified = useSelector(
    (state) => getUser(state, { id: userId })?.is_verified
  )

  const { tier } = useSelectTierInfo(userId)

  return (
    <>
      {isVerified ? <IconVerified size={badgeSize} /> : null}
      <IconAudioBadge tier={tier} size={badgeSize} />
    </>
  )
}
