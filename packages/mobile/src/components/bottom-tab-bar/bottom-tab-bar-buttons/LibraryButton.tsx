import type { BottomTabBarButtonProps } from './BottomTabBarButton'
import { BottomTabBarButton } from './BottomTabBarButton'
import iconLibrary from './animations/iconLibrary.lottie'

const colorKeypaths = [
  'Bar 2.Group 1.Fill 1',
  'Bar 1.Group 2.Fill 1',
  'Dot.Group 3.Fill 1',
  'Album Box.Group 1.Fill 1'
]

type LibraryButtonProps = BottomTabBarButtonProps

export const LibraryButton = (props: LibraryButtonProps) => {
  return (
    <BottomTabBarButton
      name='library'
      colorKeypaths={colorKeypaths}
      source={iconLibrary}
      {...props}
    />
  )
}
