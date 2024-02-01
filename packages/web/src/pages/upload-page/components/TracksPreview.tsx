import { useCallback } from 'react'

import { UploadType } from '@audius/common'
import { Button, IconCaretRight } from '@audius/harmony'
import { Scrollbar, SegmentedControl } from '@audius/stems'
import cn from 'classnames'

import { Text } from 'components/typography'
import { TrackPreviewNew } from 'components/upload/TrackPreviewNew'

import { TrackForUpload } from '../types'

import styles from './TracksPreview.module.css'

const messages = {
  continue: 'Continue Uploading',
  releaseType: 'Release Type',
  trackAdded: 'Track Added',
  tracksAdded: 'Tracks Added'
}

type TracksPreviewProps = {
  uploadType: UploadType
  tracks: TrackForUpload[]
  setUploadType: (uploadType: UploadType) => void
  onRemove: (index: number) => void
  onContinue: () => void
}

const uploadDescriptions = {
  [UploadType.PLAYLIST]:
    'Create a playlist from your tracks. You can easily modify this playlist later, even adding tracks from other artists.',
  [UploadType.ALBUM]:
    'Upload your songs into an album. Albums can only include your own tracks.',
  [UploadType.INDIVIDUAL_TRACKS]:
    'Upload single tracks. Each appears separately.',
  [UploadType.INDIVIDUAL_TRACK]:
    'Upload single tracks. Each appears separately.'
}

export const TracksPreview = (props: TracksPreviewProps) => {
  const { onContinue, onRemove, tracks, uploadType, setUploadType } = props

  const handleOptionSelect = useCallback(
    (option: string) => {
      setUploadType(Number(option))
    },
    [setUploadType]
  )

  return (
    <div className={styles.root}>
      <div className={cn(styles.info, styles.header)}>
        <Text variant='label' size='small'>
          {messages.releaseType}
        </Text>
        <SegmentedControl
          onSelectOption={handleOptionSelect}
          selected={String(uploadType)}
          options={[
            { key: String(UploadType.INDIVIDUAL_TRACKS), text: 'Tracks' },
            { key: String(UploadType.ALBUM), text: 'Album' },
            { key: String(UploadType.PLAYLIST), text: 'Playlist' }
          ]}
          // Matches 0.18s entry animation
          forceRefreshAfterMs={180}
        />
        <Text>{uploadDescriptions[props.uploadType]}</Text>
      </div>
      <Scrollbar
        className={cn(styles.tracks, {
          [styles.shortScroll]:
            props.uploadType !== UploadType.INDIVIDUAL_TRACKS
        })}
      >
        {tracks.map((track, i) => (
          <TrackPreviewNew
            index={i}
            displayIndex={tracks.length > 1}
            key={`track-preview-${i}`}
            trackTitle={track.file.name}
            fileType={track.file.type}
            fileSize={track.file.size}
            onRemove={() => onRemove(i)}
          />
        ))}
      </Scrollbar>
      <div className={cn(styles.info, styles.footer)}>
        <Text size='small'>
          {`${tracks.length} ${
            tracks.length === 1 ? messages.trackAdded : messages.tracksAdded
          }`}
        </Text>
        <Button
          variant='primary'
          name='continue'
          iconRight={IconCaretRight}
          onClick={onContinue}
        >
          {messages.continue}
        </Button>
      </div>
    </div>
  )
}
