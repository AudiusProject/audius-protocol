import { Component } from 'react'

import { IconClose as IconRemove } from '@audius/harmony'
import numeral from 'numeral'
import PropTypes from 'prop-types'

import iconFileAiff from 'assets/img/iconFileAiff.svg'
import iconFileFlac from 'assets/img/iconFileFlac.svg'
import iconFileMp3 from 'assets/img/iconFileMp3.svg'
import iconFileOgg from 'assets/img/iconFileOgg.svg'
import iconFileUnknown from 'assets/img/iconFileUnknown.svg'
import iconFileWav from 'assets/img/iconFileWav.svg'
import PreviewButton from 'components/upload/PreviewButton'

import styles from './TrackPreview.module.css'

const supportsPreview = new Set([
  'audio/mpeg',
  'audio/mp3',
  'audio/ogg',
  'audio/wav'
])

class TrackPreview extends Component {
  fileTypeIcon = (type) => {
    switch (type) {
      case 'audio/mpeg':
      case 'audio/mp3':
        return iconFileMp3
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

  render() {
    const {
      fileType,
      trackTitle,
      fileSize,
      playing,
      onRemove,
      onPlayPreview,
      onStopPreview
    } = this.props

    const onPreviewClick = playing ? onStopPreview : onPlayPreview

    return (
      <div className={styles.trackPreview}>
        <div className={styles.trackDetails}>
          <img src={this.fileTypeIcon(fileType)} alt='File type icon' />
          <div className={styles.trackTitle}>{trackTitle}</div>
          <div className={styles.fileSize}>
            {numeral(fileSize).format('0.0 b')}
          </div>
        </div>
        <div className={styles.actions}>
          <div onClick={onPreviewClick}>
            {supportsPreview.has(fileType) && (
              <PreviewButton playing={playing} />
            )}
          </div>
          <IconRemove className={styles.remove} onClick={onRemove} />
        </div>
      </div>
    )
  }
}

TrackPreview.propTypes = {
  fileType: PropTypes.string,
  trackTitle: PropTypes.string,
  fileSize: PropTypes.number,
  playing: PropTypes.bool,
  onRemove: PropTypes.func,
  onPlayPreview: PropTypes.func,
  onStopPreview: PropTypes.func
}

TrackPreview.defaultProps = {
  fileType: 'mp3',
  trackTitle: 'Untitled',
  fileSize: '7MB'
}

export default TrackPreview
