import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Dimensions, View } from 'react-native'

import IconForYou from 'app/assets/images/iconExploreForYou.svg'
import IconMoods from 'app/assets/images/iconExploreMoods.svg'
import IconNote from 'app/assets/images/iconNote.svg'
import IconUser from 'app/assets/images/iconUser.svg'
import TopTabNavigator from 'app/components/app-navigator/TopTabNavigator'
import { ExploreStackParamList } from 'app/components/app-navigator/types'
import { ScreenHeader } from 'app/components/screen-header'

import { ArtistsTab } from './tabs/ArtistsTab'
import { ForYouTab } from './tabs/ForYouTab'
import { MoodsTab } from './tabs/MoodsTab'
import { PlaylistsTab } from './tabs/PlaylistsTab'

type Props = NativeStackScreenProps<ExploreStackParamList, 'explore-stack'>

const screenHeight = Dimensions.get('window').height

const ExploreScreen = ({ navigation }: Props) => {
  return (
    <View
      style={{
        display: 'flex',
        height: screenHeight
      }}
    >
      <ScreenHeader text={'Explore'} />
      <View style={{ flex: 1 }}>
        <TopTabNavigator
          initialScreenName='tracks'
          screens={[
            {
              name: 'forYou',
              label: 'For You',
              Icon: IconForYou,
              component: ForYouTab
            },
            {
              name: 'moods',
              Icon: IconMoods,
              component: MoodsTab
            },
            {
              name: 'playlists',
              Icon: IconNote,
              // TODO: Check to see if this should be playlist icon for consistency
              // icon: IconPlaylists,
              component: PlaylistsTab
            },
            {
              name: 'artists',
              Icon: IconUser,
              component: ArtistsTab
            }
          ]}
        />
      </View>
    </View>
  )
}

export default ExploreScreen
