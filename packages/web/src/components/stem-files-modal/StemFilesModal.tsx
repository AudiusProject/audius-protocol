import { useCallback } from 'react'

import {
  StemCategory,
  stemCategoryFriendlyNames,
  StemUpload,
  Download
} from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import {
  Modal,
  Flex,
  Box,
  Text as HarmonyText,
  Switch,
  IconRemove
} from '@audius/harmony'
import { Button, ButtonSize, ButtonType, IconButton } from '@audius/stems'
import cn from 'classnames'

import { Divider } from 'components/divider'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import Dropdown from 'components/navigation/Dropdown'
import { Dropzone } from 'components/upload/Dropzone'
import { TrackPreviewNew } from 'components/upload/TrackPreviewNew'
import { getFeatureEnabled } from 'services/remote-config/featureFlagHelpers'
import { stemDropdownRows } from 'utils/stems'

import styles from './StemFilesModal.module.css'

const MAX_ROWS = 10

const messages = {
  title: 'STEMS & DOWNLOADS',
  additionalFiles: 'UPLOAD ADDITIONAL FILES',
  description:
    'Upload your stems and source files to allow fans to remix your track. This does not affect users ability to listen offline.',
  allowDownloads: 'Allow Full Track Download',
  allowDownloadsDescription:
    'Allow your fans to download a copy of your full track.',
  requireFollowToDownload: 'Require Follow to Download',
  provideLosslessFiles: 'Provide Lossless Files',
  provideLosslessFilesDescription:
    'Provide your fans with the Lossless files you upload in addition to an mp3.',
  done: 'DONE',
  maxCapacity: 'Reached upload limit of 10 files.',
  stemTypeHeader: 'Select Stem Type',
  stemTypeDescription: 'Please select a stem type for each of your files.'
}

const defaultDownloadSettings: Download = {
  is_downloadable: false,
  requires_follow: false,
  cid: null
}

type StemRowProps = {
  stem: StemUpload
  didSelectCategory: (category: StemCategory) => void
  onDelete: () => void
}

const StemRow = ({
  stem: { category, metadata, allowCategorySwitch, allowDelete },
  didSelectCategory,
  onDelete
}: StemRowProps) => {
  const onSelectIndex = (index: number) => {
    const cat = stemDropdownRows[index]
    didSelectCategory(cat)
  }

  let stemIndex = stemDropdownRows.findIndex((r) => r === category)
  if (stemIndex === -1) {
    console.error(`Couldn't find stem row for category: ${category}`)
    stemIndex = 0
  }

  const renderDeleteButton = () => {
    return (
      <div className={styles.deleteButton}>
        {allowDelete ? (
          <IconButton
            aria-label='delete'
            className={styles.deleteButtonIcon}
            onClick={() => {
              if (!allowDelete) return
              onDelete()
            }}
            icon={<IconRemove />}
          />
        ) : (
          <LoadingSpinner />
        )}
      </div>
    )
  }

  return (
    <div className={styles.stemRowContainer}>
      <div className={styles.dropdownContainer}>
        <Dropdown
          size='medium'
          menu={{
            items: stemDropdownRows.map((r) => ({
              text: stemCategoryFriendlyNames[r]
            }))
          }}
          variant='border'
          onSelectIndex={onSelectIndex}
          defaultIndex={stemIndex}
          disabled={!allowCategorySwitch}
          textClassName={styles.dropdownText}
        />
      </div>
      <div className={styles.title}>{metadata.title}</div>
      {renderDeleteButton()}
    </div>
  )
}

