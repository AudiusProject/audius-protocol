import { useCallback, useMemo } from 'react'

import moment from 'moment'

import { EditTrackForm } from 'components/edit-track/EditTrackForm'
// TODO: maybe move this to a shared location
import { TrackEditFormValues } from 'components/edit-track/types'

import { defaultHiddenFields } from '../../../components/edit/fields/stream-availability/HiddenAvailabilityFields'
import { TrackFormState } from '../types'

type EditTrackFormProps = {
  formState: TrackFormState
  onContinue: (formState: TrackFormState) => void
}

export const EditTrackFormForUpload = (props: EditTrackFormProps) => {
  const { formState, onContinue } = props
  const { tracks } = formState

  const initialValues: TrackEditFormValues = useMemo(
    () => ({
      trackMetadatasIndex: 0,
      tracks,
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
