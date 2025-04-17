import { useCallback, useMemo } from 'react'

import { useTrackFileInfo } from '@audius/common/api'
import { StemCategory, StemUploadWithFile } from '@audius/common/models'
import { Box, Flex, Text } from '@audius/harmony'
import cn from 'classnames'

import { Dropzone } from 'components/upload/Dropzone'
import { TrackPreview, TrackPreviewProps } from 'components/upload/TrackPreview'

import styles from './StemFilesView.module.css'

const MAX_ROWS = 200

const messages = {
  additionalFiles: 'UPLOAD ADDITIONAL FILES',
  audioQuality: 'Provide FLAC, WAV, ALAC, or AIFF for highest audio quality',
  maxCapacity: `Reached upload limit of ${MAX_ROWS} files.`,
  stemTypeHeader: 'Select Stem Type',
  stemTypeDescription: 'Please select a stem type for each of your files.'
}

const makeStemKey = (stem: StemUploadWithFile) => {
  return stem.metadata.track_id ?? stem.metadata.orig_filename
}

type StemFilesViewProps = {
  onAddStems: (stems: any) => void
  stems: StemUploadWithFile[]
  onSelectCategory: (category: StemCategory, index: number) => void
  onDeleteStem: (index: number) => void
}

type StemPreviewProps = Omit<TrackPreviewProps, 'file'> & {
  stem: StemUploadWithFile
}

const StemFilePreview = (props: StemPreviewProps) => {
  return props.stem.metadata.track_id ? (
    <StemRemoteFilePreview {...props} />
  ) : (
    <TrackPreview {...props} file={props.stem.file} />
  )
}

const StemRemoteFilePreview = (props: StemPreviewProps) => {
  const { data } = useTrackFileInfo(props.stem.metadata.track_id)
  const file = useMemo(() => {
    if (data) {
      return {
        name: props.stem.metadata.orig_filename ?? '',
        type: data.contentType,
        size: data.size
      } as File
    }
    return props.stem.file
  }, [data, props.stem.file, props.stem.metadata.orig_filename])
  return <TrackPreview {...props} file={file} />
}

export const StemFilesView = ({
  onAddStems,
  stems,
  onSelectCategory,
  onDeleteStem
}: StemFilesViewProps) => {
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
          role='list'
          direction='column'
          borderRadius='m'
          border='default'
          css={{ overflow: 'hidden' }}
        >
          {stems.map((stem, i) => (
            <StemFilePreview
              role='listitem'
              className={styles.stemPreview}
              index={i}
              displayIndex={stems.length > 1}
              key={`stem-${makeStemKey(stem)}`}
              stem={stem}
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
        disabled={atCapacity}
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
