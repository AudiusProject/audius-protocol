import { View } from 'react-native'

import { spacing } from 'app/styles/spacing'

import { useSelectProfile } from '../selectors'

import { Bio } from './Bio'
import { ProfileMutualsButton } from './ProfileMutualsButton'
import { ProfileTierTile } from './ProfileTierTile'
import { SocialsAndSites } from './SocialsAndSites'
import { SupportingList } from './SupportingList'

export const ExpandedSection = () => {
  const { supporting_count } = useSelectProfile(['supporting_count'])
  return (
    <View pointerEvents='box-none'>
      <Bio />
      <SocialsAndSites />
      <View style={{ flexDirection: 'row', marginVertical: spacing(2) }}>
        <ProfileTierTile />
        <ProfileMutualsButton />
      </View>
      {supporting_count > 0 ? <SupportingList /> : null}
    </View>
  )
}
