import type { BaseBottomTabBarButtonProps } from './BottomTabBarButton'
import { BottomTabBarButton } from './BottomTabBarButton'

type ExploreButtonProps = BaseBottomTabBarButtonProps

export const ExploreButton = (props: ExploreButtonProps) => {
  return <BottomTabBarButton name='explore' {...props} />
}
