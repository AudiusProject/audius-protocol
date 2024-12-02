import { useCallback, useMemo } from 'react'

import { TrackForUpload } from '@audius/common/store'
import moment from 'moment'

import { EditTrackForm } from 'components/edit-track/EditTrackForm'
import { TrackEditFormValues } from 'components/edit-track/types'

import { TrackFormState } from '../types'

type UploadTrackFormProps = {
  formState: TrackFormState
  onContinue: (formState: TrackFormState) => void
}

const defaultHiddenFields = {
  genre: true,
  mood: true,
  tags: true,
  share: false,
  play_count: false
  // REMIXES handled by a separate field
}

export const UploadTrackForm = (props: UploadTrackFormProps) => {
  const { formState, onContinue } = props
  const { tracks } = formState

  const initialValues: TrackEditFormValues = useMemo(
    () => ({
      trackMetadatasIndex: 0,
      tracks: tracks as TrackForUpload[],
      trackMetadatas: tracks.map((track) => ({
        ...track.metadata,
        description: '',
        releaseDate: new Date(moment().toString()),
        tags: '',
        field_visibility: {
          ...defaultHiddenFields,
          remixes: true
        },
        stems: [],
        isrc: '',
        iswc: ''
      }))
    }),
    [tracks]
  )

  const onSubmit = useCallback(
    (values: TrackEditFormValues) => {
      const tracksForUpload = tracks.map((track, i) => {
        const metadata = values.trackMetadatas[i]
        return { ...track, metadata }
      })
      onContinue({ ...formState, tracks: tracksForUpload })
    },
    [formState, onContinue, tracks]
  )

  return <EditTrackForm initialValues={initialValues} onSubmit={onSubmit} />
}
