import { cloneElement, ReactElement } from 'react'

import { ID, BadgeTier, Nullable, useSelectTierInfo } from '@audius/common'
import {
  IconTokenBronze as IconBronzeBadgeSVG,
  IconTokenGold as IconGoldBadgeSVG,
  IconTokenPlatinum as IconPlatinumBadgeSVG,
  IconTokenSilver as IconSilverBadgeSVG,
  IconVerified
} from '@audius/harmony'
import cn from 'classnames'

import IconBronzeBadge from 'assets/img/tokenBadgeBronze40@2x.png'
import IconGoldBadge from 'assets/img/tokenBadgeGold40@2x.png'
import IconPlatinumBadge from 'assets/img/tokenBadgePlatinum40@2x.png'
import IconSilverBadge from 'assets/img/tokenBadgeSilver40@2x.png'

import styles from './UserBadges.module.css'

const audioTierMapSVG: { [tier in BadgeTier]: Nullable<ReactElement> } = {
  none: null,
  bronze: <IconBronzeBadgeSVG />,
  silver: <IconSilverBadgeSVG />,
  gold: <IconGoldBadgeSVG />,
  platinum: <IconPlatinumBadgeSVG />
}

export const audioTierMapPng: {
  [tier in BadgeTier]: Nullable<ReactElement>
} = {
  none: null,
  bronze: <img draggable={false} alt='' src={IconBronzeBadge as string} />,
  silver: <img draggable={false} alt='' src={IconSilverBadge as string} />,
  gold: <img draggable={false} alt='' src={IconGoldBadge as string} />,
  platinum: <img draggable={false} alt='' src={IconPlatinumBadge as string} />
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
  useSVGTiers = false,
  inline = false,
  isVerifiedOverride,
  overrideTier
}: UserBadgesProps) => {
  const { tier: currentTier, isVerified } = useSelectTierInfo(userId)
  const tier = overrideTier || currentTier
  const tierMap = useSVGTiers ? audioTierMapSVG : audioTierMapPng
  const audioBadge = tierMap[tier as BadgeTier]
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
    <div
      className={cn(styles.container, className, {
        [noContentClassName]: !hasContent
      })}
    >
      {(isVerifiedOverride ?? isVerified) && (
        <IconVerified height={badgeSize} width={badgeSize} />
      )}
      {audioBadge &&
        cloneElement(audioBadge, { height: badgeSize, width: badgeSize })}
    </div>
  )
}

export default UserBadges
