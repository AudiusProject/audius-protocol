import { ID } from 'models/common/Identifiers'
import React, { cloneElement, ReactElement } from 'react'
import { ReactComponent as IconVerified } from 'assets/img/iconVerified.svg'
import IconBronzeBadge from 'assets/img/tokenBadgeBronze40@2x.png'
import IconSilverBadge from 'assets/img/tokenBadgeSilver40@2x.png'
import IconGoldBadge from 'assets/img/tokenBadgeGold40@2x.png'
import IconPlatinumBadge from 'assets/img/tokenBadgePlatinum40@2x.png'
import { ReactComponent as IconBronzeBadgeSVG } from 'assets/img/IconBronzeBadge.svg'
import { ReactComponent as IconSilverBadgeSVG } from 'assets/img/IconSilverBadge.svg'
import { ReactComponent as IconGoldBadgeSVG } from 'assets/img/IconGoldBadge.svg'
import { ReactComponent as IconPlatinumBadgeSVG } from 'assets/img/IconPlatinumBadge.svg'
import styles from './UserBadges.module.css'
import { BadgeTier } from './utils'
import cn from 'classnames'
import { Nullable } from 'utils/typeUtils'
import { useSelectTierInfo } from './hooks'

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
  bronze: <img alt='' src={IconBronzeBadge} />,
  silver: <img alt='' src={IconSilverBadge} />,
  gold: <img alt='' src={IconGoldBadge} />,
  platinum: <img alt='' src={IconPlatinumBadge} />
}

type UserBadgesProps = {
  userId: ID
  badgeSize: number
  className?: string
  useSVGTiers?: boolean
}

const UserBadges: React.FC<UserBadgesProps> = ({
  userId,
  badgeSize,
  className,
  useSVGTiers = false
}) => {
  const { tier, isVerified } = useSelectTierInfo(userId)
  const tierMap = useSVGTiers ? audioTierMapSVG : audioTierMapPng
  const audioBadge = tierMap[tier]

  return (
    <div className={cn(styles.container, className)}>
      {isVerified && <IconVerified height={badgeSize} width={badgeSize} />}
      {audioBadge &&
        cloneElement(audioBadge, { height: badgeSize, width: badgeSize })}
    </div>
  )
}

export default UserBadges
