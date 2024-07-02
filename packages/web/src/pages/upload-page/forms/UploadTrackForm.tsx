import { useCallback, useMemo } from 'react'

import { TrackForUpload } from '@audius/common/store'
import moment from 'moment'

import { defaultHiddenFields } from 'components/edit/fields/stream-availability/HiddenAvailabilityFields'
import { EditTrackForm } from 'components/edit-track/EditTrackForm'
import { TrackEditFormValues } from 'components/edit-track/types'

import { TrackFormState } from '../types'

type UploadTrackFormProps = {
  formState: TrackFormState
  onContinue: (formState: TrackFormState) => void
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
        licenseType: {
          allowAttribution: null,
          commercialUse: null,
          derivativeWorks: null
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
        const { licenseType: ignoredLicenseType, ...restMetadata } = metadata
        return {
          ...track,
          metadata: {
            ...restMetadata
          }
        }
      })
      onContinue({ ...formState, tracks: tracksForUpload })
    },
    [formState, onContinue, tracks]
  )

  return <EditTrackForm initialValues={initialValues} onSubmit={onSubmit} />
}
