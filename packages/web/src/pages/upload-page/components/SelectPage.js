import { Component } from 'react'

import { UploadType } from '@audius/common'
import { Button, ButtonType, IconArrow } from '@audius/stems'
import cn from 'classnames'
import PropTypes from 'prop-types'

import { Dropzone } from 'components/upload/Dropzone'
import InvalidFileType from 'components/upload/InvalidFileType'

import styles from './SelectPage.module.css'
import TracksPreview from './TracksPreview'

class SelectPage extends Component {
  componentWillUnmount() {
    this.props.stopPreview()
  }

  render() {
    const {
      tracks = [],
      previewIndex,
      onSelect,
      onRemove,
      playPreview,
      stopPreview,
      onContinue,
      setUploadType,
      error,
      uploadType
    } = this.props

    const textAboveIcon = tracks.length > 0 ? 'More to Upload?' : null

    return (
      <div className={cn(styles.page)}>
        <div className={styles.select}>
          <div className={styles.dropzone}>
            <Dropzone
              textAboveIcon={textAboveIcon}
              onDropAccepted={onSelect}
              onDropRejected={onSelect}
            />
            {error ? (
              <InvalidFileType
                reason={error.reason}
                className={styles.invalidFileType}
              />
            ) : null}
          </div>
          <div
            className={cn(styles.uploaded, {
              [styles.hide]: tracks.length === 0
            })}
          >
            {tracks.length > 0 ? (
              <div>
                <TracksPreview
                  tracks={tracks}
                  uploadType={uploadType}
                  previewIndex={previewIndex}
                  onRemove={onRemove}
                  setUploadType={setUploadType}
                  playPreview={playPreview}
                  stopPreview={stopPreview}
                />
                <div className={styles.count}>
                  {tracks.length === 1
                    ? `${tracks.length} track uploaded`
                    : `${tracks.length} tracks uploaded`}
                </div>
                <div className={styles.continue}>
                  <Button
                    type={ButtonType.PRIMARY_ALT}
                    text='Continue'
                    name='continue'
                    rightIcon={<IconArrow />}
                    onClick={onContinue}
                    textClassName={styles.continueButtonText}
                    className={styles.continueButton}
                  />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    )
  }
}

SelectPage.propTypes = {
  account: PropTypes.object,
  uploadType: PropTypes.oneOf([
    UploadType.INDIVIDUAL_TRACK,
    UploadType.INDIVIDUAL_TRACKS,
    UploadType.PLAYLIST,
    UploadType.ALBUM
  ]),
  onCloseMultiTrackNotification: PropTypes.func,
  tracks: PropTypes.array,
  previewIndex: PropTypes.number,
  dropdownMenu: PropTypes.object,
  onSelect: PropTypes.func,
  onRemove: PropTypes.func,
  playPreview: PropTypes.func,
  stopPreview: PropTypes.func,
  onContinue: PropTypes.func
}

export default SelectPage
