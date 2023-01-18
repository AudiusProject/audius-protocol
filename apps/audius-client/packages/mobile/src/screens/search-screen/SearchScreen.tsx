import {
  getSearch,
  getSearchBarText
} from 'audius-client/src/common/store/search-bar/selectors'
import { Dimensions, View } from 'react-native'
import { useSelector } from 'react-redux'

import { Screen, ScreenContent, ScreenHeader } from 'app/components/core'
import { getSearchQuery } from 'app/store/search/selectors'
import { makeStyles } from 'app/styles'

import { SearchBar } from './SearchBar'
import { SearchHistory } from './SearchHistory'
import SearchResults from './SearchResults'
import { EmptySearch } from './content/EmptySearch'

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
  const searchBarText = useSelector(getSearchBarText)
  const hasResults = useSelector((state) => {
    const { tracks, users, playlists, albums } = getSearch(state)
    return [tracks, users, playlists, albums].some(
      (result) => result && result.length > 0
    )
  })

  const renderSearchContent = () => {
    if (searchQuery && hasResults) {
      return <SearchResults />
    }
    if (
      searchQuery &&
      searchBarText &&
      searchQuery === searchBarText &&
      !hasResults
    ) {
      return <EmptySearch query={searchBarText} />
    }
    return <SearchHistory />
  }

  const searchBar = (
    <View style={styles.topbarRight}>
      <View style={styles.searchBar}>
        <SearchBar />
      </View>
    </View>
  )

  return (
    <Screen
      topbarRight={searchBar}
      variant='white'
      title={null}
      headerTitle={null}
    >
      <ScreenHeader text='Search' />
      <ScreenContent unboxed>{renderSearchContent()}</ScreenContent>
    </Screen>
  )
}
