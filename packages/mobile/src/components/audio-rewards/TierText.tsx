import type { BadgeTier } from '@audius/common/models'

import type { GradientTextProps } from 'app/components/core'
import { GradientText } from 'app/components/core'

const tierGradientMap = {
  none: {
    colors: undefined
  },
  bronze: {
    colors: ['rgba(141, 48, 8, 0.5)', 'rgba(182, 97, 11, 1)']
  },
  silver: {
    colors: ['rgba(179, 182, 185, 0.5)', 'rgba(189, 189, 189, 1)']
  },
  gold: {
    colors: ['rgba(231, 154, 7, 0.5)', 'rgba(236, 173, 11, 1)']
  },
  platinum: {
    colors: ['#B3ECF9', '#57C2D7']
  }
}

type TierTextProps = GradientTextProps & {
  tier: BadgeTier
}

export const TierText = (props: TierTextProps) => {
  const { tier, ...other } = props
  return <GradientText {...other} colors={tierGradientMap[tier].colors} />
}
