import { useCallback, useMemo } from 'react'

import { ExtendedTrackMetadata, Nullable } from '@audius/common'
import { Button, ButtonType, IconArrow } from '@audius/stems'
import { Form, Formik } from 'formik'
import moment from 'moment'
import * as Yup from 'yup'

import PreviewButton from 'components/upload/PreviewButton'

import { TrackMetadataFields } from '../fields/TrackMetadataFields'

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
export type EditFormValues = ExtendedTrackMetadata & {
  releaseDate: moment.Moment
  licenseType: {
    allowAttribution: Nullable<boolean>
    commercialUse: Nullable<boolean>
    derivativeWorks: Nullable<boolean>
  }
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

  const [{ metadata: trackMetadata }] = tracks

  const initialValues: EditFormValues = useMemo(
    () => ({
      ...trackMetadata,
      artwork: null,
      description: '',
      releaseDate: moment().startOf('day'),
      tags: '',
      licenseType: {
        allowAttribution: null,
        commercialUse: null,
        derivativeWorks: null
      }
    }),
    [trackMetadata]
  )

  const onSubmit = useCallback(
    (values: EditFormValues) => {
      setTracks([{ ...tracks[0], metadata: values }])
      onContinue()
    },
    [onContinue, setTracks, tracks]
  )

  return (
    <Formik<EditFormValues>
      initialValues={initialValues}
      onSubmit={onSubmit}
      validationSchema={EditTrackSchema}
    >
      {() => (
        <Form>
          <div className={styles.editForm}>
            <TrackMetadataFields />
            <TrackModalArray />
            <PreviewButton playing={false} onClick={() => {}} />
          </div>
          <div className={styles.continue}>
            <Button
              type={ButtonType.PRIMARY_ALT}
              buttonType='submit'
              text='Continue'
              name='continue'
              rightIcon={<IconArrow />}
              textClassName={styles.continueButtonText}
              className={styles.continueButton}
            />
          </div>
        </Form>
      )}
    </Formik>
  )
}
