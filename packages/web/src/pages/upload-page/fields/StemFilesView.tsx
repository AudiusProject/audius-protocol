import { useCallback, useEffect, useState } from 'react'

import { StemCategory, StemUploadWithFile } from '@audius/common/models'
import { encodeHashId } from '@audius/common/utils'
import { Box, Flex, Text } from '@audius/harmony'
import cn from 'classnames'

import { Dropzone } from 'components/upload/Dropzone'
import { TrackPreview } from 'components/upload/TrackPreview'
import { audiusSdk } from 'services/audius-sdk'

import styles from './StemFilesView.module.css'

const MAX_ROWS = 20

const messages = {
  additionalFiles: 'UPLOAD ADDITIONAL FILES',
  audioQuality: 'Provide FLAC, WAV, ALAC, or AIFF for highest audio quality',
  maxCapacity: 'Reached upload limit of 20 files.',
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
  const fileInfos = useStemFileInfos(stems)

  const renderStemFiles = () => {
    return stems.length > 0 ? (
      <>
        <Flex direction='column'>
          <Text variant='title' size='l'>
            {messages.stemTypeHeader}
          </Text>
          <Box mt='s'>
            <Text variant='body'>{messages.stemTypeDescription}</Text>
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
        className={cn(styles.dropZone, {
          [styles.dropzoneDisabled]: atCapacity
        })}
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
        subtextAboveIcon={messages.audioQuality}
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
      {renderStemFiles()}
      {useRenderDropzone()}
    </div>
  )
}
