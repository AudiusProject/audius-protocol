import { useState } from 'react'

import {
  FeatureFlags,
  StemCategory,
  stemCategoryFriendlyNames,
  useFeatureFlag
} from '@audius/common'
import {
  Box,
  FilterButton,
  Flex,
  IconPenSquare,
  IconFileAIFF as iconFileAiff,
  IconFileFLAC as iconFileFlac,
  IconFileM4A as iconFileM4a,
  IconFileMP3 as iconFileMp3,
  IconFileOGG as iconFileOgg,
  IconFileUnknown as iconFileUnknown,
  IconFileWAV as iconFileWav
} from '@audius/harmony'
import { HarmonyPlainButton, IconTrash } from '@audius/stems'
import numeral from 'numeral'

import { Text } from 'components/typography'

import { EditableLabel } from './EditableLabel'
import styles from './TrackPreview.module.css'

const messages = {
  selectType: 'Select Type'
}

const fileTypeIcon = (type: string) => {
  switch (type) {
    case 'audio/mpeg':
    case 'audio/mp3':
      return iconFileMp3
    case 'audio/x-m4a':
      return iconFileM4a
    case 'audio/aiff':
      return iconFileAiff
    case 'audio/flac':
      return iconFileFlac
    case 'audio/ogg':
      return iconFileOgg
    case 'audio/wav':
      return iconFileWav
    default:
      return iconFileUnknown
  }
}

type TrackPreviewProps = {
  fileType: string
  trackTitle: string
  fileSize: number
  index: number
  displayIndex: boolean
  onRemove: () => void
  isTitleEditable?: boolean
  onEditTitle?: (title: string) => void
  isStem?: boolean
  stemCategory?: StemCategory
  onEditStemCategory?: (stemCategory: StemCategory) => void
}

export const TrackPreviewNew = (props: TrackPreviewProps) => {
  const { isEnabled: isLosslessDownloadsEnabled } = useFeatureFlag(
    FeatureFlags.LOSSLESS_DOWNLOADS_ENABLED
  )

  const {
    displayIndex = false,
    index,
    fileType = 'audio/mp3',
    trackTitle = 'Untitled',
    fileSize,
    onRemove,
    isTitleEditable,
    onEditTitle,
    isStem,
    stemCategory,
    onEditStemCategory
  } = props

  const Icon = fileTypeIcon(fileType)

  const [isEditingTitle, setIsEditingTitle] = useState(false)

  const stemCategories = Object.keys(stemCategoryFriendlyNames).map(
    (value) => ({
      value,
      label: stemCategoryFriendlyNames[value as StemCategory]
    })
  )

  return (
    <div className={styles.trackPreviewNew}>
      {displayIndex ? (
        <Text className={styles.indexText} size='small'>
          {index + 1}
        </Text>
      ) : null}
      <Icon className={styles.trackPreviewImage} />
      {isLosslessDownloadsEnabled && isTitleEditable && onEditTitle ? (
        <EditableLabel
          isEditing={isEditingTitle}
          setIsEditing={setIsEditingTitle}
          value={trackTitle}
          setValue={onEditTitle}
        />
      ) : (
        <Text className={styles.titleText} size='small'>
          {trackTitle}
        </Text>
      )}
      <Flex alignItems='center'>
        {isLosslessDownloadsEnabled && isStem && onEditStemCategory ? (
          <Box mr='xl'>
            <FilterButton
              label={messages.selectType}
              options={stemCategories}
              popupAnchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              popupTransformOrigin={{
                vertical: 'top',
                horizontal: 'right'
              }}
              onSelect={(label) => onEditStemCategory(label as StemCategory)}
              selection={stemCategory?.toString()}
            />
          </Box>
        ) : null}
        <Text
          className={styles.fileSizeText}
          size='small'
          color='neutralLight2'
        >
          {numeral(fileSize).format('0.0 b')}
        </Text>
        {isLosslessDownloadsEnabled ? (
          <Flex gap='xs' alignItems='center' className={styles.iconsContainer}>
            {isTitleEditable ? (
              <HarmonyPlainButton
                iconRight={IconPenSquare}
                onClick={() => setIsEditingTitle(true)}
                className={styles.editTitleButton}
              />
            ) : null}
            <HarmonyPlainButton
              iconRight={IconTrash}
              onClick={onRemove}
              className={styles.removeButton}
            />
          </Flex>
        ) : null}
        {!isLosslessDownloadsEnabled ? (
          <HarmonyPlainButton
            iconRight={IconTrash}
            onClick={onRemove}
            className={styles.removeButton}
          />
        ) : null}
      </Flex>
    </div>
  )
}
