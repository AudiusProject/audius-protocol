import { View } from 'react-native'

import { spacing } from 'app/styles/spacing'

import { Bio } from './Bio'
import { ProfileMutualsButton } from './ProfileMutualsButton'
import { ProfileTierTile } from './ProfileTierTile'
import { SocialsAndSites } from './SocialsAndSites'

export const ExpandedSection = () => {
  return (
    <View>
      <Bio />
      <SocialsAndSites />
      <View style={{ flexDirection: 'row', marginVertical: spacing(2) }}>
        <ProfileTierTile />
        <ProfileMutualsButton />
      </View>
    </View>
  )
}
