import type { BaseBottomTabBarButtonProps } from './BottomTabBarButton'
import { BottomTabBarButton } from './BottomTabBarButton'

type FavoritesButtonProps = BaseBottomTabBarButtonProps

export const FavoritesButton = (props: FavoritesButtonProps) => {
  return <BottomTabBarButton name='favorites' {...props} />
}
