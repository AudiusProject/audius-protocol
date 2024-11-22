import { useCallback, useContext, useEffect, useState } from 'react'

import { useFeatureFlag } from '@audius/common/hooks'
import { TrackMetadataFormSchema } from '@audius/common/schemas'
import { FeatureFlags } from '@audius/common/services'
import {
  TrackMetadataForUpload,
  useEarlyReleaseConfirmationModal,
  useHideContentConfirmationModal,
  usePublishConfirmationModal
} from '@audius/common/store'
import {
  IconCaretLeft,
  IconCaretRight,
  Text,
  PlainButton
} from '@audius/harmony'
import cn from 'classnames'
import { Form, Formik, FormikProps, useField } from 'formik'
import { useUnmount } from 'react-use'
import { z } from 'zod'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import { MenuFormCallbackStatus } from 'components/data-entry/ContextualMenu'
import { AnchoredSubmitRow } from 'components/edit/AnchoredSubmitRow'
import { AnchoredSubmitRowEdit } from 'components/edit/AnchoredSubmitRowEdit'
import { AdvancedField } from 'components/edit/fields/AdvancedField'
import { MultiTrackSidebar } from 'components/edit/fields/MultiTrackSidebar'
import { ReleaseDateField } from 'components/edit/fields/ReleaseDateField'
import { RemixSettingsField } from 'components/edit/fields/RemixSettingsField'
import { StemsAndDownloadsField } from 'components/edit/fields/StemsAndDownloadsField'
import { TrackMetadataFields } from 'components/edit/fields/TrackMetadataFields'
import { PriceAndAudienceField } from 'components/edit/fields/price-and-audience/PriceAndAudienceField'
import { VisibilityField } from 'components/edit/fields/visibility/VisibilityField'
import {
  UploadPreviewContextProvider,
  UploadPreviewContext
} from 'components/edit-track/utils/uploadPreviewContext'
import { FileReplaceContainer } from 'components/file-replace-container/FileReplaceContainer'
import layoutStyles from 'components/layout/layout.module.css'
import { NavigationPrompt } from 'components/navigation-prompt/NavigationPrompt'
import { EditFormScrollContext } from 'pages/edit-page/EditTrackPage'
import { processFiles } from 'pages/upload-page/store/utils/processFiles'
import { removeNullable } from 'utils/typeUtils'

import styles from './EditTrackForm.module.css'
import { PreviewButton } from './components/PreviewButton'
import { getTrackFieldName } from './hooks'
import { TrackEditFormValues } from './types'

const formId = 'edit-track-form'

const messages = {
  multiTrackCount: (index: number, total: number) =>
    `TRACK ${index} of ${total}`,
  prev: 'Prev',
  next: 'Next Track',
  preview: 'Preview',
  uploadNavigationPrompt: {
    title: 'Discard upload?',
    body: "Are you sure you want to leave this page?\nAny changes you've made will be lost.",
    cancel: 'Cancel',
    proceed: 'Discard'
  },
  editNavigationPrompt: {
    title: 'Discard Edit?',
    body: "Are you sure you want to leave this page?\nAny changes you've made will be lost.",
    cancel: 'Cancel',
    proceed: 'Discard'
  },
  untitled: 'Untitled'
}

type EditTrackFormProps = {
  initialValues: TrackEditFormValues
  onSubmit: (values: TrackEditFormValues) => void
  hideContainer?: boolean
  disableNavigationPrompt?: boolean
}

const EditFormValidationSchema = z.object({
  trackMetadatas: z.array(TrackMetadataFormSchema)
})

