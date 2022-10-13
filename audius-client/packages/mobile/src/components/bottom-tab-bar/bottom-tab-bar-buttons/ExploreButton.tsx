import { useMemo } from 'react'

import IconExploreLight from 'app/assets/animations/iconExploreLight.json'
import { colorize } from 'app/utils/colorizeLottie'
import { useThemeColors } from 'app/utils/theme'

import type { BaseBottomTabBarButtonProps } from './BottomTabBarButton'
import { BottomTabBarButton } from './BottomTabBarButton'

type ExploreButtonProps = BaseBottomTabBarButtonProps

export const ExploreButton = (props: ExploreButtonProps) => {
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

  return <BottomTabBarButton name='explore' iconJSON={IconExplore} {...props} />
}
