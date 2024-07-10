import { useCallback, useMemo } from 'react'

import { Kind, Status } from '@audius/common/models'
import {
  searchActions,
  type SearchItem as SearchItemType
} from '@audius/common/store'
import { Keyboard } from 'react-native'
import { useDispatch } from 'react-redux'

import { Divider, Flex, Text } from '@audius/harmony-native'
import { SectionList } from 'app/components/core'
import { WithLoader } from 'app/components/with-loader/WithLoader'

import { NoResultsTile } from '../NoResultsTile'
import { SearchItem } from '../SearchItem'
import { useGetSearchResults } from '../searchState'

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

const AllResultsItem = ({ item }: { item: SearchItemType }) => {
  const dispatch = useDispatch()

  const handlePress = useCallback(() => {
    dispatch(addRecentSearch({ searchItem: item }))
  }, [item, dispatch])

  return <SearchItem searchItem={item} onPress={handlePress} />
}

export const AllResults = () => {
  const { data, status } = useGetSearchResults('all')

  const sections = useMemo(
    () =>
      data
        ? [
            {
              title: 'profiles',
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

  const hasNoResults =
    (!data || sections.length === 0) && status === Status.SUCCESS

  // TODO: we should add a better loading state here
  return (
    <Flex onTouchStart={Keyboard.dismiss}>
      <WithLoader loading={status === Status.LOADING}>
        {hasNoResults ? (
          <NoResultsTile />
        ) : (
          <SectionList<SearchItemType>
            keyboardShouldPersistTaps='always'
            stickySectionHeadersEnabled={false}
            sections={sections}
            keyExtractor={({ id, kind }) => `${kind}-${id}`}
            renderItem={({ item }) => <AllResultsItem item={item} />}
            renderSectionHeader={({ section: { title } }) => (
              <Flex ph='l' mt='l'>
                <SearchSectionHeader title={title} />
              </Flex>
            )}
          />
        )}
      </WithLoader>
    </Flex>
  )
}
