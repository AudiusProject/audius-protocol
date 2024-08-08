import { IconComponent } from 'components/icon'
import { IconStar, IconTipping, IconTrophy } from 'icons'

import { IconText } from '../IconText'

import { IdentifierType, IdentifierProps } from './types'

const typeInfoMap: Record<
  IdentifierType,
  { label: string; icon: IconComponent }
> = {
  artist: {
    label: 'Artist',
    icon: IconStar
  },
  supporter: {
    label: 'Tip Supporter',
    icon: IconTipping
  },
  topSupporter: {
    label: 'Top Supporter',
    icon: IconTrophy
  }
}

export const Identifier = ({ type }: IdentifierProps) => {
  const { label, icon } = typeInfoMap[type]

  return (
    <IconText icons={[{ icon, color: 'accent' }]} color='accent'>
      {label}
    </IconText>
  )
}
