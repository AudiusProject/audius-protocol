import type { ComponentType } from 'react'

import type { Nullable } from '@audius/common'
import type { SvgProps } from 'react-native-svg'

import {
  IconAllowAttribution,
  IconCreativeCommons,
  IconNonCommercialUse,
  IconNoDerivatives,
  IconShareAlike
} from '@audius/harmony-native'

export const computeLicenseIcons = (
  allowAttribution: boolean,
  commercialUse: boolean,
  derivativeWorks: Nullable<boolean>
) => {
  if (!allowAttribution) return null
  const icons: [Icon: ComponentType<SvgProps>, key: string][] = [
    [IconCreativeCommons, 'cc'],
    [IconAllowAttribution, 'by']
  ]
  if (!commercialUse) icons.push([IconNonCommercialUse, 'nc'])
  if (derivativeWorks === true) icons.push([IconShareAlike, 'sa'])
  else if (derivativeWorks === false) icons.push([IconNoDerivatives, 'nd'])

  return icons
}
