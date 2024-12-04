import { memo } from 'react'

import type { BottomTabBarButtonProps } from './BottomTabBarButton'
import { BottomTabBarButton } from './BottomTabBarButton'
import iconTrending from './animations/iconTrending.lottie'

const colorKeypaths = [
  'Arrow Head.Group 1.Fill 1',
  'Arrow Stem Part 3.Group 3.Fill 1',
  'Shape Layer 2.Group 2.Fill 1',
  'Arrow Stem Part 1.Group 4.Fill 1'
]

type TrendingButtonProps = BottomTabBarButtonProps

export const TrendingButton = memo((props: TrendingButtonProps) => {
  return (
    <BottomTabBarButton
      name='trending'
      source={iconTrending}
      colorKeypaths={colorKeypaths}
      {...props}
    />
  )
})
