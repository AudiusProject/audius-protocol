import { View } from 'react-native'

import { Bio } from './Bio'
import { ProfileSocials } from './ProfileSocials'

type CollapsedSectionProps = {
  isExpansible: boolean
  setIsExpansible: (isExpansible: boolean) => void
}

export const CollapsedSection = (props: CollapsedSectionProps) => {
  return (
    <View pointerEvents='box-none'>
      <Bio numberOfLines={2} {...props} />
      <ProfileSocials />
    </View>
  )
}
