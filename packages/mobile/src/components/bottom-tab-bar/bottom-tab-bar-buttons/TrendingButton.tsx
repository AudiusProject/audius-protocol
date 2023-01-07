import { memo } from 'react'

import type { BaseBottomTabBarButtonProps } from './BottomTabBarButton'
import { BottomTabBarButton } from './BottomTabBarButton'

type TrendingButtonProps = BaseBottomTabBarButtonProps

export const TrendingButton = memo((props: TrendingButtonProps) => {
  return <BottomTabBarButton name='trending' {...props} />
})