type StemFilesViewProps = {
  onAddStems: (stems: any) => void
  stems: StemUpload[]
  onSelectCategory: (category: StemCategory, index: number) => void
  onDeleteStem: (index: number) => void
}
const StemFilesView = ({
  onAddStems,
  stems,
  onSelectCategory,
  onDeleteStem
}: StemFilesViewProps) => {
  const isLosslessDownloadsEnabled = getFeatureEnabled(
    FeatureFlags.LOSSLESS_DOWNLOADS_ENABLED
  )

  const renderStemFiles = () => {
    return stems.length > 0 ? (
      <Box p='xl'>
        <Flex direction='column'>
          <HarmonyText variant='title' size='l'>
            {messages.stemTypeHeader}
          </HarmonyText>
          <Box mt='s'>
            <HarmonyText variant='body'>
              {messages.stemTypeDescription}
            </HarmonyText>
          </Box>
        </Flex>
        <Flex direction='column' mt='xl' borderRadius='m' border='default'>
          {stems.map((stem, i) => (
            <TrackPreviewNew
              className={styles.stemPreview}
              index={i}
              displayIndex={stems.length > 1}
              key={`stem-${i}`}
              trackTitle={stem.metadata.title}
              fileType=''
              fileSize={0}
              onRemove={() => onDeleteStem(i)}
              stemCategory={stem.category}
              onEditStemCategory={(category) => onSelectCategory(category, i)}
              allowCategorySwitch={stem.allowCategorySwitch}
              allowDelete={stem.allowDelete}
              isUpload={false}
              isStem
            />
          ))}
        </Flex>
      </Box>
    ) : null
  }

  const renderCurrentStems = () => {
    return (
      <div className={styles.stemRows}>
        {stems.map((stem, i) => (
          <StemRow
            key={`${stem.metadata.title}-${i}`}
            stem={stem}
            didSelectCategory={(category) => onSelectCategory(category, i)}
            onDelete={() => onDeleteStem(i)}
          />
        ))}
      </div>
    )
  }

  const useRenderDropzone = () => {
    const atCapacity = stems.length >= MAX_ROWS

    // Trim out stems > MAX_ROWS on add
    const onAdd = useCallback(
      (toAdd: any[]) => {
        const remaining = MAX_ROWS - stems.length
        onAddStems(toAdd.slice(0, remaining))
      },
      // eslint-disable-next-line
      [stems]
    )

    return (
      <Dropzone
        className={styles.dropZone}
        titleTextClassName={cn(styles.dropzoneTitle, {
          [styles.dropzoneDisabled]: atCapacity
        })}
        messageClassName={cn(styles.dropzoneMessage, {
          [styles.dropzoneDisabled]: atCapacity
        })}
        iconClassName={cn(styles.dropzoneIcon, {
          [styles.dropzoneDisabled]: atCapacity
        })}
        textAboveIcon={messages.additionalFiles}
        onDropAccepted={onAdd}
        type='stem'
        subtitle={atCapacity ? messages.maxCapacity : undefined}
        disableClick={atCapacity}
        isTruncated={stems.length > 0}
      />
    )
  }

  return (
    <div className={styles.sourceFilesContainer}>
      {isLosslessDownloadsEnabled ? renderStemFiles() : null}
      {useRenderDropzone()}
      {!isLosslessDownloadsEnabled ? renderCurrentStems() : null}
    </div>
  )
}

type DownloadSectionProps = {
  isOriginalAvailable: boolean
  onUpdateIsOriginalAvailable: (isOriginalAvailable: boolean) => void
  downloadSettings: Download
  onUpdateDownloadSettings: (downloadSettings: Download) => void
}

