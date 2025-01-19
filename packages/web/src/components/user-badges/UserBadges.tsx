import { cloneElement, ReactElement } from 'react'

import { useSelectTierInfo } from '@audius/common/hooks'
import { BadgeTier, ID } from '@audius/common/models'
import { Nullable } from '@audius/common/utils'
import {
  IconSize,
  iconSizes,
  IconTokenBronze,
  IconTokenGold,
  IconTokenPlatinum,
  IconTokenSilver,
  IconVerified
} from '@audius/harmony'
import cn from 'classnames'

import styles from './UserBadges.module.css'

export const audioTierMap: {
  [tier in BadgeTier]: Nullable<ReactElement>
} = {
  none: null,
  bronze: <IconTokenBronze />,
  silver: <IconTokenSilver />,
  gold: <IconTokenGold />,
  platinum: <IconTokenPlatinum />
}

type UserBadgesProps = {
  userId: ID
  size?: IconSize
  className?: string
  inline?: boolean

  // Normally, user badges is not a controlled component and selects
  // badges off of the store. The override allows for it to be used
  // in a controlled context where the desired store state is not available.
  isVerifiedOverride?: boolean
  overrideTier?: BadgeTier
}

const UserBadges = ({
  userId,
  size = 'xs',
  className,
  inline = false,
  isVerifiedOverride,
  overrideTier
}: UserBadgesProps) => {
  const { tier: currentTier, isVerified } = useSelectTierInfo(userId)
  const tier = overrideTier || currentTier
  const tierMap = audioTierMap
  const audioBadge = tierMap[tier as BadgeTier]
  const hasContent = (isVerifiedOverride ?? isVerified) || audioBadge

  if (!hasContent) return null

  return (
    <span
      className={cn(
        {
          [styles.inlineContainer]: inline,
          [styles.container]: !inline
        },
        className
      )}
    >
      {(isVerifiedOverride ?? isVerified) && (
        <IconVerified height={iconSizes[size]} width={iconSizes[size]} />
      )}
      {audioBadge && cloneElement(audioBadge, { size })}
    </span>
  )
}

export default UserBadges
