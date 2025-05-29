import { QueryClient } from '@tanstack/react-query'
import { mergeWith } from 'lodash'
import { getContext } from 'typed-redux-saga'

import { ID, Collection } from '~/models'
import { mergeCustomizer } from '~/store/cache/mergeCustomizer'

import { getCollectionQueryKey } from '../collection/useCollection'

type PartialCollectionUpdate = Partial<Collection> & { playlist_id: ID }

/**
 * Updates collections with partial data, merging with existing collection data
 * and updating both react-query and redux stores.
 * Gets queryClient and dispatch from context automatically.
 *
 * @example
 * // Update a single collection
 * yield* updateCollectionData([{ playlist_id: '123', _is_publishing: true }])
 *
 * // Update multiple collections
 * yield* updateCollectionData([
 *   { playlist_id: '123', _is_publishing: true },
 *   { playlist_id: '456', _marked_deleted: true }
 * ])
 */
export const updateCollectionData = function* (
  partialCollections: PartialCollectionUpdate[]
) {
  const queryClient = yield* getContext<QueryClient>('queryClient')

  partialCollections.forEach((partialCollection) => {
    const { playlist_id } = partialCollection

    // Update react-query store
    queryClient.setQueryData(
      getCollectionQueryKey(playlist_id),
      // TODO: drop the merge customizer once we're fully off of redux
      (prev) => prev && mergeWith({}, prev, partialCollection, mergeCustomizer)
    )
  })
}
