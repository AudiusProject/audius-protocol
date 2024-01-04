import { useCallback, useContext, useMemo } from 'react'

import { FeatureFlags } from '@audius/common'
import { HarmonyPlainButton, IconCaretRight } from '@audius/stems'
import cn from 'classnames'
import { Form, Formik, FormikProps, useField } from 'formik'
import moment from 'moment'
import { useUnmount } from 'react-use'
import { z } from 'zod'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import IconCaretLeft from 'assets/img/iconCaretLeft.svg'
import layoutStyles from 'components/layout/layout.module.css'
import { NavigationPrompt } from 'components/navigation-prompt/NavigationPrompt'
import { Text } from 'components/typography'
import { useFlag } from 'hooks/useRemoteConfig'
import { UploadFormScrollContext } from 'pages/upload-page/UploadPage'

import { AnchoredSubmitRow } from '../components/AnchoredSubmitRow'
import { PreviewButton } from '../components/PreviewButton'
import { AccessAndSaleField } from '../fields/AccessAndSaleField'
import { AttributionField } from '../fields/AttributionField'
import { MultiTrackSidebar } from '../fields/MultiTrackSidebar'
import { ReleaseDateField } from '../fields/ReleaseDateField'
import { ReleaseDateFieldLegacy } from '../fields/ReleaseDateFieldLegacy'
import { RemixSettingsField } from '../fields/RemixSettingsField'
import { SourceFilesField } from '../fields/SourceFilesField'
import { TrackMetadataFields } from '../fields/TrackMetadataFields'
import { defaultHiddenFields } from '../fields/availability/HiddenAvailabilityFields'
import { TrackEditFormValues, TrackFormState } from '../types'
import { TrackMetadataFormSchema } from '../validation'

import styles from './EditTrackForm.module.css'

const messages = {
  multiTrackCount: (index: number, total: number) =>
    `TRACK ${index} of ${total}`,
  prev: 'Prev',
  next: 'Next Track',
  preview: 'Preview',
  navigationPrompt: {
    title: 'Discard upload?',
    body: "Are you sure you want to leave this page?\nAny changes you've made will be lost.",
    cancel: 'Cancel',
    proceed: 'Discard'
  }
}

type EditTrackFormProps = {
  formState: TrackFormState
  onContinue: (formState: TrackFormState) => void
}

const EditFormValidationSchema = z.object({
  trackMetadatas: z.array(TrackMetadataFormSchema)
})

export const EditTrackForm = (props: EditTrackFormProps) => {
  const { formState, onContinue } = props
  const { tracks } = formState

  // @ts-ignore - Slight differences in the sdk vs common track metadata types
  const initialValues: TrackEditFormValues = useMemo(
    () => ({
      trackMetadatasIndex: 0,
      tracks,
      trackMetadatas: tracks.map((track) => ({
        ...track.metadata,
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
        stems: [],
        isrc: '',
        iswc: ''
      }))
    }),
    [tracks]
  )
  console.log('tracks: ', tracks, initialValues)

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
  const { values, dirty } = props
  const isMultiTrack = values.trackMetadatas.length > 1
  const trackIdx = values.trackMetadatasIndex
  const [tracksField, , { setValue: setIndex }] = useField('trackMetadatasIndex')
  console.log('asdf tracksField.value: ', tracksField.value)
  useUnmount(() => {
    setIndex(0)
  })
  const { isEnabled: isScheduledReleasesEnabled } = useFlag(
    FeatureFlags.SCHEDULED_RELEASES
  )

  return (
    <Form>
      <NavigationPrompt when={dirty} messages={messages.navigationPrompt} />
      <div className={cn(layoutStyles.row, layoutStyles.gap2)}>
        <div className={cn(styles.formContainer, layoutStyles.col)}>
          {isMultiTrack ? <MultiTrackHeader /> : null}
          <div
            className={cn(
              styles.trackEditForm,
              layoutStyles.col,
              layoutStyles.gap4
            )}
          >
            <TrackMetadataFields />
            <div className={cn(layoutStyles.col, layoutStyles.gap4)}>
              {isScheduledReleasesEnabled ? (
                <ReleaseDateField />
              ) : (
                <ReleaseDateFieldLegacy />
              )}
              <RemixSettingsField />
              <SourceFilesField />
              <AccessAndSaleField isUpload />
              <AttributionField />
            </div>
            <PreviewButton
              // Since edit form is a single component, render a different preview for each track
              key={trackIdx}
              className={styles.previewButton}
              index={trackIdx}
            />
          </div>
          {isMultiTrack ? <MultiTrackFooter /> : null}
        </div>
        {isMultiTrack ? <MultiTrackSidebar /> : null}
      </div>
      {!isMultiTrack ? <AnchoredSubmitRow /> : null}
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
  const scrollToTop = useContext(UploadFormScrollContext)
  const [{ value: index }, , { setValue: setIndex }] = useField(
    'trackMetadatasIndex'
  )
  const [{ value: trackMetadatas }] = useField('trackMetadatas')

  const goPrev = useCallback(() => {
    setIndex(Math.max(index - 1, 0))
    scrollToTop()
  }, [index, scrollToTop, setIndex])
  const goNext = useCallback(() => {
    setIndex(Math.min(index + 1, trackMetadatas.length - 1))
    scrollToTop()
  }, [index, scrollToTop, setIndex, trackMetadatas.length])

  const prevDisabled = index === 0
  const nextDisabled = index === trackMetadatas.length - 1
  return (
    <div className={cn(styles.multiTrackFooter, layoutStyles.row)}>
      <HarmonyPlainButton
        text={messages.prev}
        iconLeft={IconCaretLeft}
        onClick={goPrev}
        disabled={prevDisabled}
        type='button'
      />
      <HarmonyPlainButton
        text={messages.next}
        iconRight={IconCaretRight}
        onClick={goNext}
        disabled={nextDisabled}
        type='button'
      />
    </div>
  )
}
