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
  playlists: 'Playlists',
  // layoutOptionsLabel: 'View As',
  sortOptionsLabel: 'Sort By'
}

type PlaylistResultsProps = {
  ids: ID[]
  limit?: number
  skeletonCount?: number
}

export const PlaylistResults = (props: PlaylistResultsProps) => {
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

export const PlaylistResultsPage = () => {
  // const [playlistsLayout, setPlaylistsLayout] = useState<ViewLayout>('grid')

  const isMobile = useIsMobile()

  const { data, status } = useGetSearchResults('playlists')
  const isLoading = status === Status.LOADING

  const searchParams = useSearchParams()
  const { sortMethod } = searchParams
  const updateSortParam = useUpdateSearchParams('sortMethod')

  const isResultsEmpty = data?.length === 0
  const showNoResultsTile = !isLoading && isResultsEmpty

  const ids = data?.map(({ playlist_id: id }) => id)

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
      {!isMobile ? (
        <Flex justifyContent='space-between' alignItems='center'>
          <Text variant='heading' textAlign='left'>
            {messages.playlists}
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
        </Flex>
      ) : null}
      {showNoResultsTile ? <NoResultsTile /> : <PlaylistResults ids={ids} />}
    </Flex>
  )
}
