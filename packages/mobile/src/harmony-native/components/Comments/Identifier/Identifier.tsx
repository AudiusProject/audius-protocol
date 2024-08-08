import type {
  IdentifierType,
  IdentifierProps
} from '@audius/harmony/src/components/comments/Identifier/types'

import type { IconComponent } from '@audius/harmony-native'
import { IconStar, IconTipping, IconTrophy } from '@audius/harmony-native'

import { IconText } from '../IconText'

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
