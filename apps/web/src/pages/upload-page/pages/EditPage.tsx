import { UploadType } from '@audius/common'

import { EditCollectionForm } from '../forms/EditCollectionForm'
import { EditTrackForm } from '../forms/EditTrackForm'
import { CollectionFormState, TrackFormState, UploadFormState } from '../types'

type EditPageProps = {
  formState: TrackFormState | CollectionFormState
  onContinue: (formState: UploadFormState) => void
}

export const EditPage = (props: EditPageProps) => {
  const { formState, onContinue } = props
  switch (formState.uploadType) {
    case UploadType.INDIVIDUAL_TRACK:
    case UploadType.INDIVIDUAL_TRACKS:
      return <EditTrackForm formState={formState} onContinue={onContinue} />
    case UploadType.ALBUM:
    case UploadType.PLAYLIST:
      return (
        <EditCollectionForm formState={formState} onContinue={onContinue} />
      )
  }
}
