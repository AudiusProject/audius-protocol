import type { Collection, Track, User } from '@audius/common'
import { getSearch } from 'audius-client/src/common/store/search-bar/selectors'
import { StyleSheet, View, Keyboard } from 'react-native'
import { useSelector } from 'react-redux'

import { SectionList } from 'app/components/core'
import type { SectionHeader } from 'app/store/search/types'

import SearchItem from './content/SearchItem'
import SearchSectionHeader from './content/SearchSectionHeader'
import { SeeMoreResultsButton } from './content/SeeMoreResultsButton'

const messages = {
  profile: 'PROFILES',
  tracks: 'TRACKS',
  playlists: 'PLAYLISTS',
  albums: 'ALBUMS'
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  }
})

const sectionHeaders: SectionHeader[] = [
  'users',
  'tracks',
  'playlists',
  'albums'
]
const headerMapping: { [key in SectionHeader]: string } = {
  users: messages.profile,
  tracks: messages.tracks,
  playlists: messages.playlists,
  albums: messages.albums
}

const SearchResults = () => {
  const searchResults = useSelector(getSearch)
  const sections = sectionHeaders
    .map((header) => {
      return {
        title: header,
        data: searchResults[header]
      }
    })
    .filter((result) => result.data.length > 0)

  const sectionWithMore: {
    title: SectionHeader | 'more'
    data: (User | Track | Collection)[]
  }[] = [...sections, { title: 'more', data: [] }]

  return (
    <View style={styles.container} onTouchStart={Keyboard.dismiss}>
      <SectionList
        keyboardShouldPersistTaps={'always'}
        stickySectionHeadersEnabled={false}
        sections={sectionWithMore}
        keyExtractor={(item) => {
          if ('track_id' in item) return `track-${item.track_id}`
          else if ('user_id' in item) return `user-${item.user_id}`
          return `playlist-${item.playlist_id}`
        }}
        renderItem={({ section: { title, data }, item, index }) => (
          <SearchItem
            isLast={index === data.length - 1}
            type={title as SectionHeader}
            item={item}
          />
        )}
        renderSectionHeader={({ section: { title } }) =>
          title === 'more' ? (
            <SeeMoreResultsButton />
          ) : (
            <SearchSectionHeader
              title={headerMapping[title as SectionHeader]}
            />
          )
        }
      />
    </View>
  )
}

export default SearchResults
