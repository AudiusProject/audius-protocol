import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Dimensions, Text, View } from 'react-native'

import IconAlbum from 'app/assets/images/iconAlbum.svg'
import IconCollectibles from 'app/assets/images/iconCollectibles.svg'
import IconNote from 'app/assets/images/iconNote.svg'
import IconPlaylists from 'app/assets/images/iconPlaylists.svg'
import IconRepost from 'app/assets/images/iconRepost.svg'
import TopTabNavigator from 'app/components/app-navigator/TopTabNavigator'
import { BaseStackParamList } from 'app/components/app-navigator/types'

// We might need to allow BaseStackParamList to be generic here
// to get all the relevant params
type Props = NativeStackScreenProps<BaseStackParamList, 'track'>

const screenHeight = Dimensions.get('window').height

const TracksTab = () => {
  return <Text>Tracks Tab</Text>
}
const RepostsTab = () => {
  return <Text>Reposts Tab</Text>
}
const AlbumsTab = () => {
  return <Text>Albums Tab</Text>
}
const PlaylistsTab = () => {
  return <Text>Playlists Tab</Text>
}
const CollectiblesTab = () => {
  return <Text>Collectibles Tab</Text>
}

const ProfileScreen = ({ navigation }: Props) => {
  return (
    <View
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: screenHeight
      }}
    >
      <Text style={{ flex: 1 }}>Example profile screen</Text>
      <View style={{ flex: 4 }}>
        <TopTabNavigator
          initialScreen='tracks'
          screens={[
            {
              name: 'tracks',
              icon: IconNote,
              component: TracksTab
            },
            {
              name: 'albums',
              icon: IconAlbum,
              component: AlbumsTab
            },
            {
              name: 'playlists',
              icon: IconPlaylists,
              component: PlaylistsTab
            },
            {
              name: 'reposts',
              icon: IconRepost,
              component: RepostsTab
            },
            {
              name: 'collectibles',
              icon: IconCollectibles,
              component: CollectiblesTab
            }
          ]}
        />
      </View>
    </View>
  )
}

export default ProfileScreen
