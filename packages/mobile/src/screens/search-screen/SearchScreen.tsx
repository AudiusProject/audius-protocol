import {
  getSearch,
  getSearchBarText
} from 'audius-client/src/common/store/search-bar/selectors'
import { Dimensions, View } from 'react-native'
import { useSelector } from 'react-redux'

import { Screen, ScreenContent, ScreenHeader } from 'app/components/core'
import { getSearchHistory } from 'app/store/search/selectors'
import { makeStyles } from 'app/styles'

import { EmptySearch } from './EmptySearch'
import { SearchBar } from './SearchBar'
import { SearchHistory } from './SearchHistory'
import { SearchResults } from './SearchResults'

const SCREEN_WIDTH = Dimensions.get('window').width

const useStyles = makeStyles(({ spacing }) => ({
  topbarRight: {
    alignItems: 'flex-end',
    width: SCREEN_WIDTH - spacing(20)
  },
  searchBar: {
    width: '100%'
  }
}))

export const SearchScreen = () => {
  const styles = useStyles()
  const searchBarText = useSelector(getSearchBarText)
  const hasResults = useSelector((state) => {
    const { tracks, users, playlists, albums } = getSearch(state)
    return [tracks, users, playlists, albums].some(
      (result) => result && result.length > 0
    )
  })
  const hasSearchHistory = useSelector(
    (state) => getSearchHistory(state).length > 0
  )

  const renderSearchContent = () => {
    if (hasResults) {
      return <SearchResults />
    }
    if (searchBarText && !hasResults) {
      return <EmptySearch query={searchBarText} />
    }
    if (hasSearchHistory) {
      return <SearchHistory />
    }
    return <EmptySearch />
  }

  const searchBar = (
    <View style={styles.topbarRight}>
      <SearchBar style={styles.searchBar} />
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
