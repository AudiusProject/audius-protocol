import React, { useCallback } from 'react'

import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Button, Dimensions, Text, View } from 'react-native'

import IconForYou from 'app/assets/images/iconExploreForYou.svg'
import IconMoods from 'app/assets/images/iconExploreMoods.svg'
import IconNote from 'app/assets/images/iconNote.svg'
import IconUser from 'app/assets/images/iconUser.svg'
import TopTabNavigator from 'app/components/app-navigator/TopTabNavigator'
import { ExploreStackParamList } from 'app/components/app-navigator/types'

type Props = NativeStackScreenProps<ExploreStackParamList, 'explore-stack'>

const screenHeight = Dimensions.get('window').height

const ForYouTab = () => {
  return <Text>For You Tab</Text>
}
const MoodsTab = () => {
  return <Text>Moods Tab</Text>
}
const PlaylistsTab = () => {
  return <Text>Playlists Tab</Text>
}
const ArtistsTab = ({ navigation }) => {
  const handlePress = useCallback(() => {
    navigation.navigate('profile', { id: 1 })
  }, [navigation])

  return (
    <View>
      <Text>Artists Tab</Text>
      <Button title='Go to single artist view' onPress={handlePress} />
    </View>
  )
}

const ExploreScreen = ({ navigation }: Props) => {
  return (
    <View
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: screenHeight
      }}
    >
      <Text style={{ flex: 1 }}>Example explore screen</Text>
      <View style={{ flex: 10 }}>
        <TopTabNavigator
          initialScreen='tracks'
          screens={[
            {
              name: 'forYou',
              label: 'For You',
              icon: IconForYou,
              component: ForYouTab
            },
            {
              name: 'moods',
              icon: IconMoods,
              component: MoodsTab
            },
            {
              name: 'playlists',
              icon: IconNote,
              // TODO: Check to see if this should be playlist icon for consistency
              // icon: IconPlaylists,
              component: PlaylistsTab
            },
            {
              name: 'artists',
              icon: IconUser,
              component: ArtistsTab
            }
          ]}
        />
      </View>
    </View>
  )
}

export default ExploreScreen
