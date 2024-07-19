import { useCallback } from 'react'

import { ID, Kind, Status } from '@audius/common/models'
import { searchActions } from '@audius/common/store'
import { Box, Flex, OptionsFilterButton, Text } from '@audius/harmony'
import { range } from 'lodash'
import { useDispatch } from 'react-redux'

import { CollectionCard } from 'components/collection'
import { useIsMobile } from 'hooks/useIsMobile'

import { NoResultsTile } from '../NoResultsTile'
import {
  useGetSearchResults,
  useSearchParams,
  useUpdateSearchParams
} from '../utils'

const { addItem: addRecentSearch } = searchActions

const messages = {
  albums: 'Albums',
  sortOptionsLabel: 'Sort By'
}

type AlbumResultsProps = {
  ids: ID[]
  limit?: number
  skeletonCount?: number
}

export const AlbumResults = (props: AlbumResultsProps) => {
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
              kind: Kind.COLLECTIONS,
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
    >
      {!truncatedIds.length
        ? range(skeletonCount).map((_, i) => (
            <CollectionCard
              key={`user_card_sekeleton_${i}`}
              id={0}
              size={isMobile ? 'xs' : 's'}
              css={isMobile ? { maxWidth: 320 } : undefined}
              loading={true}
            />
          ))
        : truncatedIds.map((id) => (
            <CollectionCard
              key={id}
              id={id}
              size={isMobile ? 'xs' : 's'}
              css={isMobile ? { maxWidth: 320 } : undefined}
              onClick={() => handleClick(id)}
              onCollectionLinkClick={() => handleClick(id)}
            />
          ))}
    </Box>
  )
}

export const AlbumResultsPage = () => {
  const isMobile = useIsMobile()

  const { data: ids, status } = useGetSearchResults('albums')
  const isLoading = status === Status.LOADING

  const searchParams = useSearchParams()
  const { sortMethod } = searchParams
  const updateSortParam = useUpdateSearchParams('sortMethod')

  const isResultsEmpty = ids?.length === 0
  const showNoResultsTile = !isLoading && isResultsEmpty

  return (
    <Flex direction='column' gap='xl'>
      {!isMobile ? (
        <Flex justifyContent='space-between' alignItems='center'>
          <Text variant='heading' textAlign='left'>
            {messages.albums}
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
      {showNoResultsTile ? <NoResultsTile /> : <AlbumResults ids={ids} />}
    </Flex>
  )
}