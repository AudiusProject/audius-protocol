import { useSelectTierInfo } from '@audius/common/hooks'
import { ID } from '@audius/common/models'
import { walletSelectors } from '@audius/common/store'
import { formatWei } from '@audius/common/utils'
import { IconSize } from '@audius/harmony'
import { Origin } from '@audius/harmony/src/components/popup/types'
import { Interpolation, Theme } from '@emotion/react'

import { AudioHoverCard } from 'components/hover-card/AudioHoverCard'
import { useSelector } from 'utils/reducer'

import UserBadges from './UserBadges'

type TieredUserBadgeProps = {
  userId: ID
  size?: IconSize
  className?: string
  css?: Interpolation<Theme>
  isVerifiedOverride?: boolean
  anchorOrigin?: Origin
  transformOrigin?: Origin
  // Any other props that UserBadges might need
  [key: string]: any
}

/**
 * A component that renders UserBadges with an AudioHoverCard when the user has a tier
 */
export const TieredUserBadge = (props: TieredUserBadgeProps) => {
  const {
    userId,
    size,
    className,
    css,
    isVerifiedOverride,
    anchorOrigin,
    transformOrigin,
    ...otherUserBadgeProps
  } = props

  // Get tier and balance for the hover card
  const { tier } = useSelectTierInfo(userId)
  const totalBalance = useSelector(walletSelectors.getAccountTotalBalance)
  const formattedBalance = totalBalance ? formatWei(totalBalance, true) : '0'

  // Create the UserBadges element with all props
  const badgesElement = (
    <UserBadges
      userId={userId}
      size={size}
      className={className}
      css={css}
      isVerifiedOverride={isVerifiedOverride}
      {...otherUserBadgeProps}
    />
  )

  // Only wrap with AudioHoverCard if user has a tier
  if (tier === 'none') {
    return badgesElement
  }

  return (
    <AudioHoverCard
      tier={tier}
      amount={formattedBalance}
      anchorOrigin={anchorOrigin}
      transformOrigin={transformOrigin}
    >
      {badgesElement}
    </AudioHoverCard>
  )
}
