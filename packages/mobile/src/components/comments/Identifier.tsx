import type { IconComponent } from '@audius/harmony-native'
import {
  IconStar,
  IconTipping,
  IconTrophy,
  IconText
} from '@audius/harmony-native'

export type IdentifierType = 'artist' | 'topSupporter' | 'supporter'

export type IdentifierProps = {
  type: IdentifierType
}

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
