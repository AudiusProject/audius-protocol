import { ParamListBase } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { CommonState } from 'audius-client/src/common/store'
import { View } from 'react-native'

import { CollectionList } from 'app/components/collection-list'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { makeStyles } from 'app/styles'

import { TabInfo } from '../components/TabInfo'

const messages = {
  infoHeader: 'Featured Playlists'
}

type Props = {
  navigation: NativeStackNavigationProp<ParamListBase, keyof ParamListBase>
}

const useStyles = makeStyles(({ spacing }) => ({
  contentContainer: {
    paddingBottom: 240
  },
  header: {
    marginBottom: spacing(2)
  }
}))

// TODO: Move these somewhere (clientStore selectors)
const getExplorePlaylists = (state: CommonState) =>
  state.pages.explore.playlists

const makeGetFullPlaylists = (playlistIds: number[]) => {
  return (state: CommonState) => {
    const collections = state.collections.entries
    const users = state.users.entries

    return playlistIds
      .map(id => collections[id].metadata)
      .filter(Boolean)
      .map(collection => ({
        ...collection,
        user: users[collection.playlist_owner_id]?.metadata ?? {}
      }))
  }
}

export const PlaylistsTab = ({ navigation }: Props) => {
  const styles = useStyles()
  const playlistIds = useSelectorWeb(getExplorePlaylists)
  const playlists = useSelectorWeb(makeGetFullPlaylists(playlistIds))

  return (
    <CollectionList
      ListHeaderComponent={
        <View style={styles.header}>
          <TabInfo header={messages.infoHeader} />
        </View>
      }
      contentContainerStyle={styles.contentContainer}
      collection={playlists}
    />
  )
}
