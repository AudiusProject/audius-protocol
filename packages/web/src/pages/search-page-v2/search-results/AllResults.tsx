import { useRef } from 'react'

import { Status } from '@audius/common/models'
import { SearchKind } from '@audius/common/store'
import { Flex } from '@audius/harmony/src/components/layout'

import { useIsMobile } from 'hooks/useIsMobile'

import { NoResultsTile } from '../NoResultsTile'
import { useGetSearchResults } from '../utils'

import { TrackResults } from './TrackResults'

export const AllResults = () => {
  const isMobile = useIsMobile()
  const containerRef = useRef<HTMLDivElement>(null)

  const { data, status } = useGetSearchResults('all')
  const isLoading = status === Status.LOADING

  const isResultsEmpty =
    data &&
    data.albums?.length === 0 &&
    data.users?.length === 0 &&
    data.playlists?.length === 0 &&
    data.tracks?.length === 0

  const showNoResultsTile = !isLoading && isResultsEmpty

  if (showNoResultsTile) return <NoResultsTile />

  return (
    <Flex
      direction='column'
      gap='unit10'
      p={isMobile ? 'm' : undefined}
      ref={containerRef}
    >
      <TrackResults viewLayout='grid' category={SearchKind.ALL} />
    </Flex>
  )
}
