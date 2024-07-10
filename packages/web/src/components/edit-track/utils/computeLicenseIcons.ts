import { creativeCommons, License } from '@audius/common/utils'
import {
  IconCcBy as IconAllowAttribution,
  IconCcCC as IconCreativeCommons,
  IconCcNC as IconNonCommercialUse,
  IconCcND as IconNoDerivatives,
  IconCcSA as IconShareAlike,
  IconComponent
} from '@audius/harmony'

const { computeLicenseVariables } = creativeCommons

export const computeLicenseIcons = (license: License) => {
  const { allowAttribution, commercialUse, derivativeWorks } =
    computeLicenseVariables(license)

  if (!allowAttribution) return null
  const icons: [Icon: IconComponent, key: string][] = [
    [IconCreativeCommons, 'cc'],
    [IconAllowAttribution, 'by']
  ]
  if (!commercialUse) icons.push([IconNonCommercialUse, 'nc'])
  if (derivativeWorks === true) icons.push([IconShareAlike, 'sa'])
  else if (derivativeWorks === false) icons.push([IconNoDerivatives, 'nd'])

  return icons
}
