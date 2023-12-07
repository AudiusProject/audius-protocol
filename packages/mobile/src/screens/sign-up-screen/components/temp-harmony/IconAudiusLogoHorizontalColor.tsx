import type { ImageProps } from 'react-native'
import { Image } from 'react-native'

import audiusLogoH from './AudiusLogoH.png'

export const IconAudiusLogoHorizontalColor = (props: Partial<ImageProps>) => {
  return <Image {...props} source={audiusLogoH} />
}
