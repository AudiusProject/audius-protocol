import { useCallback, useEffect, useState } from 'react'

import { useFeatureFlag } from '@audius/common/hooks'
import {
  StemCategory,
  stemCategoryFriendlyNames,
  StemUpload,
  StemUploadWithFile
} from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import { encodeHashId } from '@audius/common/utils'
import {
  IconRemove,
  Box,
  Flex,
  Text as HarmonyText,
  IconButton
} from '@audius/harmony'
import cn from 'classnames'

import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import Dropdown from 'components/navigation/Dropdown'
import { Text } from 'components/typography'
import { Dropzone } from 'components/upload/Dropzone'
import { TrackPreview } from 'components/upload/TrackPreview'
import { audiusSdk } from 'services/audius-sdk'
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

const useStemFileInfos = (stems: StemUploadWithFile[]) => {
  const [fileInfos, setFileInfos] = useState<{ [index: number]: File }>({})

  useEffect(() => {
    const indexToTrackIdsMap = stems.reduce((acc, stem, i) => {
      if (!stem.file) acc[i] = stem.metadata.track_id
      return acc
    }, {})
    const indexToTrackTitlesMap = stems.reduce((acc, stem, i) => {
      if (!stem.file) acc[i] = stem.metadata.orig_filename ?? ''
      return acc
    }, {})

    const fetchInfos = async (indexToTrackIdsMap: {
      [index: number]: number
    }) => {
      try {
        const sdk = await audiusSdk()
        const indices = Object.keys(indexToTrackIdsMap).map(Number)
        const responses = await Promise.all(
          indices.map(async (i: number) => {
            const trackId = indexToTrackIdsMap[i]
            return {
              i,
              res: await sdk.tracks.inspectTrack({
                trackId: encodeHashId(trackId),
                original: true
              })
            }
          })
        )
        const datas = responses.reduce((acc, { i, res }) => {
          acc[i] = res
          return acc
        }, {})
        const infos = stems.reduce((acc, stem, i) => {
          if (!stem.file) {
            const name = indexToTrackTitlesMap[i]
            const type = datas[i]?.data?.contentType ?? ''
            const size = datas[i]?.data?.size ?? 0
            acc[i] = { name, type, size }
          } else {
            acc[i] = stem.file
          }
          return acc
        }, {})
        setFileInfos(infos)
      } catch (e) {
        console.error(`Error inspecting stem tracks: ${e}`)
      }
    }

    fetchInfos(indexToTrackIdsMap)
  }, [stems])

  return fileInfos
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
  const { isEnabled: isLosslessDownloadsEnabled } = useFeatureFlag(
    FeatureFlags.LOSSLESS_DOWNLOADS_ENABLED
  )

  const fileInfos = useStemFileInfos(stems)

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
            <TrackPreview
              className={styles.stemPreview}
              index={i}
              displayIndex={stems.length > 1}
              key={`stem-${i}`}
              file={fileInfos[i] ?? stem.file}
              onRemove={() => onDeleteStem(i)}
              stemCategory={stem.category}
              onEditStemCategory={(category) => onSelectCategory(category, i)}
              allowCategorySwitch={stem.allowCategorySwitch}
              allowDelete={stem.allowDelete}
              isStem
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
