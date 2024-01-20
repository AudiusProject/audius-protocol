import { FeatureFlags, useFeatureFlag } from '@audius/common'
import { Flex, IconPenSquare } from '@audius/harmony'
import { HarmonyPlainButton, IconTrash } from '@audius/stems'
import numeral from 'numeral'

import iconFileAiff from 'assets/img/iconFileAiff.svg'
import iconFileFlac from 'assets/img/iconFileFlac.svg'
import iconFileM4a from 'assets/img/iconFileM4a.svg'
import iconFileMp3 from 'assets/img/iconFileMp3.svg'
import iconFileOgg from 'assets/img/iconFileOgg.svg'
import iconFileUnknown from 'assets/img/iconFileUnknown.svg'
import iconFileWav from 'assets/img/iconFileWav.svg'
import { Text } from 'components/typography'

import styles from './TrackPreview.module.css'

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
  onEditTitle?: () => void
  isTitleEditable?: boolean
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
    onEditTitle,
    isTitleEditable
  } = props

  const Icon = fileTypeIcon(fileType)

  return (
    <div className={styles.trackPreviewNew}>
      {displayIndex ? (
        <Text className={styles.indexText} size='small'>
          {index + 1}
        </Text>
      ) : null}
      <Icon className={styles.trackPreviewImage} />
      <Text className={styles.titleText} size='small'>
        {trackTitle}
      </Text>
      <div className={styles.sizeContainer}>
        <Text
          className={styles.fileSizeText}
          size='small'
          color='neutralLight2'
        >
          {numeral(fileSize).format('0.0 b')}
        </Text>
        {isLosslessDownloadsEnabled ? (
          <Flex gap='xs' alignItems='center'>
            {isTitleEditable ? (
              <HarmonyPlainButton
                iconRight={IconPenSquare}
                onClick={onEditTitle}
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
          <div className={styles.removeButtonContainer}>
            <HarmonyPlainButton
              iconRight={IconTrash}
              onClick={onRemove}
              className={styles.removeButton}
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}
