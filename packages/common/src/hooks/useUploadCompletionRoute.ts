import { useMemo } from 'react'

import { UploadState, UploadType } from '~/store'
import { collectionPage, profilePage } from '~/utils/route'

export const useUploadCompletionRoute = ({
  uploadType,
  upload,
  accountHandle
}: {
  uploadType: UploadType
  upload: UploadState
  accountHandle: string | null
}) => {
  const route = useMemo(() => {
    switch (uploadType) {
      case UploadType.INDIVIDUAL_TRACK:
        return upload.tracks?.[0].metadata.permalink
      case UploadType.ALBUM:
      case UploadType.PLAYLIST:
        return upload.completedEntity
          ? collectionPage(
              null,
              null,
              null,
              upload.completedEntity.permalink,
              uploadType === UploadType.ALBUM
            )
          : ''
      default:
        if (accountHandle && (!upload.tracks || upload.tracks.length > 1)) {
          return profilePage(accountHandle)
        } else {
          return upload.tracks?.[0].metadata.permalink
        }
    }
  }, [upload.completedEntity, upload.tracks, uploadType, accountHandle])
  return route
}
