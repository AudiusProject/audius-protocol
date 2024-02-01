import { useCallback } from 'react'

import {
  StemCategory,
  stemCategoryFriendlyNames,
  StemUpload,
  Download
} from '@audius/common'
import { IconRemove } from '@audius/harmony'
import {
  Button,
  ButtonSize,
  ButtonType,
  Modal,
  IconButton
} from '@audius/stems'
import cn from 'classnames'

import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import Dropdown from 'components/navigation/Dropdown'
import Switch from 'components/switch/Switch'
import { Dropzone } from 'components/upload/Dropzone'

import styles from './SourceFilesModal.module.css'

const MAX_ROWS = 10

const messages = {
  title: 'DOWNLOADS & SOURCE FILES',
  subtitle: 'Allow Users to download MP3 copies of your track',
  sourceFiles: 'SOURCE FILES',
  allowDownloads: 'Allow Downloads',
  requireFollowToDownload: 'Require Follow to Download',
  done: 'DONE',
  maxCapacity: 'Reached upload limit of 10 files.'
}

const defaultDownloadSettings: Download = {
  is_downloadable: false,
  requires_follow: false,
  cid: null
}

export const dropdownRows = [
  StemCategory.INSTRUMENTAL,
  StemCategory.LEAD_VOCALS,
  StemCategory.MELODIC_LEAD,
  StemCategory.PAD,
  StemCategory.SNARE,
  StemCategory.KICK,
  StemCategory.HIHAT,
  StemCategory.PERCUSSION,
  StemCategory.SAMPLE,
  StemCategory.BACKING_VOX,
  StemCategory.BASS,
  StemCategory.OTHER
]

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
    const cat = dropdownRows[index]
    didSelectCategory(cat)
  }

  let stemIndex = dropdownRows.findIndex((r) => r === category)
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
            items: dropdownRows.map((r) => ({
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

type SourceFilesViewProps = {
  downloadSettings: Download
  onUpdateDownloadSettings: (downloadSettings: Download) => void
  onAddStems: (stems: any) => void
  stems: StemUpload[]
  onSelectCategory: (category: StemCategory, index: number) => void
  onDeleteStem: (index: number) => void
}
const SourceFilesView = ({
  downloadSettings,
  onUpdateDownloadSettings,
  onAddStems,
  stems,
  onSelectCategory,
  onDeleteStem
}: SourceFilesViewProps) => {
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
    }
    onUpdateDownloadSettings(newSettings)
  }, [onUpdateDownloadSettings, downloadSettings])

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

  const renderDownloadSection = () => {
    return (
      <div className={styles.downloadSettings}>
        <div className={styles.downloadSetting}>
          <div className={styles.label}>{messages.allowDownloads}</div>
          <Switch
            isOn={downloadSettings?.is_downloadable ?? false}
            handleToggle={toggleIsDownloadable}
          />
        </div>
        <div className={styles.downloadSetting}>
          <div className={styles.label}>{messages.requireFollowToDownload}</div>
          <Switch
            isOn={downloadSettings?.requires_follow ?? false}
            handleToggle={toggleRequiresFollow}
          />
        </div>
      </div>
    )
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
        textAboveIcon={messages.sourceFiles}
        onDropAccepted={onAdd}
        type='stem'
        subtitle={atCapacity ? messages.maxCapacity : undefined}
        disableClick={atCapacity}
      />
    )
  }

  return (
    <div className={styles.sourceFilesContainer}>
      {renderDownloadSection()}
      {useRenderDropzone()}
      {renderCurrentStems()}
    </div>
  )
}

type SourceFilesModalProps = SourceFilesViewProps & {
  isOpen: boolean
  onClose: () => void
}

const SourceFilesModal = ({
  downloadSettings,
  onUpdateDownloadSettings,
  isOpen,
  onClose,
  onAddStems,
  stems,
  onSelectCategory,
  onDeleteStem
}: SourceFilesModalProps) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      showTitleHeader
      title={messages.title}
      subtitle={messages.subtitle}
      dismissOnClickOutside
      showDismissButton
      // Since this can be nested in the edit track modal
      // Appear on top of it
      zIndex={1002}
      bodyClassName={styles.modalContainer}
      headerContainerClassName={styles.modalHeader}
      titleClassName={styles.modalTitle}
      subtitleClassName={styles.modalSubtitle}
    >
      <SourceFilesView
        downloadSettings={downloadSettings}
        onUpdateDownloadSettings={onUpdateDownloadSettings}
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

export default SourceFilesModal
