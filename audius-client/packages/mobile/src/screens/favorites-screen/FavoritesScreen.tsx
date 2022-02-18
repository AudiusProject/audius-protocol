import { useCallback } from 'react'

import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Button, Dimensions, Text, View } from 'react-native'

import IconAlbum from 'app/assets/images/iconAlbum.svg'
import IconNote from 'app/assets/images/iconNote.svg'
import IconPlaylists from 'app/assets/images/iconPlaylists.svg'
import TopTabNavigator from 'app/components/app-navigator/TopTabNavigator'
import { FavoritesStackParamList } from 'app/components/app-navigator/types'

type Props = NativeStackScreenProps<FavoritesStackParamList, 'favorites-stack'>

const screenHeight = Dimensions.get('window').height

const TracksTab = ({ navigation }) => {
  const handlePress = useCallback(() => {
    navigation.push('track', { id: 1 })
  }, [navigation])

  return (
    <View>
      <Text>Tracks Tab</Text>
      <Button title='Go to single track view' onPress={handlePress} />
    </View>
  )
}
const AlbumsTab = () => {
  return <Text>Albums Tab</Text>
}
const PlaylistsTab = () => {
  return <Text>Playlists Tab</Text>
}

const FavoritesScreen = ({ navigation }: Props) => {
  return (
    <View
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: screenHeight
      }}
    >
      <Text style={{ flex: 1 }}>Example favorites screen</Text>
      <View style={{ flex: 10 }}>
        <TopTabNavigator
          initialScreenName='tracks'
          screens={[
            {
              name: 'tracks',
              Icon: IconNote,
              component: TracksTab
            },
            {
              name: 'albums',
              Icon: IconAlbum,
              component: AlbumsTab
            },
            {
              name: 'playlists',
              Icon: IconPlaylists,
              component: PlaylistsTab
            }
          ]}
        />
      </View>
    </View>
  )
}

export default FavoritesScreen
