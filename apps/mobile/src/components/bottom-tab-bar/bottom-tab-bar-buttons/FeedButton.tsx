import { useMemo } from 'react'

import IconFeedLight from 'app/assets/animations/iconFeedLight.json'
import { colorize } from 'app/utils/colorizeLottie'
import { useThemeColors } from 'app/utils/theme'

import type { BaseBottomTabBarButtonProps } from './BottomTabBarButton'
import { BottomTabBarButton } from './BottomTabBarButton'

type FeedButtonProps = BaseBottomTabBarButtonProps

export const FeedButton = (props: FeedButtonProps) => {
  const { primary, neutral } = useThemeColors()

  const IconFeed = useMemo(
    () =>
      colorize(IconFeedLight, {
        // Shape Layer 1.Group 1.Fill 1
        'layers.0.shapes.0.it.1.c.k.0.s': neutral,
        // Shape Layer 1.Group 1.Fill 1
        'layers.0.shapes.0.it.1.c.k.1.s': primary,
        // Shape Layer 2.Group 3.Fill 1
        'layers.1.shapes.0.it.1.c.k.0.s': neutral,
        // Shape Layer 2.Group 3.Fill 1
        'layers.1.shapes.0.it.1.c.k.1.s': primary,
        // Shape Layer 2.Group 5.Fill 1
        'layers.1.shapes.1.it.1.c.k.0.s': neutral,
        // Shape Layer 2.Group 5.Fill 1
        'layers.1.shapes.1.it.1.c.k.1.s': primary,
        // icon_Feed Outlines.Group 2.Fill 1
        'layers.2.shapes.0.it.1.c.k.0.s': neutral,
        // icon_Feed Outlines.Group 2.Fill 1
        'layers.2.shapes.0.it.1.c.k.1.s': primary,
        // icon_Feed Outlines.Group 4.Fill 1
        'layers.2.shapes.1.it.1.c.k.0.s': neutral,
        // icon_Feed Outlines.Group 4.Fill 1
        'layers.2.shapes.1.it.1.c.k.1.s': primary
      }),
    [neutral, primary]
  )
  return <BottomTabBarButton name='feed' iconJSON={IconFeed} {...props} />
}
