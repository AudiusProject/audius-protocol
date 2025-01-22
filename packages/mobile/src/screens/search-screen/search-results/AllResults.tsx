import { useCallback, useMemo } from 'react'

import { Kind, Name } from '@audius/common/models'
import {
  searchActions,
  type SearchItem as SearchItemType
} from '@audius/common/store'
import { range } from 'lodash'
import { Keyboard } from 'react-native'
import { useDispatch } from 'react-redux'

import { Divider, Flex, Text } from '@audius/harmony-native'
import { SectionList } from 'app/components/core'
import { make, track as record } from 'app/services/analytics'

import { NoResultsTile } from '../NoResultsTile'
import { SearchItem, SearchItemSkeleton } from '../SearchItem'
import { useGetSearchResults, useSearchQuery } from '../searchState'

const { addItem: addRecentSearch } = searchActions

type SearchSectionHeaderProps = { title: string }

export const SearchSectionHeader = (props: SearchSectionHeaderProps) => {
  const { title } = props

  return (
    <Flex direction='row' w='100%' mb='s' alignItems='center' gap='s'>
      <Text variant='label' size='s' textTransform='uppercase'>
        {title}
      </Text>
      <Flex flex={1}>
        <Divider />
      </Flex>
    </Flex>
  )
}

const AllResultsItem = ({
  item
}: {
  item: SearchItemType & { isLoading?: boolean; isAlbum?: boolean }
}) => {
  const dispatch = useDispatch()
  const [query] = useSearchQuery()

  const handlePress = useCallback(() => {
    dispatch(addRecentSearch({ searchItem: item }))

    record(
      make({
        eventName: Name.SEARCH_RESULT_SELECT,
        term: query,
        source: 'search results page',
        id: item.id,
        kind: {
          [Kind.COLLECTIONS]: item.isAlbum ? 'album' : 'playlist',
          [Kind.TRACKS]: 'track',
          [Kind.USERS]: 'profile'
        }[item.kind]
      })
    )
  }, [item, dispatch, query])

  return item.isLoading ? (
    <SearchItemSkeleton />
  ) : (
    <SearchItem searchItem={item} onPress={handlePress} />
  )
}

const skeletonSections = [
  {
    title: 'profiles',
    data: range(5).map((i) => ({
      id: i,
      kind: Kind.USERS,
      isLoading: true
    }))
  },
  {
    title: 'tracks',
    data: range(5).map((i) => ({
      id: i,
      kind: Kind.TRACKS,
      isLoading: true
    }))
  },
  {
    title: 'playlists',
    data: range(5).map((i) => ({
      id: i,
      kind: Kind.COLLECTIONS,
      isLoading: true
    }))
  },
  {
    title: 'albums',
    data: range(5).map((i) => ({
      id: i,
      kind: Kind.COLLECTIONS,
      isLoading: true
    }))
  }
]

export const AllResults = () => {
  const { data, isLoading, isSuccess } = useGetSearchResults('all')

  const sections = useMemo(
    () =>
      data
        ? [
            {
              title: 'profiles',
              data: data.users.map((user) => ({
                id: user.user_id,
                kind: Kind.USERS
              }))
            },
            {
              title: 'tracks',
              data: data.tracks.map((track) => ({
                id: track.track_id,
                kind: Kind.TRACKS
              }))
            },
            {
              title: 'playlists',
              data: data.playlists.map((playlist) => ({
                id: playlist.playlist_id,
                kind: Kind.COLLECTIONS,
                isAlbum: false
              }))
            },
            {
              title: 'albums',
              data: data.albums.map((album) => ({
                id: album.playlist_id,
                kind: Kind.COLLECTIONS,
                isAlbum: true
              }))
            }
          ].filter((section) => section.data.length > 0)
        : [],
    [data]
  )

  const hasNoResults = (!data || sections.length === 0) && isSuccess

  return (
    <Flex onTouchStart={Keyboard.dismiss}>
      {hasNoResults ? (
        <NoResultsTile />
      ) : (
        <SectionList<SearchItemType>
          keyboardShouldPersistTaps='always'
          stickySectionHeadersEnabled={false}
          sections={isLoading ? skeletonSections : sections}
          keyExtractor={({ id, kind }) => `${kind}-${id}`}
          renderItem={({ item }) => <AllResultsItem item={item} />}
          renderSectionHeader={({ section: { title } }) => (
            <Flex ph='l' mt='l'>
              <SearchSectionHeader title={title} />
            </Flex>
          )}
        />
      )}
    </Flex>
  )
}
