import type { BottomTabBarButtonProps } from './BottomTabBarButton'
import { BottomTabBarButton } from './BottomTabBarButton'
import iconExplore from './animations/iconExplore.lottie'

const colorKeypaths = [
  'icon_Explore Outlines.Group 1.Fill 1',
  'icon_Explore Outlines.Group 2.Fill 1'
]

type ExploreButtonProps = BottomTabBarButtonProps

export const ExploreButton = (props: ExploreButtonProps) => {
  return (
    <BottomTabBarButton
      {...props}
      name='explore'
      source={iconExplore}
      colorKeypaths={colorKeypaths}
    />
  )
}