export const EditTrackForm = (props: EditTrackFormProps) => {
  const { initialValues, onSubmit, hideContainer, disableNavigationPrompt } =
    props
  const initialTrackValues = initialValues.trackMetadatas[0] ?? {}
  const isUpload = initialTrackValues.track_id === undefined
  const initiallyHidden = initialTrackValues.is_unlisted
  const isInitiallyScheduled = initialTrackValues.is_scheduled_release

  const { onOpen: openHideContentConfirmation } =
    useHideContentConfirmationModal()
  const { onOpen: openEarlyReleaseConfirmation } =
    useEarlyReleaseConfirmationModal()
  const { onOpen: openPublishConfirmation } = usePublishConfirmationModal()

  const handleSubmit = useCallback(
    (values: TrackEditFormValues) => {
      const confirmCallback = () => {
        onSubmit(values)
      }

      const usersMayLoseAccess =
        !isUpload && !initiallyHidden && values.trackMetadatas[0].is_unlisted
      const isToBePublished =
        !isUpload && initiallyHidden && !values.trackMetadatas[0].is_unlisted
      if (usersMayLoseAccess) {
        openHideContentConfirmation({ confirmCallback })
      } else if (isToBePublished && isInitiallyScheduled) {
        openEarlyReleaseConfirmation({ contentType: 'track', confirmCallback })
      } else if (isToBePublished) {
        openPublishConfirmation({ contentType: 'track', confirmCallback })
      } else {
        onSubmit(values)
      }
    },
    [
      onSubmit,
      initiallyHidden,
      isUpload,
      isInitiallyScheduled,
      openHideContentConfirmation,
      openEarlyReleaseConfirmation,
      openPublishConfirmation
    ]
  )

  return (
    <UploadPreviewContextProvider>
      <Formik<TrackEditFormValues>
        initialValues={initialValues}
        onSubmit={handleSubmit}
        validationSchema={toFormikValidationSchema(EditFormValidationSchema)}
      >
        {(props) => (
          <>
            <TrackEditForm
              {...props}
              hideContainer={hideContainer}
              disableNavigationPrompt={disableNavigationPrompt}
              updatedArtwork={initialTrackValues.artwork}
            />
          </>
        )}
      </Formik>
    </UploadPreviewContextProvider>
  )
}

