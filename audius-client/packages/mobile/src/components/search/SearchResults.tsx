import React from 'react'
import {
  StyleSheet,
  View,
  SectionList,
  Keyboard
} from 'react-native'
import {  useSelector } from 'react-redux'
import { getSearchResults } from '../../store/search/selectors'
import SearchSectionHeader from './content/SearchSectionHeader'
import SearchItem from './content/SearchItem'
import MoreContainer from './content/MoreContainer'
import { SearchUser, SearchTrack, SearchPlaylist, SectionHeader } from '../../store/search/types'

const messages = {
  profile: 'PROFILES',
  tracks: 'TRACKS',
  playlists: 'PLAYLISTS',
  albums: 'ALBUMS'
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  }
})

const sectionHeaders: SectionHeader[] = ['users', 'tracks', 'playlists', 'albums']
const headerMapping: { [key in SectionHeader]: string } = {
  'users': messages.profile,
  'tracks': messages.tracks,
  'playlists': messages.playlists,
  'albums': messages.albums
}

const SearchResults = () => {
  const searchResults = useSelector(getSearchResults)
  const sections = sectionHeaders.map(header => {
    return {
      title: header,
      data: searchResults[header]
    }
  }).filter(result => result.data.length > 0)
  
  const sectionWithMore: {
    title: SectionHeader | 'more',
    data: (SearchUser | SearchTrack | SearchPlaylist)[]
  }[] = [...sections, { title: 'more' as 'more', data: [] }]
  
  return (
    <View style={styles.container} onTouchStart={Keyboard.dismiss}>
      <SectionList
        keyboardShouldPersistTaps={'always'}
        stickySectionHeadersEnabled={false}
        sections={sectionWithMore}
        keyExtractor={(item) => {
          if ('user_id' in item) return item.user_id.toString()
          else if ('track_id' in item) return item.track_id.toString()
          return item.playlist_id.toString()
        }}
        renderItem={({ section: { title }, item }) => <SearchItem type={title as SectionHeader} item={item} />}
        renderSectionHeader={({ section: { title } }) => title === 'more' ? (
          <MoreContainer />
        ) : (
          <SearchSectionHeader title={headerMapping[(title as SectionHeader)]} />
        )}
      />
    </View>
  )
}

export default SearchResults

