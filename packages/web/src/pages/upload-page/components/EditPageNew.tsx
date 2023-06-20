import { useCallback } from 'react'

import { ExtendedTrackMetadata, Nullable } from '@audius/common'
import { Button, ButtonType, IconArrow } from '@audius/stems'
import { Formik } from 'formik'
import moment from 'moment'
import * as Yup from 'yup'

import PreviewButton from 'components/upload/PreviewButton'

import TrackMetadataFields from '../fields/TrackMetadataFields'

import styles from './EditPageNew.module.css'
import { TrackModalArray } from './TrackModalArray'
import { TrackForUpload } from './types'

type EditPageProps = {
  tracks: TrackForUpload[]
  setTracks: (tracks: TrackForUpload[]) => void
  onContinue: () => void
}
export type FormValues = ExtendedTrackMetadata & {
  releaseDate: moment.Moment
  licenseType: {
    allowAttribution: Nullable<boolean>
    commercialUse: Nullable<boolean>
    derivativeWorks: Nullable<boolean>
  }
}

const EditTrackSchema = Yup.object().shape({
  title: Yup.string().required('Required'),
  artwork: Yup.object({
    url: Yup.string()
  })
    // .when('trackArtwork', {
    //   is: undefined,
    //   then: Yup.object().required('Required').nullable()
    // })
    .nullable(),
  trackArtwork: Yup.string().nullable(),
  //   genre: Yup.string().required('Required'),
  genre: Yup.string(),
  description: Yup.string().max(1000).nullable()
})

export const EditPageNew = (props: EditPageProps) => {
  const { tracks, setTracks, onContinue } = props

  const initialValues: FormValues = {
    ...tracks[0].metadata,
    artwork: null,
    releaseDate: moment().startOf('day'),
    licenseType: {
      allowAttribution: null,
      commercialUse: null,
      derivativeWorks: null
    }
  }

  const onSubmit = useCallback(
    (values: FormValues) => {
      setTracks([{ ...tracks[0], metadata: values }])
      onContinue()
    },
    [onContinue, setTracks, tracks]
  )

  return (
    <Formik<FormValues>
      initialValues={initialValues}
      onSubmit={onSubmit}
      validationSchema={EditTrackSchema}
    >
      {(formikProps) => (
        <>
          <div className={styles.editForm}>
            <TrackMetadataFields playing={false} type='track' />
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
              onClick={() => formikProps.handleSubmit()}
              textClassName={styles.continueButtonText}
              className={styles.continueButton}
            />
          </div>
        </>
      )}
    </Formik>
  )
}
