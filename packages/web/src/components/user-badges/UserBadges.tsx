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

import IconBronzeBadge from 'assets/img/tokenBadgeBronze48@2x.webp'
import IconGoldBadge from 'assets/img/tokenBadgeGold48@2x.webp'
import IconPlatinumBadge from 'assets/img/tokenBadgePlatinum48@2x.webp'
import IconSilverBadge from 'assets/img/tokenBadgeSilver48@2x.webp'

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
  bronze: (
    <img
      draggable={false}
      alt=''
      src={IconBronzeBadge as string}
      width='40'
      height='40'
    />
  ),
  silver: (
    <img
      draggable={false}
      width='40'
      height='40'
      alt=''
      src={IconSilverBadge as string}
    />
  ),
  gold: (
    <img
      draggable={false}
      width='40'
      height='40'
      alt=''
      src={IconGoldBadge as string}
    />
  ),
  platinum: (
    <img
      draggable={false}
      width='40'
      height='40'
      alt=''
      src={IconPlatinumBadge as string}
    />
  )
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
  overrideTier?: BadgeTier
}

const UserBadges = ({
  userId,
  badgeSize,
  className,
  useSVGTiers = false,
  inline = false,
  isVerifiedOverride,
  overrideTier
}: UserBadgesProps) => {
  const { tier: currentTier, isVerified } = useSelectTierInfo(userId)
  const tier = overrideTier || currentTier
  const tierMap = useSVGTiers ? audioTierMapSVG : audioTierMapPng
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
        <IconVerified height={badgeSize} width={badgeSize} />
      )}
      {audioBadge &&
        cloneElement(audioBadge, { height: badgeSize, width: badgeSize })}
    </span>
  )
}

export default UserBadges
