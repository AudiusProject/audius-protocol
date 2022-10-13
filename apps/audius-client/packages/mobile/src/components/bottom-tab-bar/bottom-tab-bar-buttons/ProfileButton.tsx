import { useMemo } from 'react'

import IconProfileLight from 'app/assets/animations/iconProfileLight.json'
import { colorize } from 'app/utils/colorizeLottie'
import { useThemeColors } from 'app/utils/theme'

import type { BaseBottomTabBarButtonProps } from './BottomTabBarButton'
import { BottomTabBarButton } from './BottomTabBarButton'

type ProfileButtonProps = BaseBottomTabBarButtonProps

export const ProfileButton = (props: ProfileButtonProps) => {
  const { primary, neutral } = useThemeColors()

  const IconProfile = useMemo(
    () =>
      colorize(IconProfileLight, {
        // icon_Profile Outlines.Group 1.Fill 1
        'layers.0.shapes.0.it.3.c.k.0.s': neutral,
        // icon_Profile Outlines.Group 1.Fill 1
        'layers.0.shapes.0.it.3.c.k.1.s': primary
      }),
    [neutral, primary]
  )
  return <BottomTabBarButton name='profile' iconJSON={IconProfile} {...props} />
}
