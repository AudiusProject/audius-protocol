import { UploadType } from '@audius/common'
import { Scrollbar, SegmentedControl } from '@audius/stems'
import cn from 'classnames'
import PropTypes from 'prop-types'

import TrackPreview from 'components/upload/TrackPreview'

import styles from './TracksPreview.module.css'

const uploadDescriptions = {
  [UploadType.PLAYLIST]:
    'A playlist is a living thing that can change and grow over time. Playlists can contain your own tracks, as well as tracks uploaded by others.',
  [UploadType.ALBUM]:
    'An album is a curated listening experience that is frozen in time and does not change. Albums can only contain tracks that you upload.',
  [UploadType.INDIVIDUAL_TRACKS]:
    'Every track you upload will be a separate post.',
  [UploadType.INDIVIDUAL_TRACK]:
    'Every track you upload will be a separate post.'
}

const TracksPreview = (props) => {
  return (
    <div className={styles.container}>
      <div className={styles.headerContainer}>
        <div className={styles.header}>Release Type</div>
        <SegmentedControl
          className={styles.tabSlider}
          onSelectOption={props.setUploadType}
          selected={props.uploadType}
          options={[
            { key: UploadType.INDIVIDUAL_TRACKS, text: 'Tracks' },
            { key: UploadType.ALBUM, text: 'Album' },
            { key: UploadType.PLAYLIST, text: 'Playlist' }
          ]}
        />
        <div className={styles.typeDescription}>
          {uploadDescriptions[props.uploadType]}
        </div>
      </div>
      <Scrollbar
        className={cn(styles.tracks, {
          [styles.shortScroll]:
            props.uploadType !== UploadType.INDIVIDUAL_TRACKS
        })}
      >
        {props.tracks.map((track, i) => (
          <TrackPreview
            key={track.metadata.title + i}
            trackTitle={track.metadata.title}
            fileType={track.file.type}
            fileSize={track.file.size}
            playing={props.previewIndex === i}
            onRemove={() => props.onRemove(i)}
            onPlayPreview={() => props.playPreview(i)}
            onStopPreview={() => props.stopPreview()}
          />
        ))}
      </Scrollbar>
    </div>
  )
}

TracksPreview.propTypes = {
  uploadType: PropTypes.oneOf([
    UploadType.INDIVIDUAL_TRACK,
    UploadType.INDIVIDUAL_TRACKS,
    UploadType.PLAYLIST,
    UploadType.ALBUM
  ]),
  tracks: PropTypes.array,
  setUploadType: PropTypes.func,
  playPreview: PropTypes.func,
  stopPreview: PropTypes.func,
  onRemove: PropTypes.func,
  previewIndex: PropTypes.number
}

export default TracksPreview
