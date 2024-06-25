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
  playlists: 'Playlists',
  // layoutOptionsLabel: 'View As',
  sortOptionsLabel: 'Sort By'
}

export const ResultsPlaylistsView = () => {
  // const [playlistsLayout, setPlaylistsLayout] = useState<ViewLayout>('grid')
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
  const playlistLimit = isCategoryActive(CategoryView.PLAYLISTS) ? 100 : 5
  const playlistIds = results.playlistIds?.slice(0, playlistLimit) ?? []

  // const playlistsLineupProps = useLineupProps({
  //   actions: searchResultsPagePlaylistsLineupActions,
  //   getLineupSelector: getSearchPlaylistsLineup,
  //   variant: LineupVariant.PLAYLIST,
  //   numPlaylistSkeletonRows: 5,
  //   scrollParent: containerRef.current!,
  //   isOrdered: true
  // })

  return (
    <Flex direction='column' gap='xl'>
      <Flex justifyContent='space-between' alignItems='center'>
        <Text variant='heading' textAlign='left'>
          {messages.playlists}
        </Text>
        {isCategoryActive(CategoryView.PLAYLISTS) ? (
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
            {/* <OptionsFilterButton */}
            {/*   selection={playlistsLayout} */}
            {/*   variant='replaceLabel' */}
            {/*   optionsLabel={messages.layoutOptionsLabel} */}
            {/*   onChange={(value) => { */}
            {/*     setPlaylistsLayout(value as ViewLayout) */}
            {/*   }} */}
            {/*   options={viewLayoutOptions} */}
            {/* /> */}
          </Flex>
        ) : null}
      </Flex>
      {!isLoading && (!playlistIds || playlistIds.length === 0) ? (
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
            : playlistIds.map((id) => (
                <CollectionCard key={id} id={id} size='s' />
              ))}
        </Box>
      )}
    </Flex>
  )
}
