import { useCallback } from 'react'

import {
  StemCategory,
  stemCategoryFriendlyNames,
  StemUpload
} from '@audius/common/models'
import { Modal, IconRemove, IconButton, Button, Box } from '@audius/harmony'
import cn from 'classnames'

import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import Dropdown from 'components/navigation/Dropdown'
import { Dropzone } from 'components/upload/Dropzone'
import { stemDropdownRows } from 'utils/stems'

import styles from './StemFilesModal.module.css'

const MAX_ROWS = 20

const messages = {
  title: 'STEMS & DOWNLOADS',
  additionalFiles: 'UPLOAD ADDITIONAL FILES',
  allowDownloads: 'Allow Full Track Download',
  allowDownloadsDescription:
    'Allow your fans to download a copy of your full track.',
  requireFollowToDownload: 'Require Follow to Download',
  done: 'DONE',
  maxCapacity: 'Reached upload limit of 20 files.'
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
            color='danger'
            onClick={() => {
              if (!allowDelete) return
              onDelete()
            }}
            icon={IconRemove}
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
      {useRenderDropzone()}
      {renderCurrentStems()}
    </div>
  )
}

type StemFilesModalProps = StemFilesViewProps & {
  isOpen: boolean
  onClose: () => void
}

export const StemFilesModal = ({
  isOpen,
  onClose,
  onAddStems,
  stems,
  onSelectCategory,
  onDeleteStem
}: StemFilesModalProps) => {
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
      bodyClassName={styles.modalContainer}
      headerContainerClassName={styles.modalHeader}
      titleClassName={styles.modalTitle}
      subtitleClassName={styles.modalSubtitle}
    >
      <StemFilesView
        onAddStems={onAddStems}
        stems={stems}
        onSelectCategory={onSelectCategory}
        onDeleteStem={onDeleteStem}
      />
      <Box m='l'>
        <Button variant='secondary' size='small' onClick={onClose}>
          {messages.done}
        </Button>
      </Box>
    </Modal>
  )
}
