import { useCallback, useMemo } from 'react'

import { HarmonyButton, HarmonyButtonType, IconArrow } from '@audius/stems'
import cn from 'classnames'
import { Form, Formik } from 'formik'
import moment from 'moment'
import * as Yup from 'yup'

import layoutStyles from 'components/layout/layout.module.css'
import PreviewButton from 'components/upload/PreviewButton'

import { MultiTrackSidebar } from '../fields/MultiTrackSidebar'
import { TrackMetadataFields } from '../fields/TrackMetadataFields'
import { defaultHiddenFields } from '../fields/availability/HiddenAvailabilityFields'
import { TrackEditFormValues } from '../forms/types'

import styles from './EditPageNew.module.css'
import { TrackModalArray } from './TrackModalArray'
import { TrackForUpload } from './types'

const messages = {
  titleError: 'Your track must have a name',
  artworkError: 'Artwork is required',
  genreError: 'Genre is required'
}

type EditPageProps = {
  tracks: TrackForUpload[]
  setTracks: (tracks: TrackForUpload[]) => void
  onContinue: () => void
}

const EditTrackSchema = Yup.object().shape({
  title: Yup.string().required(messages.titleError),
  artwork: Yup.object({
    url: Yup.string()
  }).required(messages.artworkError),
  trackArtwork: Yup.string().nullable(),
  genre: Yup.string().required(messages.genreError),
  description: Yup.string().max(1000).nullable()
})

export const EditPageNew = (props: EditPageProps) => {
  const { tracks, setTracks, onContinue } = props

  const initialValues: TrackEditFormValues = useMemo(
    () => ({
      trackMetadatasIndex: 0,
      trackMetadatas: tracks.map((track) => ({
        ...track.metadata,
        artwork: null,
        description: '',
        releaseDate: moment().startOf('day'),
        tags: '',
        field_visibility: {
          ...defaultHiddenFields,
          remixes: true
        },
        licenseType: {
          allowAttribution: null,
          commercialUse: null,
          derivativeWorks: null
        }
      }))
    }),
    [tracks]
  )

  const onSubmit = useCallback(
    (values: TrackEditFormValues) => {
      const tracksForUpload: TrackForUpload[] = tracks.map((track, i) => ({
        ...track,
        metadata: values.trackMetadatas[i]
      }))
      setTracks(tracksForUpload)
      onContinue()
    },
    [onContinue, setTracks, tracks]
  )

  const isMultiTrack = tracks.length > 1

  return (
    <Formik<TrackEditFormValues>
      initialValues={initialValues}
      onSubmit={onSubmit}
      validationSchema={EditTrackSchema}
    >
      {() => (
        <Form>
          <div className={cn(layoutStyles.row, layoutStyles.gap2)}>
            <div className={styles.editForm}>
              <TrackMetadataFields playing={false} />
              <TrackModalArray />
              <PreviewButton playing={false} onClick={() => {}} />
            </div>
            {isMultiTrack ? <MultiTrackSidebar tracks={tracks} /> : null}
          </div>
          <div className={styles.continue}>
            <HarmonyButton
              variant={HarmonyButtonType.PRIMARY}
              text='Continue'
              name='continue'
              iconRight={IconArrow}
              className={styles.continueButton}
            />
          </div>
        </Form>
      )}
    </Formik>
  )
}
