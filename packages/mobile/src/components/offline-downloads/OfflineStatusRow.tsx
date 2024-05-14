import React from 'react'

import type { ID } from '@audius/common/models'

import { CollectionDownloadStatusRow } from 'app/screens/collection-screen/CollectionDownloadStatusRow'
import { TrackDownloadStatusRow } from 'app/screens/collection-screen/TrackDownloadStatusRow'

interface OfflineStatusRowProps {
  contentId?: ID
  isCollection: boolean
}

export const OfflineStatusRow = (props: OfflineStatusRowProps) => {
  const { contentId, isCollection } = props
  if (!contentId) return null
  return isCollection ? (
    <CollectionDownloadStatusRow collectionId={contentId} />
  ) : (
    <TrackDownloadStatusRow trackId={contentId} />
  )
}
