import { useCallback } from 'react'

import { ID, Kind, Status } from '@audius/common/models'
import { searchActions } from '@audius/common/store'
import { Box, Flex, OptionsFilterButton, Text, useTheme } from '@audius/harmony'
import { range } from 'lodash'
import { useDispatch } from 'react-redux'

import { UserCard } from 'components/user-card'
import { useIsMobile } from 'hooks/useIsMobile'

import { NoResultsTile } from '../NoResultsTile'
import {
  useGetSearchResults,
  useSearchParams,
  useUpdateSearchParams
} from '../utils'

const { addItem: addRecentSearch } = searchActions

const messages = {
  profiles: 'Profiles',
  sortOptionsLabel: 'Sort By'
}

type ProfileResultsProps = {
  ids: ID[]
  limit?: number
  skeletonCount?: number
}

export const ProfileResults = (props: ProfileResultsProps) => {
  const { limit = 100, ids, skeletonCount = 10 } = props

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
      }
    },
    [dispatch]
  )

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
      {!truncatedIds.length
        ? range(skeletonCount).map((_, i) => (
            <UserCard
              key={`user_card_sekeleton_${i}`}
              id={0}
              size={isMobile ? 'xs' : 's'}
              css={isMobile ? { maxWidth: 320 } : undefined}
              loading={true}
            />
          ))
        : truncatedIds.map((id) => (
            <UserCard
              key={id}
              id={id}
              size={isMobile ? 'xs' : 's'}
              css={isMobile ? { maxWidth: 320 } : undefined}
              onClick={() => handleClick(id)}
              onUserLinkClick={() => handleClick(id)}
            />
          ))}
    </Box>
  )
}

export const ProfileResultsPage = () => {
  const isMobile = useIsMobile()
  const { color } = useTheme()

  const { data: ids, status } = useGetSearchResults('users')
  const isLoading = status === Status.LOADING

  const updateSortParam = useUpdateSearchParams('sortMethod')
  const searchParams = useSearchParams()
  const { sortMethod } = searchParams
  const isResultsEmpty = ids?.length === 0
  const showNoResultsTile = !isLoading && isResultsEmpty

  return (
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
          <Flex gap='s'>
            <OptionsFilterButton
              selection={sortMethod ?? 'relevant'}
              variant='replaceLabel'
              optionsLabel={messages.sortOptionsLabel}
              onChange={updateSortParam}
              options={[
                { label: 'Most Relevant', value: 'relevant' },
                { label: 'Most Recent', value: 'recent' }
              ]}
            />
          </Flex>
        </Flex>
      ) : null}
      {showNoResultsTile ? <NoResultsTile /> : <ProfileResults ids={ids} />}
    </Flex>
  )
}
