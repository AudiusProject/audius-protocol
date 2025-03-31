import type { BottomTabBarButtonProps } from './BottomTabBarButton'
import { BottomTabBarButton } from './BottomTabBarButton'
import iconFeed from './animations/iconFeed.lottie'

const colorKeypaths = [
  'Shape Layer 1.Group 1.Fill 1',
  'Shape Layer 2.Group 3.Fill 1',
  'Shape Layer 2.Group 5.Fill 1',
  'icon_Feed Outlines.Group 2.Fill 1',
  'icon_Feed Outlines.Group 4.Fill 1'
]

type FeedButtonProps = BottomTabBarButtonProps

export const FeedButton = (props: FeedButtonProps) => {
  return (
    <BottomTabBarButton
      {...props}
      name='feed'
      source={iconFeed}
      colorKeypaths={colorKeypaths}
    />
  )
}
