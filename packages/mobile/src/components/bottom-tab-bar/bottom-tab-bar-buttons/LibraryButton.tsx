import type { BaseBottomTabBarButtonProps } from './BottomTabBarButton'
import { BottomTabBarButton } from './BottomTabBarButton'

type LibraryButtonProps = BaseBottomTabBarButtonProps

export const LibraryButton = (props: LibraryButtonProps) => {
  return <BottomTabBarButton name='library' {...props} />
}
