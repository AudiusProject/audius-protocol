import type { BaseBottomTabBarButtonProps } from './BottomTabBarButton'
import { BottomTabBarButton } from './BottomTabBarButton'

type FeedButtonProps = BaseBottomTabBarButtonProps

export const FeedButton = (props: FeedButtonProps) => {
  return <BottomTabBarButton name='feed' {...props} />
}
