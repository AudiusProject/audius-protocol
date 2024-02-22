import { useCallback, useContext, useMemo, useState } from 'react'

import { isContentFollowGated } from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import {
  IconCaretLeft,
  IconCaretRight,
  Text,
  PlainButton
} from '@audius/harmony'
import cn from 'classnames'
import { Form, Formik, FormikProps, useField } from 'formik'
import moment from 'moment'
import { useUnmount } from 'react-use'
import { z } from 'zod'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import { MenuFormCallbackStatus } from 'components/data-entry/ContextualMenu'
import layoutStyles from 'components/layout/layout.module.css'
import { NavigationPrompt } from 'components/navigation-prompt/NavigationPrompt'
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
import { StemsAndDownloadsField } from '../fields/StemsAndDownloadsField'
import { TrackMetadataFields } from '../fields/TrackMetadataFields'
import { defaultHiddenFields } from '../fields/stream-availability/HiddenAvailabilityFields'
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
        const {
          licenseType: ignoredLicenseType,
          is_downloadable: isDownloadable,
          download_conditions: downloadConditions,
          ...restMetadata
        } = metadata
        // Update the download json field based on the isDownloadable flag and the download conditions.
        // Note that this only needs to be done temporarily until the backend is updated to remove the download fields redundancy.
        // TODO: Remove this once the backend is updated to remove the download fields redundancy.
        const download = {
          is_downloadable: isDownloadable,
          requires_follow: isContentFollowGated(downloadConditions),
          cid: null
        }
        return {
          ...track,
          metadata: {
            ...restMetadata,
            is_downloadable: isDownloadable,
            download_conditions: downloadConditions,
            download
          }
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
  const [, , { setValue: setIndex }] = useField('trackMetadatasIndex')
  useUnmount(() => {
    setIndex(0)
  })
  const { isEnabled: isScheduledReleasesEnabled } = useFlag(
    FeatureFlags.SCHEDULED_RELEASES
  )
  const [forceOpenAccessAndSale, setForceOpenAccessAndSale] = useState(false)

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
              <AccessAndSaleField
                isUpload
                forceOpen={forceOpenAccessAndSale}
                setForceOpen={setForceOpenAccessAndSale}
              />
              <AttributionField />
              <StemsAndDownloadsField
                closeMenuCallback={(data) => {
                  if (data === MenuFormCallbackStatus.OPEN_ACCESS_AND_SALE) {
                    setForceOpenAccessAndSale(true)
                  }
                }}
              />
              <RemixSettingsField />
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
      <Text variant='title' size='xs'>
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
      <PlainButton
        iconLeft={IconCaretLeft}
        onClick={goPrev}
        disabled={prevDisabled}
        type='button'
      >
        {messages.prev}
      </PlainButton>
      <PlainButton
        iconRight={IconCaretRight}
        onClick={goNext}
        disabled={nextDisabled}
        type='button'
      >
        {messages.next}
      </PlainButton>
    </div>
  )
}
