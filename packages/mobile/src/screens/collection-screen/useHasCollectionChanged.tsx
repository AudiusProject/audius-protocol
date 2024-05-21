import { useEffect } from 'react'

import type { ID } from '@audius/common/models'
import { cacheCollectionsSelectors } from '@audius/common/store'
import { isEqual } from 'lodash'
import { useSelector } from 'react-redux'
import { usePrevious } from 'react-use'

const { getCollection } = cacheCollectionsSelectors

export const useHasCollectionChanged = (
  collectionId: ID,
  callback: () => void
) => {
  const trackIds = useSelector((state) =>
    getCollection(state, { id: collectionId })?.playlist_contents.track_ids.map(
      (track: any) => track.track
    )
  )

  const previousTrackIds = usePrevious(trackIds)

  const hasCollectionChanged =
    trackIds && previousTrackIds && !isEqual(trackIds, previousTrackIds)

  useEffect(() => {
    if (hasCollectionChanged) {
      callback()
    }
  }, [hasCollectionChanged, callback])
}
