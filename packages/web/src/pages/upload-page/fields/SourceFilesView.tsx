import { useCallback } from 'react'

import {
  StemCategory,
  stemCategoryFriendlyNames,
  StemUpload
} from '@audius/common/models'

import {} from '@audius/common'
import { IconRemove, IconButton } from '@audius/stems'
import cn from 'classnames'

import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import Dropdown from 'components/navigation/Dropdown'
import { Text } from 'components/typography'
import { Dropzone } from 'components/upload/Dropzone'

import styles from './SourceFilesView.module.css'

const MAX_ROWS = 10

const messages = {
  sourceFiles: 'SOURCE FILES',
  maxCapacity: 'Reached upload limit of 10 files.'
}

type SourceFilesViewProps = {
  onAddStems: (stems: any) => void
  stems: StemUpload[]
  onSelectCategory: (category: StemCategory, index: number) => void
  onDeleteStem: (index: number) => void
}

export const SourceFilesView = ({
  onAddStems,
  stems,
  onSelectCategory,
  onDeleteStem
}: SourceFilesViewProps) => {
  const renderCurrentStems = () => {
    return (
      <ul className={styles.stemListItems}>
        {stems.map((stem, i) => (
          <StemListItem
            key={`${stem.metadata.title}-${i}`}
            stem={stem}
            didSelectCategory={(category) => onSelectCategory(category, i)}
            onDelete={() => onDeleteStem(i)}
          />
        ))}
      </ul>
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
      {useRenderDropzone()}
      {renderCurrentStems()}
    </div>
  )
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

type StemListItemProps = {
  stem: StemUpload
  didSelectCategory: (category: StemCategory) => void
  onDelete: () => void
}

const StemListItem = ({
  stem: { category, metadata, allowCategorySwitch, allowDelete },
  didSelectCategory,
  onDelete
}: StemListItemProps) => {
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
      <span className={styles.deleteButton}>
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
      </span>
    )
  }

  return (
    <li className={styles.stemListItemContainer}>
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
      <Text size='small' strength='strong'>
        {metadata.title}
      </Text>
      {renderDeleteButton()}
    </li>
  )
}
