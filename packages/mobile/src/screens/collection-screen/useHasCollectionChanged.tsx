import { useEffect } from 'react'

import { useCollection } from '@audius/common/api'
import type { ID } from '@audius/common/models'
import { isEqual } from 'lodash'
import { usePrevious } from 'react-use'

export const useHasCollectionChanged = (
  collectionId: ID,
  callback: () => void
) => {
  const { data: collectionTrackIds } = useCollection(collectionId, {
    select: (collection) =>
      collection?.playlist_contents.track_ids.map((track) => track.track)
  })

  const previousTrackIds = usePrevious(collectionTrackIds)

  const hasCollectionChanged =
    collectionTrackIds &&
    previousTrackIds &&
    !isEqual(collectionTrackIds, previousTrackIds)

  useEffect(() => {
    if (hasCollectionChanged) {
      callback()
    }
  }, [hasCollectionChanged, callback])
}
