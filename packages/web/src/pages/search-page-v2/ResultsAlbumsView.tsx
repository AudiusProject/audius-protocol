import { useCallback } from 'react'

import { Status } from '@audius/common/models'
import { searchResultsPageSelectors } from '@audius/common/store'
import { Box, Flex, OptionsFilterButton, Text } from '@audius/harmony'
import { range } from 'lodash'
import { useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom-v5-compat'

import { CollectionCard } from 'components/collection'
import { useRouteMatch } from 'hooks/useRouteMatch'
import { SEARCH_PAGE } from 'utils/route'

import { NoResultsTile } from './NoResultsTile'
import { CategoryView } from './types'
import { useUpdateSearchParams } from './utils'

const { getSearchResults } = searchResultsPageSelectors

const messages = {
  albums: 'Albums',
  sortOptionsLabel: 'Sort By'
}

export const ResultsAlbumsView = () => {
  const results = useSelector(getSearchResults)
  const [urlSearchParams] = useSearchParams()
  const updateSortParam = useUpdateSearchParams('sortMethod')
  const routeMatch = useRouteMatch<{ category: string }>(SEARCH_PAGE)
  const isCategoryActive = useCallback(
    (category: CategoryView) => routeMatch?.category === category,
    [routeMatch]
  )

  const isLoading = results.status === Status.LOADING
  const sortMethod = urlSearchParams.get('sortMethod')
  const albumLimit = isCategoryActive(CategoryView.ALBUMS) ? 100 : 5
  const albumIds = results.albumIds?.slice(0, albumLimit) ?? []

  return (
    <Flex direction='column' gap='xl'>
      <Flex justifyContent='space-between' alignItems='center'>
        <Text variant='heading' textAlign='left'>
          {messages.albums}
        </Text>
        {isCategoryActive(CategoryView.ALBUMS) ? (
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
        ) : null}
      </Flex>
      {!isLoading && (!albumIds || albumIds.length === 0) ? (
        <NoResultsTile />
      ) : (
        <Box
          css={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, 200px)',
            justifyContent: 'space-between',
            gap: 16
          }}
        >
          {isLoading
            ? range(5).map((_, i) => (
                <CollectionCard
                  key={`user_card_sekeleton_${i}`}
                  id={0}
                  size='s'
                  loading={true}
                />
              ))
            : albumIds.map((id) => (
                <CollectionCard key={id} id={id} size='s' />
              ))}
        </Box>
      )}
    </Flex>
  )
}
