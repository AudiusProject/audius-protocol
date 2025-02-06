import { useCallback } from 'react'

import { useSearchUserResults } from '@audius/common/api'
import { Kind, Name } from '@audius/common/models'
import { searchActions } from '@audius/common/store'
import { Box, Flex, Text, useTheme } from '@audius/harmony'
import { range } from 'lodash'
import InfiniteScroll from 'react-infinite-scroller'
import { useDispatch } from 'react-redux'

import { make } from 'common/store/analytics/actions'
import { UserCard } from 'components/user-card'
import { useIsMobile } from 'hooks/useIsMobile'
import { getMainContentScrollRef } from 'hooks/useMainContentScrollRef'

import { NoResultsTile } from '../NoResultsTile'
import { SortMethodFilterButton } from '../SortMethodFilterButton'
import { useSearchParams } from '../hooks'

const { addItem: addRecentSearch } = searchActions

const messages = {
  profiles: 'Profiles',
  sortOptionsLabel: 'Sort By'
}

type ProfileResultsProps = {
  // the 'status' type was conflicting with the data we pass from useSearchAllResults - but we don't use it at all here so no need to worry about it
  queryData: Omit<ReturnType<typeof useSearchUserResults>, 'status'>
  limit?: number
  skeletonCount?: number
}

const ProfileResultsSkeletons = ({
  skeletonCount = 12
}: {
  skeletonCount: number
}) => {
  const isMobile = useIsMobile()
  return (
    <>
      {range(skeletonCount).map((_, i) => (
        <UserCard
          key={`user_card_sekeleton_${i}`}
          id={0}
          size={isMobile ? 'xs' : 's'}
          css={isMobile ? { maxWidth: 320 } : undefined}
          loading={true}
        />
      ))}
    </>
  )
}

export const ProfileResultsTiles = (props: ProfileResultsProps) => {
  const { limit = 100, skeletonCount = 12, queryData } = props
  const { data = [], isFetching, isInitialLoading } = queryData
  const ids = data?.map((user) => user.user_id)
  const { query } = useSearchParams()

  const isMobile = useIsMobile()
  const dispatch = useDispatch()

  const truncatedIds = ids?.slice(0, limit) ?? []

  const handleClick = useCallback(
    (id?: number) => {
      if (id) {
        dispatch(
          addRecentSearch({
            searchItem: {
              kind: Kind.USERS,
              id
            }
          })
        )
        dispatch(
          make(Name.SEARCH_RESULT_SELECT, {
            term: query,
            source: 'search results page',
            id,
            kind: 'profile'
          })
        )
      }
    },
    [dispatch, query]
  )

  const shouldShowMoreSkeletons =
    isFetching && !isInitialLoading && data?.length < limit

  return (
    <Box
      css={{
        display: 'grid',
        gridTemplateColumns: isMobile
          ? 'repeat(auto-fill, minmax(150px, 1fr))'
          : 'repeat(auto-fill, 200px)',
        justifyContent: 'space-between',
        gap: 16
      }}
      p={isMobile ? 'm' : undefined}
    >
      {!truncatedIds.length ? (
        <ProfileResultsSkeletons skeletonCount={skeletonCount} />
      ) : (
        truncatedIds.map((id) => (
          <UserCard
            key={id}
            id={id}
            size={isMobile ? 'xs' : 's'}
            css={isMobile ? { maxWidth: 320 } : undefined}
            onClick={() => handleClick(id)}
            onUserLinkClick={() => handleClick(id)}
          />
        ))
      )}
      {shouldShowMoreSkeletons ? (
        <ProfileResultsSkeletons skeletonCount={skeletonCount} />
      ) : null}
    </Box>
  )
}

export const ProfileResultsPage = () => {
  const isMobile = useIsMobile()
  const { color } = useTheme()

  const searchParams = useSearchParams()
  const queryData = useSearchUserResults(searchParams)
  const { data: ids, isLoading, hasNextPage, loadNextPage } = queryData

  const isResultsEmpty = ids?.length === 0
  const showNoResultsTile = !isLoading && isResultsEmpty

  return (
    <InfiniteScroll
      pageStart={0}
      loadMore={loadNextPage}
      hasMore={hasNextPage}
      getScrollParent={getMainContentScrollRef}
      initialLoad={false}
      useWindow={false}
    >
      <Flex
        direction='column'
        gap='xl'
        css={isMobile ? { backgroundColor: color.background.default } : {}}
      >
        {!isMobile ? (
          <Flex justifyContent='space-between' alignItems='center'>
            <Text variant='heading' textAlign='left'>
              {messages.profiles}
            </Text>
            <SortMethodFilterButton />
          </Flex>
        ) : null}
        {showNoResultsTile ? (
          <NoResultsTile />
        ) : (
          <ProfileResultsTiles queryData={queryData} />
        )}
      </Flex>
    </InfiniteScroll>
  )
}