const TrackEditForm = (
  props: FormikProps<TrackEditFormValues> & {
    hideContainer?: boolean
    disableNavigationPrompt?: boolean
    updatedArtwork?: TrackMetadataForUpload['artwork']
  }
) => {
  const {
    values,
    dirty,
    isSubmitting,
    disableNavigationPrompt = false,
    hideContainer = false,
    updatedArtwork
  } = props
  const isMultiTrack = values.trackMetadatas.length > 1
  const isUpload = values.trackMetadatas[0].track_id === undefined
  const trackIdx = values.trackMetadatasIndex
  const [, , { setValue: setIndex }] = useField('trackMetadatasIndex')
  useUnmount(() => {
    setIndex(0)
  })
  const [forceOpenAccessAndSale, setForceOpenAccessAndSale] = useState(false)
  const { playingPreviewIndex, togglePreview } =
    useContext(UploadPreviewContext)
  const isPreviewPlaying = playingPreviewIndex === trackIdx

  const { isEnabled: isHiddenPaidScheduledEnabled } = useFeatureFlag(
    FeatureFlags.HIDDEN_PAID_SCHEDULED
  )
  const { isEnabled: isTrackAudioReplaceEnabled } = useFeatureFlag(
    FeatureFlags.TRACK_AUDIO_REPLACE
  )

  const [{ value: track }, , { setValue: setTrackValue }] = useField(
    `tracks.${trackIdx}`
  )
  const [, { touched: isTitleDirty }, { setValue: setTitle }] = useField(
    getTrackFieldName(trackIdx, 'title')
  )
  const [, { touched: isArtworkDirty }, { setValue: setArtworkValue }] =
    useField(getTrackFieldName(0, 'artwork'))
  const [, , { setValue: setOrigFilename }] = useField(
    getTrackFieldName(trackIdx, 'orig_filename')
  )

  const handleTogglePreview = useCallback(() => {
    togglePreview(track.preview, trackIdx)
  }, [togglePreview, trackIdx, track])

  const getArtworkUrl = (artwork: typeof updatedArtwork) => {
    if (!artwork) return undefined
    if ('url' in artwork) return artwork.url
    // For the case where it's a record of sizes, we can return undefined
    // or potentially return one of the size URLs if needed
    return undefined
  }
  const fileName = values.trackMetadatas[trackIdx].orig_filename

  useEffect(() => {
    setArtworkValue(updatedArtwork)
    // Url is the only thing that we care about changing inside artwork or else
    // we will listen to all changes from the user, rather than just a new image from
    // the backend.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getArtworkUrl(updatedArtwork), setArtworkValue])

  const onClickReplace = useCallback(
    async (file: File) => {
      const processedFiles = await Promise.all(
        processFiles([file], (name, reason) => {
          console.error('Failed to process file', name, 'due to', reason)
          // todo: show error state
        })
      )

      const files = processedFiles.filter(removeNullable)
      if (files.length > 0) {
        const newFile = files[0]

        if (isUpload && !isTitleDirty) {
          setTitle(newFile.metadata.title.split('.').shift())
        }
        if (isUpload && !isArtworkDirty && newFile.metadata.artwork.file) {
          setArtworkValue(newFile.metadata.artwork)
        }
        setTrackValue(newFile)
        setOrigFilename(newFile.metadata.orig_filename)
      }
    },
    [
      isArtworkDirty,
      isTitleDirty,
      isUpload,
      setArtworkValue,
      setOrigFilename,
      setTitle,
      setTrackValue
    ]
  )

  const onClickDownload = useCallback(() => {
    if (!track.file) return

    const url = URL.createObjectURL(track.file)
    const link = document.createElement('a')
    link.href = url
    link.download = track.file.name || 'download'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [track.file])

  return (
    <Form id={formId}>
      <NavigationPrompt
        when={dirty && !isSubmitting && !disableNavigationPrompt}
        messages={
          isUpload
            ? messages.uploadNavigationPrompt
            : messages.editNavigationPrompt
        }
      />
      <div className={cn(layoutStyles.row, layoutStyles.gap2)}>
        <div
          className={cn(
            { [styles.formContainer]: !hideContainer },
            layoutStyles.col
          )}
        >
          {isMultiTrack ? <MultiTrackHeader /> : null}
          <div
            className={cn(
              { [styles.trackEditForm]: !hideContainer },
              layoutStyles.col,
              layoutStyles.gap4
            )}
          >
            {/* TODO: Remove the isUpload part when the other half of the work is done */}
            {isTrackAudioReplaceEnabled && isUpload ? (
              <FileReplaceContainer
                fileName={fileName || messages.untitled}
                onTogglePlay={handleTogglePreview}
                isPlaying={isPreviewPlaying}
                onClickReplace={onClickReplace}
                onClickDownload={onClickDownload}
                downloadEnabled={!isUpload}
              />
            ) : null}
            <TrackMetadataFields />
            <div className={cn(layoutStyles.col, layoutStyles.gap4)}>
              {isHiddenPaidScheduledEnabled ? (
                <VisibilityField entityType='track' isUpload={isUpload} />
              ) : (
                <ReleaseDateField />
              )}
              <PriceAndAudienceField
                isUpload={isUpload}
                forceOpen={forceOpenAccessAndSale}
                setForceOpen={setForceOpenAccessAndSale}
              />
              <AdvancedField isUpload={isUpload} />
              <StemsAndDownloadsField
                isUpload={isUpload}
                closeMenuCallback={(data) => {
                  if (data === MenuFormCallbackStatus.OPEN_ACCESS_AND_SALE) {
                    setForceOpenAccessAndSale(true)
                  }
                }}
              />
              <RemixSettingsField isUpload={isUpload} />
            </div>
            {!isTrackAudioReplaceEnabled && isUpload ? (
              <PreviewButton
                // Since edit form is a single component, render a different preview for each track
                key={trackIdx}
                className={styles.previewButton}
                index={trackIdx}
              />
            ) : null}
          </div>
          {isMultiTrack ? <MultiTrackFooter /> : null}
        </div>
        {isMultiTrack ? <MultiTrackSidebar /> : null}
      </div>
      {isUpload ? (
        !isMultiTrack ? (
          <AnchoredSubmitRow />
        ) : null
      ) : (
        <AnchoredSubmitRowEdit />
      )}
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
  const scrollToTop = useContext(EditFormScrollContext)
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
