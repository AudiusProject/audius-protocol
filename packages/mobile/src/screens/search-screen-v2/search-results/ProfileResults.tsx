import { Kind, Status } from '@audius/common/models'
import { searchActions } from '@audius/common/store'
import { useDispatch } from 'react-redux'

import { Flex, useTheme } from '@audius/harmony-native'
import { UserList } from 'app/components/user-list'

import { NoResultsTile } from '../NoResultsTile'
import { SearchCatalogTile } from '../SearchCatalogTile'
import { useGetSearchResults, useIsEmptySearch } from '../searchState'

const { addItem: addRecentSearch } = searchActions

export const ProfileResults = () => {
  const dispatch = useDispatch()
  const { spacing } = useTheme()
  const { data, status } = useGetSearchResults('users')
  const isEmptySearch = useIsEmptySearch()
  const hasNoResults = (!data || data.length === 0) && status === Status.SUCCESS

  if (isEmptySearch) return <SearchCatalogTile />

  return (
    <Flex h='100%' backgroundColor='default'>
      {hasNoResults ? (
        <NoResultsTile />
      ) : (
        <UserList
          keyboardShouldPersistTaps='handled'
          style={{
            height: '100%',
            paddingVertical: spacing.m
          }}
          profiles={data}
          isLoading={status === Status.LOADING}
          onCardPress={(id) => {
            dispatch(
              addRecentSearch({
                searchItem: {
                  kind: Kind.USERS,
                  id
                }
              })
            )
          }}
        />
      )}
    </Flex>
  )
}
