import { Status } from '@audius/common/models'

import { Flex } from '@audius/harmony-native'
import { CollectionList } from 'app/components/collection-list/CollectionList'

import { useGetSearchResults } from '../searchState'

export const PlaylistResults = () => {
  const { data, status } = useGetSearchResults('playlists')
  return (
    <Flex h='100%' backgroundColor='default' pt='m'>
      <CollectionList
        isLoading={status === Status.LOADING}
        collection={data as any[]}
      />
    </Flex>
  )
}
