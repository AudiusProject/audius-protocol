import { ParamListBase } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { CommonState } from 'audius-client/src/common/store'
import { ScrollView, StyleSheet, View } from 'react-native'

import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { useThemedStyles } from 'app/hooks/useThemedStyles'
import { ThemeColors } from 'app/utils/theme'

import { ArtistCard } from '../components/ArtistCard'
import { TabInfo } from '../components/TabInfo'

const messages = {
  infoHeader: 'Featured Artists'
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
const getExploreUsers = (state: CommonState) => state.pages.explore.profiles

const makeGetUsers = (userIds: number[]) => {
  return (state: CommonState) => {
    const users = state.users.entries
    return userIds.map(id => users[id].metadata).filter(Boolean)
  }
}

export const ArtistsTab = ({ navigation }: Props) => {
  const styles = useThemedStyles(createStyles)
  const userIds = useSelectorWeb(getExploreUsers)
  const profiles = useSelectorWeb(makeGetUsers(userIds))

  return (
    <ScrollView style={styles.tabContainer}>
      <TabInfo header={messages.infoHeader} />
      <View style={styles.contentContainer}>
        <View style={styles.cardContainer}>
          {profiles.map((user, idx) => (
            <ArtistCard
              key={user.user_id}
              artist={user}
              style={[styles.card, { marginLeft: idx % 2 ? 8 : 0 }]}
            />
          ))}
        </View>
      </View>
    </ScrollView>
  )
}
