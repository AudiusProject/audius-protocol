import { View } from 'react-native'

import { Bio } from './Bio'
import { ProfileSocials } from './ProfileSocials'

export const CollapsedSection = () => {
  return (
    <View>
      <Bio numberOfLines={2} />
      <ProfileSocials />
    </View>
  )
}
