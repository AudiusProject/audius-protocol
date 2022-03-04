import { ParamListBase } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { makeGetExplore } from 'audius-client/src/common/store/pages/explore/selectors'
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
    paddingBottom: spacing(8)
  },
  header: {
    marginBottom: spacing(2)
  }
}))

const getExplore = makeGetExplore()

export const PlaylistsTab = ({ navigation }: Props) => {
  const styles = useStyles()
  const { playlists } = useSelectorWeb(getExplore)

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
