import { useMemo } from 'react'

import { Kind, Status } from '@audius/common/models'
import type { SearchItem as SearchItemType } from '@audius/common/store'
import { Keyboard } from 'react-native'

import { Divider, Flex, Text } from '@audius/harmony-native'
import { SectionList } from 'app/components/core'
import { WithLoader } from 'app/components/with-loader/WithLoader'

import { SearchItem } from '../SearchItem'
import { useGetSearchResults } from '../searchState'

type SearchSectionHeaderProps = { title: string }

export const SearchSectionHeader = (props: SearchSectionHeaderProps) => {
  const { title } = props

  return (
    <Flex direction='row' w='100%' mb='s' alignItems='center' gap='s'>
      <Text variant='label' size='s' textTransform='uppercase'>
        {title}
      </Text>
      <Flex w='100%' h='1px'>
        <Divider />
      </Flex>
    </Flex>
  )
}

export const AllResults = () => {
  const { data, status } = useGetSearchResults('all')

  const sections = useMemo(
    () =>
      data
        ? [
            {
              title: 'users',
              data: data.users.map(({ user_id }) => ({
                id: user_id,
                kind: Kind.USERS
              }))
            },
            {
              title: 'tracks',
              data: data.tracks.map(({ track_id }) => ({
                id: track_id,
                kind: Kind.TRACKS
              }))
            },
            {
              title: 'playlists',
              data: data.playlists.map(({ playlist_id }) => ({
                id: playlist_id,
                kind: Kind.COLLECTIONS
              }))
            },
            {
              title: 'albums',
              data: data.albums.map(({ playlist_id }) => ({
                id: playlist_id,
                kind: Kind.COLLECTIONS
              }))
            }
          ].filter((section) => section.data.length > 0)
        : [],
    [data]
  )

  return (
    <Flex onTouchStart={Keyboard.dismiss} pt='l'>
      <WithLoader loading={status === Status.LOADING}>
        <SectionList<SearchItemType>
          keyboardShouldPersistTaps='always'
          stickySectionHeadersEnabled={false}
          sections={sections}
          keyExtractor={({ id, kind }) => `${kind}-${id}`}
          renderItem={({ item }) => (
            <Flex ph='l'>
              <SearchItem searchItem={item} />
            </Flex>
          )}
          renderSectionHeader={({ section: { title } }) => (
            <Flex ph='l'>
              <SearchSectionHeader title={title} />
            </Flex>
          )}
        />
      </WithLoader>
    </Flex>
  )
}
