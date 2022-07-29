import { Component } from 'react'

import { Button, ButtonType, IconArrow } from '@audius/stems'
import cn from 'classnames'
import PropTypes from 'prop-types'

import { SelectedServices } from 'components/service-selection'
import Dropzone from 'components/upload/Dropzone'
import InvalidFileType from 'components/upload/InvalidFileType'

import styles from './SelectPage.module.css'
import TracksPreview from './TracksPreview'
import UploadType from './uploadType'

class SelectPage extends Component {
  state = {
    showSelectServices: this.props.account
      ? !this.props.account.creator_node_endpoint
      : false
  }

  componentDidUpdate() {
    const { account } = this.props
    if (
      account &&
      !account.creator_node_endpoint &&
      !this.state.showSelectServices
    ) {
      this.setState({ showSelectServices: true })
    }
  }

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
    const { showSelectServices } = this.state

    const textAboveIcon = tracks.length > 0 ? 'More to Upload?' : null

    return (
      <div className={cn(styles.page)}>
        <div className={styles.select}>
          <div className={styles.dropzone}>
            <Dropzone textAboveIcon={textAboveIcon} onDrop={onSelect} />
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
        {showSelectServices && <SelectedServices requiresAtLeastOne />}
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