const DownloadSection = ({
  isOriginalAvailable,
  onUpdateIsOriginalAvailable,
  downloadSettings,
  onUpdateDownloadSettings
}: DownloadSectionProps) => {
  const isLosslessDownloadsEnabled = getFeatureEnabled(
    FeatureFlags.LOSSLESS_DOWNLOADS_ENABLED
  )

  const toggleIsDownloadable = useCallback(() => {
    const newSettings = downloadSettings
      ? { ...downloadSettings }
      : { ...defaultDownloadSettings }

    if (newSettings.is_downloadable) {
      // Disabling
      newSettings.is_downloadable = false
      newSettings.requires_follow = false
    } else {
      // Enabling
      newSettings.is_downloadable = true
      newSettings.requires_follow = false
      onUpdateIsOriginalAvailable(true)
    }
    onUpdateDownloadSettings(newSettings)
  }, [downloadSettings, onUpdateDownloadSettings, onUpdateIsOriginalAvailable])

  const toggleIsOriginalAvailable = useCallback(() => {
    onUpdateIsOriginalAvailable(!isOriginalAvailable)
  }, [onUpdateIsOriginalAvailable, isOriginalAvailable])

  const toggleRequiresFollow = useCallback(() => {
    const newSettings = downloadSettings
      ? { ...downloadSettings }
      : { ...defaultDownloadSettings }

    if (newSettings.requires_follow) {
      // Disabling
      newSettings.requires_follow = false
    } else {
      // Enabling
      newSettings.requires_follow = true
      newSettings.is_downloadable = true
    }
    onUpdateDownloadSettings(newSettings)
  }, [onUpdateDownloadSettings, downloadSettings])

  return (
    <Flex direction='column' ph='xl' pt='xl' gap='l'>
      <Flex direction='column' gap='l' w='100%'>
        <Flex justifyContent='space-between'>
          <HarmonyText variant='title' size='l'>
            {messages.allowDownloads}
          </HarmonyText>
          <Switch
            checked={downloadSettings?.is_downloadable ?? false}
            onChange={toggleIsDownloadable}
          />
        </Flex>
        <HarmonyText variant='body'>
          {messages.allowDownloadsDescription}
        </HarmonyText>
      </Flex>
      <Divider />
      <div className={styles.downloadSetting}>
        {isLosslessDownloadsEnabled ? (
          <Flex direction='column' gap='l' w='100%'>
            <Flex justifyContent='space-between'>
              <HarmonyText variant='title' size='l'>
                {messages.provideLosslessFiles}
              </HarmonyText>
              <Switch
                checked={isOriginalAvailable}
                onChange={toggleIsOriginalAvailable}
              />
            </Flex>
            <HarmonyText variant='body'>
              {messages.allowDownloadsDescription}
            </HarmonyText>
          </Flex>
        ) : (
          <>
            <HarmonyText variant='title' size='l'>
              {messages.requireFollowToDownload}
            </HarmonyText>
            <Switch
              checked={downloadSettings?.requires_follow ?? false}
              onChange={toggleRequiresFollow}
            />
          </>
        )}
      </div>
      <Divider />
    </Flex>
  )
}

type StemFilesModalProps = StemFilesViewProps & {
  isOriginalAvailable: boolean
  onUpdateIsOriginalAvailable: (isOriginalAvailable: boolean) => void
  downloadSettings: Download
  onUpdateDownloadSettings: (downloadSettings: Download) => void
  isOpen: boolean
  onClose: () => void
}

export const StemFilesModal = ({
  isOriginalAvailable,
  onUpdateIsOriginalAvailable,
  downloadSettings,
  onUpdateDownloadSettings,
  isOpen,
  onClose,
  onAddStems,
  stems,
  onSelectCategory,
  onDeleteStem
}: StemFilesModalProps) => {
  const isLosslessDownloadsEnabled = getFeatureEnabled(
    FeatureFlags.LOSSLESS_DOWNLOADS_ENABLED
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      showTitleHeader
      title={messages.title}
      dismissOnClickOutside
      showDismissButton
      // Since this can be nested in the edit track modal
      // Appear on top of it
      zIndex={1002}
      bodyClassName={cn(styles.modalContainer, {
        [styles.newModalContainer]: isLosslessDownloadsEnabled
      })}
      headerContainerClassName={styles.modalHeader}
      titleClassName={styles.modalTitle}
      subtitleClassName={styles.modalSubtitle}
    >
      <DownloadSection
        isOriginalAvailable={isOriginalAvailable}
        onUpdateIsOriginalAvailable={onUpdateIsOriginalAvailable}
        downloadSettings={downloadSettings}
        onUpdateDownloadSettings={onUpdateDownloadSettings}
      />
      <StemFilesView
        onAddStems={onAddStems}
        stems={stems}
        onSelectCategory={onSelectCategory}
        onDeleteStem={onDeleteStem}
      />
      <Button
        className={styles.doneButton}
        text={messages.done}
        size={ButtonSize.TINY}
        type={ButtonType.SECONDARY}
        onClick={onClose}
      />
    </Modal>
  )
}
