import { useCallback, useMemo } from 'react'

import {
  HarmonyButton,
  HarmonyButtonType,
  IconArrow,
  IconCaretRight
} from '@audius/stems'
import cn from 'classnames'
import { Form, Formik, FormikProps, useField } from 'formik'
import moment from 'moment'
import * as Yup from 'yup'

import { ReactComponent as IconCaretLeft } from 'assets/img/iconCaretLeft.svg'
import layoutStyles from 'components/layout/layout.module.css'
import { Text } from 'components/typography'
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
  genreError: 'Genre is required',
  multiTrackCount: (index: number, total: number) =>
    `TRACK ${index} of ${total}`,
  prev: 'Prev',
  next: 'Next Track'
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

  return (
    <Formik<TrackEditFormValues>
      initialValues={initialValues}
      onSubmit={onSubmit}
      validationSchema={EditTrackSchema}
    >
      {TrackEditForm}
    </Formik>
  )
}

const TrackEditForm = (props: FormikProps<TrackEditFormValues>) => {
  const { values } = props
  const isMultiTrack = values.trackMetadatas.length > 1

  return (
    <Form>
      <div className={cn(layoutStyles.row, layoutStyles.gap2)}>
        <div className={styles.formContainer}>
          {isMultiTrack ? <MultiTrackHeader /> : null}
          <div className={styles.trackEditForm}>
            <TrackMetadataFields playing={false} />
            <TrackModalArray />
            <PreviewButton playing={false} onClick={() => {}} />
          </div>
          {isMultiTrack ? <MultiTrackFooter /> : null}
        </div>
        {isMultiTrack ? <MultiTrackSidebar /> : null}
      </div>
      {!isMultiTrack ? (
        <div className={styles.continue}>
          <HarmonyButton
            variant={HarmonyButtonType.PRIMARY}
            text='Continue'
            name='continue'
            iconRight={IconArrow}
            className={styles.continueButton}
          />
        </div>
      ) : null}
    </Form>
  )
}

const MultiTrackHeader = () => {
  const [{ value: index }] = useField('trackMetadatasIndex')
  const [{ value: trackMetadatas }] = useField('trackMetadatas')

  return (
    <div className={styles.multiTrackHeader}>
      <Text variant='title' size='xSmall'>
        {messages.multiTrackCount(index + 1, trackMetadatas.length)}
      </Text>
    </div>
  )
}

const MultiTrackFooter = () => {
  const [{ value: index }, , { setValue: setIndex }] = useField(
    'trackMetadatasIndex'
  )
  const [{ value: trackMetadatas }] = useField('trackMetadatas')

  const goPrev = useCallback(() => {
    setIndex(Math.max(index - 1, 0))
  }, [index, setIndex])
  const goNext = useCallback(() => {
    setIndex(Math.min(index + 1, trackMetadatas.length - 1))
  }, [index, setIndex, trackMetadatas.length])

  const prevDisabled = index === 0
  const nextDisabled = index === trackMetadatas.length - 1
  return (
    <div className={cn(styles.multiTrackFooter, layoutStyles.row)}>
      <HarmonyButton
        className={cn({ [styles.disabled]: prevDisabled })}
        variant={HarmonyButtonType.PLAIN}
        text={messages.prev}
        iconLeft={IconCaretLeft}
        onClick={goPrev}
        disabled={prevDisabled}
      />
      <HarmonyButton
        className={cn({ [styles.disabled]: nextDisabled })}
        variant={HarmonyButtonType.PLAIN}
        text={messages.next}
        iconRight={IconCaretRight}
        onClick={goNext}
        disabled={nextDisabled}
      />
    </div>
  )
}
