import { cloneElement, ReactElement } from 'react'

import { useSelectTierInfo } from '@audius/common/hooks'
import { BadgeTier, ID } from '@audius/common/models'
import { Nullable } from '@audius/common/utils'
import {
  IconTokenBronze as IconBronzeBadgeSVG,
  IconTokenGold as IconGoldBadgeSVG,
  IconTokenPlatinum as IconPlatinumBadgeSVG,
  IconTokenSilver as IconSilverBadgeSVG,
  IconVerified
} from '@audius/harmony'
import cn from 'classnames'

import styles from './UserBadges.module.css'

export const audioTierMapSVG: { [tier in BadgeTier]: Nullable<ReactElement> } =
  {
    none: null,
    bronze: <IconBronzeBadgeSVG />,
    silver: <IconSilverBadgeSVG />,
    gold: <IconGoldBadgeSVG />,
    platinum: <IconPlatinumBadgeSVG />
  }

type UserBadgesProps = {
  userId: ID
  badgeSize: number
  className?: string
  useSVGTiers?: boolean
  inline?: boolean

  // Normally, user badges is not a controlled component and selects
  // badges off of the store. The override allows for it to be used
  // in a controlled context where the desired store state is not available.
  isVerifiedOverride?: boolean
  /**
   * When `true` provide styles for container when it has no content.
   * Useful for cases where margins are inconsistent.
   */
  noContentClassName?: string
  overrideTier?: BadgeTier
}

const UserBadges = ({
  userId,
  badgeSize,
  className,
  noContentClassName = '',
  inline = false,
  isVerifiedOverride,
  overrideTier
}: UserBadgesProps) => {
  const { tier: currentTier, isVerified } = useSelectTierInfo(userId)
  const tier = overrideTier || currentTier
  const audioBadge = audioTierMapSVG[tier as BadgeTier]
  const hasContent = isVerifiedOverride ?? (isVerified || audioBadge)

  if (inline) {
    return (
      <span
        className={cn(styles.inlineContainer, className, {
          [noContentClassName]: !hasContent
        })}
      >
        {(isVerifiedOverride ?? isVerified) && (
          <IconVerified height={badgeSize} width={badgeSize} />
        )}
        {audioBadge &&
          cloneElement(audioBadge, { height: badgeSize, width: badgeSize })}
      </span>
    )
  }
  return (
    <span
      className={cn(styles.container, className, {
        [noContentClassName]: !hasContent
      })}
    >
      {(isVerifiedOverride ?? isVerified) && (
        <IconVerified height={badgeSize} width={badgeSize} />
      )}
      {audioBadge &&
        cloneElement(audioBadge, { height: badgeSize, width: badgeSize })}
    </span>
  )
}

export default UserBadges
