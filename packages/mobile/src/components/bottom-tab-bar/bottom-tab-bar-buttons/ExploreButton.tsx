import React from 'react'

import type { BottomTabBarButtonProps } from './BottomTabBarButton'
import { BottomTabBarButton } from './BottomTabBarButton'
import iconSearchExplore from './animations/iconSearchExplore.lottie'

const searchExploreColorKeypaths = ['Magnifying Glass.Group 1.Fill 1']

type ExploreButtonProps = BottomTabBarButtonProps

export const ExploreButton = (props: ExploreButtonProps) => {
  return (
    <BottomTabBarButton
      {...props}
      name='explore'
      source={iconSearchExplore}
      colorKeypaths={searchExploreColorKeypaths}
    />
  )
}
