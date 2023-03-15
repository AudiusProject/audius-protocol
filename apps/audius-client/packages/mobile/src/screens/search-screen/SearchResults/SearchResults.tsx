import { getSearch } from 'audius-client/src/common/store/search-bar/selectors'
import { Keyboard, View } from 'react-native'
import { useSelector } from 'react-redux'

import { Divider, SectionList } from 'app/components/core'
import type { AppState } from 'app/store'
import { makeStyles } from 'app/styles'

import type { SearchItemType } from './SearchItem'
import { SearchItem } from './SearchItem'
import { SearchSectionHeader } from './SearchSectionHeader'
import { SeeMoreResultsButton } from './SeeMoreResultsButton'

const useStyles = makeStyles(() => ({
  root: {
    flex: 1
  }
}))

const selectSearchResultsSections = (state: AppState) => {
  const { tracks, users, playlists, albums } = getSearch(state)

  return [
    { title: 'tracks', data: tracks },
    { title: 'users', data: users },
    { title: 'playlists', data: playlists },
    { title: 'albums', data: albums }
  ].filter((section) => section.data.length > 0)
}

export const SearchResults = () => {
  const searchResultsSections = useSelector(selectSearchResultsSections)
  const styles = useStyles()

  return (
    <View style={styles.root} onTouchStart={Keyboard.dismiss}>
      <SectionList<SearchItemType>
        keyboardShouldPersistTaps='always'
        stickySectionHeadersEnabled={false}
        sections={searchResultsSections}
        keyExtractor={(item) => {
          if ('track_id' in item) return `track-${item.track_id}`
          if ('user_id' in item) return `user-${item.user_id}`
          return `playlist-${item.playlist_id}`
        }}
        renderItem={({ section: { title }, item }) => (
          <SearchItem type={title} item={item} />
        )}
        renderSectionHeader={({ section: { title } }) => (
          <SearchSectionHeader title={title} />
        )}
        ItemSeparatorComponent={Divider}
        ListFooterComponent={<SeeMoreResultsButton />}
      />
    </View>
  )
}
