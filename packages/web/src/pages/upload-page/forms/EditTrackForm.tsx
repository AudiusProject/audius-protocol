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
import { z } from 'zod'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import { ReactComponent as IconCaretLeft } from 'assets/img/iconCaretLeft.svg'
import layoutStyles from 'components/layout/layout.module.css'
import { Text } from 'components/typography'
import PreviewButton from 'components/upload/PreviewButton'

import { AccessAndSaleField } from '../fields/AccessAndSaleField'
import { AttributionField } from '../fields/AttributionField'
import { MultiTrackSidebar } from '../fields/MultiTrackSidebar'
import { ReleaseDateField } from '../fields/ReleaseDateField'
import { RemixSettingsField } from '../fields/RemixSettingsField'
import { SourceFilesField } from '../fields/SourceFilesField'
import { TrackMetadataFields } from '../fields/TrackMetadataFields'
import { defaultHiddenFields } from '../fields/availability/HiddenAvailabilityFields'
import { TrackEditFormValues, TrackFormState } from '../types'
import { TrackMetadataSchema } from '../validation'

import styles from './EditTrackForm.module.css'

const messages = {
  titleError: 'Your track must have a name',
  artworkError: 'Artwork is required',
  genreError: 'Genre is required',
  multiTrackCount: (index: number, total: number) =>
    `TRACK ${index} of ${total}`,
  prev: 'Prev',
  next: 'Next Track'
}

type EditTrackFormProps = {
  formState: TrackFormState
  onContinue: (formState: TrackFormState) => void
}

const EditFormValidationSchema = z.object({
  trackMetadatas: z.array(TrackMetadataSchema)
})

export const EditTrackForm = (props: EditTrackFormProps) => {
  const { formState, onContinue } = props
  const { tracks } = formState

  // @ts-ignore - Slight differences in the sdk vs common track metadata types
  const initialValues: TrackEditFormValues = useMemo(
    () => ({
      trackMetadatasIndex: 0,
      trackMetadatas: tracks.map((track) => ({
        ...track.metadata,
        artwork: null,
        description: '',
        releaseDate: new Date(moment().startOf('day').toString()),
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
        stems: []
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
          metadata: { ...restMetadata }
        }
      })
      onContinue({ ...formState, tracks: tracksForUpload })
    },
    [formState, onContinue, tracks]
  )

  return (
    <Formik<TrackEditFormValues>
      initialValues={initialValues}
      onSubmit={onSubmit}
      // @ts-expect-error issue with track types
      validationSchema={toFormikValidationSchema(EditFormValidationSchema)}
    >
      {(props) => <TrackEditForm {...props} />}
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
            <TrackMetadataFields />
            <div className={cn(layoutStyles.col, layoutStyles.gap4)}>
              <ReleaseDateField />
              <RemixSettingsField />
              <SourceFilesField />
              <AccessAndSaleField />
              <AttributionField />
            </div>
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
        type='button'
      />
      <HarmonyButton
        className={cn({ [styles.disabled]: nextDisabled })}
        variant={HarmonyButtonType.PLAIN}
        text={messages.next}
        iconRight={IconCaretRight}
        onClick={goNext}
        disabled={nextDisabled}
        type='button'
      />
    </div>
  )
}
