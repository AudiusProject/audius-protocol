import type { ComponentType, SVGProps } from 'react'

import type { Nullable } from '@audius/common'

import { ReactComponent as IconAllowAttribution } from 'assets/img/creativeCommons/by.svg'
import { ReactComponent as IconCreativeCommons } from 'assets/img/creativeCommons/cc.svg'
import { ReactComponent as IconNonCommercialUse } from 'assets/img/creativeCommons/nc.svg'
import { ReactComponent as IconNoDerivatives } from 'assets/img/creativeCommons/nd.svg'
import { ReactComponent as IconShareAlike } from 'assets/img/creativeCommons/sa.svg'

export const computeLicenseIcons = (
  allowAttribution: boolean,
  commercialUse: boolean,
  derivativeWorks: Nullable<boolean>
) => {
  if (!allowAttribution) return null
  const icons: [Icon: ComponentType<SVGProps<SVGSVGElement>>, key: string][] = [
    [IconCreativeCommons, 'cc'],
    [IconAllowAttribution, 'by']
  ]
  if (!commercialUse) icons.push([IconNonCommercialUse, 'nc'])
  if (derivativeWorks === true) icons.push([IconShareAlike, 'sa'])
  else if (derivativeWorks === false) icons.push([IconNoDerivatives, 'nd'])

  return icons
}
