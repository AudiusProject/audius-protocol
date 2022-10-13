import { memo, useMemo } from 'react'

import IconTrendingLight from 'app/assets/animations/iconTrendingLight.json'
import { colorize } from 'app/utils/colorizeLottie'
import { useThemeColors } from 'app/utils/theme'

import type { BaseBottomTabBarButtonProps } from './BottomTabBarButton'
import { BottomTabBarButton } from './BottomTabBarButton'

type TrendingButtonProps = BaseBottomTabBarButtonProps

export const TrendingButton = memo((props: TrendingButtonProps) => {
  const { primary, neutral } = useThemeColors()

  const TrendingIcon = useMemo(
    () =>
      colorize(IconTrendingLight, {
        // Shape Layer 4.Group 1.Fill 1
        'layers.0.shapes.0.it.1.c.k.0.s': neutral,
        // Shape Layer 4.Group 1.Fill 1
        'layers.0.shapes.0.it.1.c.k.1.s': primary,
        // Shape Layer 3.Group 3.Fill 1
        'layers.1.shapes.0.it.1.c.k.0.s': neutral,
        // Shape Layer 3.Group 3.Fill 1
        'layers.1.shapes.0.it.1.c.k.1.s': neutral,
        // Shape Layer 3.Group 3.Fill 1
        'layers.1.shapes.0.it.1.c.k.2.s': primary,
        // Shape Layer 2.Group 2.Fill 1
        'layers.2.shapes.0.it.1.c.k.0.s': neutral,
        // Shape Layer 2.Group 2.Fill 1
        'layers.2.shapes.0.it.1.c.k.1.s': primary,
        // Shape Layer 1.Group 4.Fill 1
        'layers.3.shapes.0.it.1.c.k.0.s': neutral,
        // Shape Layer 1.Group 4.Fill 1
        'layers.3.shapes.0.it.1.c.k.1.s': primary
      }),
    [neutral, primary]
  )

  return (
    <BottomTabBarButton name='trending' iconJSON={TrendingIcon} {...props} />
  )
})
