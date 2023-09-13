import { useContext, useRef } from 'react'

import { UploadType } from '@audius/common'
import { FormikProps } from 'formik'
import { useUnmount } from 'react-use'

import { SubmitRowAnchored } from '../components/SubmitRowAnchored'
import { EditCollectionForm } from '../forms/EditCollectionForm'
import { EditTrackForm } from '../forms/EditTrackForm'
import {
  CollectionFormState,
  TrackEditFormValues,
  TrackFormState,
  UploadFormState
} from '../types'
import { UploadPreviewContext } from '../utils/uploadPreviewContext'

type EditPageProps = {
  formState: TrackFormState | CollectionFormState
  onContinue: (formState: UploadFormState) => void
}

export const EditPage = (props: EditPageProps) => {
  const { formState, onContinue } = props
  const { stopPreview } = useContext(UploadPreviewContext)
  const formRef = useRef<FormikProps<TrackEditFormValues>>(null)
  useUnmount(stopPreview)

  switch (formState.uploadType) {
    case UploadType.INDIVIDUAL_TRACK:
      return (
        <>
          <EditTrackForm
            formState={formState}
            formRef={formRef}
            onContinue={onContinue}
          />
          <SubmitRowAnchored formRef={formRef} />
        </>
      )
    case UploadType.INDIVIDUAL_TRACKS:
      return (
        <EditTrackForm
          formState={formState}
          formRef={formRef}
          onContinue={onContinue}
        />
      )
    case UploadType.ALBUM:
    case UploadType.PLAYLIST:
      return (
        <>
          <EditCollectionForm
            formState={formState}
            formRef={formRef}
            onContinue={onContinue}
          />
          <SubmitRowAnchored formRef={formRef} />
        </>
      )
  }
}
