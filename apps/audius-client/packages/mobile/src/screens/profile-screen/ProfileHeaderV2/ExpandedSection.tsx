import { View } from 'react-native'

import { spacing } from 'app/styles/spacing'

import { useSelectProfile } from '../selectors'

import { Bio } from './Bio'
import { ProfileMutualsButton } from './ProfileMutualsButton'
import { ProfileTierTile } from './ProfileTierTile'
import { SocialsAndSites } from './SocialsAndSites'
import { TopSupportersList } from './TopSupportersList'

export const ExpandedSection = () => {
  const { supporter_count } = useSelectProfile(['supporter_count'])
  return (
    <View pointerEvents='box-none'>
      <Bio />
      <SocialsAndSites />
      <View style={{ flexDirection: 'row', marginVertical: spacing(2) }}>
        <ProfileTierTile />
        <ProfileMutualsButton />
      </View>
      {supporter_count > 0 ? <TopSupportersList /> : null}
    </View>
  )
}
