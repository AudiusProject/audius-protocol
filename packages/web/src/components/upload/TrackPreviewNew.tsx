import { useState } from 'react'

import { useFeatureFlag } from '@audius/common/hooks'
import { StemCategory, stemCategoryFriendlyNames } from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import { Nullable } from '@audius/common/utils'
import {
  Box,
  FilterButton,
  Flex,
  IconCompose,
  IconFileAIFF as iconFileAiff,
  IconFileFLAC as iconFileFlac,
  IconFileM4A as iconFileM4a,
  IconFileMP3 as iconFileMp3,
  IconFileOGG as iconFileOgg,
  IconFileUnknown as iconFileUnknown,
  IconFileWAV as iconFileWav,
  IconTrash,
  Text
} from '@audius/harmony'
import { HarmonyPlainButton } from '@audius/stems'
import cn from 'classnames'
import numeral from 'numeral'

import zIndex from 'utils/zIndex'

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
  index: number
  displayIndex: boolean
  onRemove: () => void
  file?: File
  isTitleEditable?: boolean
  onEditTitle?: (title: string) => void
  isStem?: boolean
  stemCategory?: Nullable<StemCategory>
  onEditStemCategory?: (stemCategory: StemCategory) => void
  allowCategorySwitch?: boolean
  allowDelete?: boolean
  className?: string
}

export const TrackPreviewNew = (props: TrackPreviewProps) => {
  const { isEnabled: isLosslessDownloadsEnabled } = useFeatureFlag(
    FeatureFlags.LOSSLESS_DOWNLOADS_ENABLED
  )

  const {
    displayIndex = false,
    index,
    file,
    onRemove,
    isTitleEditable,
    onEditTitle,
    isStem,
    stemCategory,
    onEditStemCategory,
    allowCategorySwitch = true,
    allowDelete = true,
    className
  } = props
  const {
    name: trackTitle,
    type: fileType,
    size: fileSize
  } = file ?? {
    name: 'Untitled',
    type: 'audio/mp3',
    size: 0
  }

  const Icon = fileTypeIcon(fileType)
  const iconStyle = isStem ? { width: 24, height: 24 } : undefined

  const [isEditingTitle, setIsEditingTitle] = useState(false)

  const stemCategories = Object.keys(stemCategoryFriendlyNames).map(
    (value) => ({
      value,
      label: stemCategoryFriendlyNames[value as StemCategory]
    })
  )

  return (
    <div className={cn(styles.trackPreviewNew, className)}>
      {displayIndex ? (
        <Text className={styles.indexText} size='small'>
          {index + 1}
        </Text>
      ) : null}
      <Icon className={styles.trackPreviewImage} style={iconStyle} />
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
              selection={stemCategory?.toString() ?? null}
              popupZIndex={zIndex.STEMS_AND_DOWNLOADS_FILTER_BUTTON_POPUP}
              isDisabled={!allowCategorySwitch}
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
                iconRight={IconCompose}
                onClick={() => setIsEditingTitle(true)}
                className={styles.editTitleButton}
              />
            ) : null}
            <HarmonyPlainButton
              iconRight={IconTrash}
              onClick={onRemove}
              disabled={!allowDelete}
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
