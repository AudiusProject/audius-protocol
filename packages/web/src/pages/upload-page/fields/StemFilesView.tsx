import { useCallback } from 'react'

import {
  StemCategory,
  stemCategoryFriendlyNames,
  StemUpload,
  StemUploadWithFile
} from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import { IconRemove, Box, Flex, Text as HarmonyText } from '@audius/harmony'
import { IconButton } from '@audius/stems'
import cn from 'classnames'

import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import Dropdown from 'components/navigation/Dropdown'
import { Text } from 'components/typography'
import { Dropzone } from 'components/upload/Dropzone'
import { TrackPreviewNew } from 'components/upload/TrackPreviewNew'
import { getFeatureEnabled } from 'services/remote-config/featureFlagHelpers'
import { stemDropdownRows } from 'utils/stems'

import styles from './StemFilesView.module.css'

const MAX_ROWS = 10

const messages = {
  additionalFiles: 'UPLOAD ADDITIONAL FILES',
  audioQuality: 'Provide FLAC, WAV, ALAC, or AIFF for highest audio quality',
  maxCapacity: 'Reached upload limit of 10 files.',
  stemTypeHeader: 'Select Stem Type',
  stemTypeDescription: 'Please select a stem type for each of your files.'
}

type StemFilesViewProps = {
  onAddStems: (stems: any) => void
  stems: StemUploadWithFile[]
  onSelectCategory: (category: StemCategory, index: number) => void
  onDeleteStem: (index: number) => void
}

export const StemFilesView = ({
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
      <>
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
        <Flex
          direction='column'
          borderRadius='m'
          border='default'
          css={{ overflow: 'hidden' }}
        >
          {stems.map((stem, i) => (
            <TrackPreviewNew
              className={styles.stemPreview}
              index={i}
              displayIndex={stems.length > 1}
              key={`stem-${i}`}
              trackTitle={stem.file?.name ?? stem.metadata.orig_filename ?? ''}
              fileType={stem.file?.type ?? 'audio/mp3'} // TODO: Get correct file type for pre-existing stems
              fileSize={stem.file?.size ?? 0} // TODO: Get correct file size for pre-existing stems
              onRemove={() => onDeleteStem(i)}
              stemCategory={stem.category}
              onEditStemCategory={(category) => onSelectCategory(category, i)}
              allowCategorySwitch={stem.allowCategorySwitch}
              allowDelete={stem.allowDelete}
              isStem
              isEdit
            />
          ))}
        </Flex>
      </>
    ) : null
  }

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
        textAboveIcon={messages.additionalFiles}
        subtextAboveIcon={
          isLosslessDownloadsEnabled ? messages.audioQuality : undefined
        }
        onDropAccepted={onAdd}
        type='stem'
        subtitle={atCapacity ? messages.maxCapacity : undefined}
        disableClick={atCapacity}
        isTruncated={stems.length > 0}
      />
    )
  }

  return (
    <div className={styles.stemFilesContainer}>
      {isLosslessDownloadsEnabled ? renderStemFiles() : null}
      {useRenderDropzone()}
      {!isLosslessDownloadsEnabled ? renderCurrentStems() : null}
    </div>
  )
}

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
      <Text size='small' strength='strong'>
        {metadata.title}
      </Text>
      {renderDeleteButton()}
    </li>
  )
}
