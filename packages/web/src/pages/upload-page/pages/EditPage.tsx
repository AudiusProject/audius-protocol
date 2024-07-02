import { useContext } from 'react'

import { UploadType } from '@audius/common/store'
import { useUnmount } from 'react-use'

import { UploadPreviewContext } from 'components/edit-track/utils/uploadPreviewContext'

import { UploadCollectionForm } from '../forms/UploadCollectionForm'
import { UploadTrackForm } from '../forms/UploadTrackForm'
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
      return <UploadTrackForm formState={formState} onContinue={onContinue} />
    case UploadType.ALBUM:
    case UploadType.PLAYLIST:
      return (
        <UploadCollectionForm formState={formState} onContinue={onContinue} />
      )
  }
}
