import { QueryClient } from '@tanstack/react-query'
import { mergeWith } from 'lodash'
import { getContext } from 'typed-redux-saga'

import { ID, Collection } from '~/models'
import { mergeCustomizer } from '~/store/cache/mergeCustomizer'

import { getCollectionQueryKey } from '../collection/useCollection'

type PartialCollectionUpdate = Partial<Collection> & { playlist_id: ID }

export const updateCollectionData = function* (
  partialCollections: PartialCollectionUpdate[]
) {
  const queryClient = yield* getContext<QueryClient>('queryClient')

  partialCollections.forEach((partialCollection) => {
    const { playlist_id } = partialCollection

    queryClient.setQueryData(
      getCollectionQueryKey(playlist_id),
      // TODO: drop the merge customizer once we're fully off of redux
      (prev) => prev && mergeWith({}, prev, partialCollection, mergeCustomizer)
    )
  })
}
