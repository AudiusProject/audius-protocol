import { ParamListBase } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { CommonState } from 'audius-client/src/common/store'
import { View } from 'react-native'

import { CardList } from 'app/components/core'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { makeStyles } from 'app/styles'

import { ArtistCard } from '../components/ArtistCard'
import { TabInfo } from '../components/TabInfo'

const messages = {
  infoHeader: 'Featured Artists'
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
const getExploreUsers = (state: CommonState) => state.pages.explore.profiles

const makeGetUsers = (userIds: number[]) => {
  return (state: CommonState) => {
    const users = state.users.entries
    return userIds.map(id => users[id].metadata).filter(Boolean)
  }
}

export const ArtistsTab = ({ navigation }: Props) => {
  const styles = useStyles()
  const userIds = useSelectorWeb(getExploreUsers)
  const profiles = useSelectorWeb(makeGetUsers(userIds))

  return (
    <CardList
      ListHeaderComponent={
        <View style={styles.header}>
          <TabInfo header={messages.infoHeader} />
        </View>
      }
      contentContainerStyle={styles.contentContainer}
      data={profiles}
      renderItem={({ item }) => <ArtistCard artist={item} />}
    />
  )
}
