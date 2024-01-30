import type { ComponentType } from 'react'

import type { Nullable } from '@audius/common/utils'
import type { SvgProps } from 'react-native-svg'

import IconAllowAttribution from 'app/assets/images/creativeCommons/by.svg'
import IconCreativeCommons from 'app/assets/images/creativeCommons/cc.svg'
import IconNonCommercialUse from 'app/assets/images/creativeCommons/nc.svg'
import IconNoDerivatives from 'app/assets/images/creativeCommons/nd.svg'
import IconShareAlike from 'app/assets/images/creativeCommons/sa.svg'

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
