import { IconComponent } from '@audius/harmony'

import { Size } from './types'

type CheckProps = {
  size: Size
  Icon: IconComponent
}

const iconSizes = {
  tiny: { height: 10, width: 10 },
  small: { height: 16, width: 16 },
  medium: { height: 24, width: 24 },
  large: { height: 32, width: 32 },
  xlarge: { height: 44, width: 44 }
}

export const FlairIcon = ({ size, Icon }: CheckProps) => {
  return <Icon {...iconSizes[size]} color='active' colorSecondary='white' />
}
