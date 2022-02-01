import { ParamListBase } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { CommonState } from 'audius-client/src/common/store'
import { ScrollView, StyleSheet, View } from 'react-native'

import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { useThemedStyles } from 'app/hooks/useThemedStyles'
import { ThemeColors } from 'app/utils/theme'

import { CollectionCard } from '../components/CollectionCard'
import { TabInfo } from '../components/TabInfo'

const messages = {
  infoHeader: 'Featured Playlists'
}

type Props = {
  navigation: NativeStackNavigationProp<ParamListBase, keyof ParamListBase>
}

const createStyles = (themeColors: ThemeColors) =>
  StyleSheet.create({
    tabContainer: {
      display: 'flex'
    },
    contentContainer: {
      display: 'flex',
      // TODO: Fix this
      marginBottom: 240
    },
    cardContainer: {
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'flex-start',
      padding: 12,
      paddingTop: 24
    },
    card: {
      flex: 1,
      flexBasis: '40%',
      maxWidth: '50%',
      marginBottom: 8
    }
  })

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
  const styles = useThemedStyles(createStyles)
  const playlistIds = useSelectorWeb(getExplorePlaylists)
  const playlists = useSelectorWeb(makeGetFullPlaylists(playlistIds))

  return (
    <ScrollView style={styles.tabContainer}>
      <TabInfo header={messages.infoHeader} />
      <View style={styles.contentContainer}>
        <View style={styles.cardContainer}>
          {playlists.map((playlist, idx) => (
            <CollectionCard
              key={playlist.playlist_id}
              collection={playlist}
              style={[styles.card, { marginLeft: idx % 2 ? 8 : 0 }]}
            />
          ))}
        </View>
      </View>
    </ScrollView>
  )
}
