import type { ComponentType } from 'react'

import type { Nullable } from '@audius/common/utils'
import type { SvgProps } from 'react-native-svg'

import {
  IconCcBy,
  IconCcCC,
  IconCcNC,
  IconCcND,
  IconCcSA
} from '@audius/harmony-native'

export const computeLicenseIcons = (
  allowAttribution: boolean,
  commercialUse: boolean,
  derivativeWorks: Nullable<boolean>
) => {
  if (!allowAttribution) return null
  const icons: [Icon: ComponentType<SvgProps>, key: string][] = [
    [IconCcCC, 'cc'],
    [IconCcBy, 'by']
  ]
  if (!commercialUse) icons.push([IconCcNC, 'nc'])
  if (derivativeWorks === true) icons.push([IconCcSA, 'sa'])
  else if (derivativeWorks === false) icons.push([IconCcND, 'nd'])

  return icons
}
