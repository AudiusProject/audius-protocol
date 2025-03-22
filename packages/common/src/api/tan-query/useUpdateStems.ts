import { useMutation } from '@tanstack/react-query'
import { useDispatch, useStore } from 'react-redux'

import { ID } from '~/models/Identifiers'
import { StemUpload, StemUploadWithFile } from '~/models/Stems'
import { Stem } from '~/models/Track'
import { deleteTrack } from '~/store/cache/tracks/actions'
import { CommonState } from '~/store/commonStore'
import { stemsUploadActions } from '~/store/stems-upload'
import { getCurrentUploads } from '~/store/stems-upload/selectors'
import { uuid } from '~/utils/uid'

const { startStemUploads } = stemsUploadActions

export type UpdateStemsArgs = {
  trackId: ID
  existingStems: Stem[] | undefined
  updatedStems: Array<StemUpload | StemUploadWithFile> | undefined
}

/**
 * Hook for updating stems on a track, handling both additions and removals
 */
export const useUpdateStems = () => {
  const dispatch = useDispatch()
  const store = useStore()

  return useMutation({
    mutationFn: async ({
      trackId,
      existingStems,
      updatedStems
    }: UpdateStemsArgs) => {
      const inProgressStemUploads = getCurrentUploads(
        store.getState() as CommonState,
        trackId
      )

      // Find stems that need to be added (new stems)
      const addedStems = updatedStems?.filter((stem) => {
        return !existingStems?.find((existingStem) => {
          return existingStem.track_id === stem.metadata.track_id
        })
      })

      // Filter to only stems that have files to upload
      const addedStemsWithFiles = addedStems?.filter(
        (stem) => 'file' in stem
      ) as StemUploadWithFile[]

      // Start uploads for new stems with files
      if (addedStemsWithFiles.length > 0) {
        dispatch(
          startStemUploads({
            parentId: trackId,
            uploads: addedStemsWithFiles,
            batchUID: uuid()
          })
        )
      }

      // Find stems that need to be removed
      const removedStems = existingStems
        ?.filter((existingStem) => {
          return !updatedStems?.find(
            (stem) => stem.metadata.track_id === existingStem.track_id
          )
        })
        .filter((existingStem) => {
          return !inProgressStemUploads.find(
            (upload) => upload.metadata.track_id === existingStem.track_id
          )
        })

      // Delete removed stems
      for (const stem of removedStems ?? []) {
        dispatch(deleteTrack(stem.track_id))
      }
    }
  })
}
