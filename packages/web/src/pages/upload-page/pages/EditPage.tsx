import { useContext } from 'react'

import { UploadType } from '@audius/common/store'
import { useUnmount } from 'react-use'

import { UploadPreviewContext } from 'components/edit-track/utils/uploadPreviewContext'

import { EditCollectionFormForUpload } from '../forms/EditCollectionFormForUpload'
import { EditTrackFormForUpload } from '../forms/EditTrackFormForUpload'
import { CollectionFormState, TrackFormState, UploadFormState } from '../types'

type EditPageProps = {
  formState: TrackFormState | CollectionFormState
  onContinue: (formState: UploadFormState) => void
}

export const EditPage = (props: EditPageProps) => {
  const { formState, onContinue } = props
  const { stopPreview } = useContext(UploadPreviewContext)
  useUnmount(stopPreview)

  switch (formState.uploadType) {
    case UploadType.INDIVIDUAL_TRACK:
    case UploadType.INDIVIDUAL_TRACKS:
      return (
        <EditTrackFormForUpload formState={formState} onContinue={onContinue} />
      )
    case UploadType.ALBUM:
    case UploadType.PLAYLIST:
      return (
        <EditCollectionFormForUpload
          formState={formState}
          onContinue={onContinue}
        />
      )
  }
}
