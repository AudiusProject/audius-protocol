import { useMemo } from 'react'

import IconExploreLight from 'app/assets/animations/iconExploreLight.json'
import { colorize } from 'app/utils/colorizeLottie'
import { useThemeColors } from 'app/utils/theme'

import type { BaseBottomTabBarButtonProps } from './BottomTabBarButton'
import { BottomTabBarButton } from './BottomTabBarButton'

type NotificationsButtonProps = BaseBottomTabBarButtonProps

export const NotificationsButton = (props: NotificationsButtonProps) => {
  const { primary, neutral } = useThemeColors()

  const IconExplore = useMemo(
    () =>
      colorize(IconExploreLight, {
        // icon_Explore Outlines.Group 1.Fill 1
        'layers.0.shapes.0.it.4.c.k.0.s': neutral,
        // icon_Explore Outlines.Group 1.Fill 1
        'layers.0.shapes.0.it.4.c.k.1.s': primary,
        // icon_Explore Outlines.Group 2.Fill 1
        'layers.0.shapes.1.it.0.c.k.0.s': primary,
        // icon_Explore Outlines.Group 2.Fill 1
        'layers.0.shapes.1.it.0.c.k.1.s': neutral
      }),
    [primary, neutral]
  )

  return (
    <BottomTabBarButton
      name='notifications'
      iconJSON={IconExplore}
      {...props}
    />
  )
}
