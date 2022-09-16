import {
  getSearch,
  getSearchBarText
} from 'audius-client/src/common/store/search-bar/selectors'
import pick from 'lodash/pick'
import { Dimensions, View } from 'react-native'
import { useSelector } from 'react-redux'

import { Screen } from 'app/components/core'
import { Header } from 'app/components/header'
import { getSearchQuery } from 'app/store/search/selectors'
import { makeStyles } from 'app/styles'

import { ScreenContent } from '../ScreenContent'

import { SearchBar } from './SearchBar'
import SearchHistory from './SearchHistory'
import SearchResults from './SearchResults'
import EmptySearch from './content/EmptySearch'

const SCREEN_WIDTH = Dimensions.get('window').width

const useStyles = makeStyles(({ spacing }) => ({
  topbarLeft: {
    paddingTop: spacing(2) + 1
  },
  topbarRight: {
    alignItems: 'flex-end',
    width: SCREEN_WIDTH - 80
  },
  searchBar: {
    width: '100%',
    flexGrow: 1
  },
  buffer: {
    flexGrow: 1
  }
}))

export const SearchScreen = () => {
  const styles = useStyles()
  const searchQuery = useSelector(getSearchQuery)
  const searchResultQuery = useSelector(getSearchBarText)
  const searchState = useSelector(getSearch)

  const searchResults = pick(searchState, [
    'tracks',
    'users',
    'playlists',
    'albums'
  ])
  const hasResults = Object.values(searchResults).some(
    (result) => result && result.length > 0
  )

  const renderBody = () => {
    if (searchQuery && hasResults) {
      return <SearchResults />
    }
    if (searchQuery && searchResultQuery && !hasResults) {
      return <EmptySearch query={searchResultQuery} />
    }
    return <SearchHistory />
  }

  return (
    <Screen
      topbarRight={
        <View style={styles.topbarRight}>
          <View style={styles.searchBar}>
            <SearchBar />
          </View>
        </View>
      }
      variant='white'
      title={null}
      headerTitle={null}
    >
      <Header text='Search' />
      <ScreenContent unboxed>{renderBody()}</ScreenContent>
    </Screen>
  )
}
