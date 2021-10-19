import React, { Component } from 'react'

import cn from 'classnames'
import PropTypes from 'prop-types'

import { ReactComponent as IconArrow } from 'assets/img/iconArrow.svg'
import placeholderArt from 'assets/img/imageBlank2x.png'
import { DefaultSizes } from 'common/models/ImageSizes'
import Toast from 'components/toast/Toast'
import {
  TrackArtwork,
  CollectionArtwork
} from 'components/track/desktop/Artwork'
import PlaylistTile from 'components/track/desktop/PlaylistTile'
import TrackListItem from 'components/track/desktop/TrackListItem'
import TrackTile from 'components/track/desktop/TrackTile'
import { TrackTileSize } from 'components/track/types'
import { ComponentPlacement } from 'components/types'
import ProgressBar from 'components/upload/ProgressBar'
import UserBadges from 'containers/user-badges/UserBadges'

import { ProgressStatus } from '../store/types'

import styles from './FinishPage.module.css'
import ShareBanner from './ShareBanner'
import UploadType from './uploadType'

const TOAST_DELAY_MILLIS = 5 * 1000

const messages = {
  processing: 'Processing...',
  complete: 'Complete!',
  error: 'Error uploading one or more files, please try again'
}

const getShareUploadType = (uploadType, tracks) => {
  switch (uploadType) {
    case UploadType.INDIVIDUAL_TRACK: {
      if (tracks.length > 0 && tracks[0].metadata.remix_of) {
        return 'Remix'
      }
      return 'Track'
    }
    case UploadType.INDIVIDUAL_TRACKS:
      return 'Tracks'
    case UploadType.PLAYLIST:
      return 'Playlist'
    case UploadType.ALBUM:
      return 'Album'
    default:
      return ''
  }
}

const getUploadText = ({ loaded, total, status, isCreator }) => {
  if (!isCreator) return '1%'
  if (status === ProgressStatus.COMPLETE) return messages.complete
  if (!loaded || loaded === 0) return '0%'
  if (loaded !== total) return `${Math.round((loaded / total) * 100)} %`
  return messages.processing
}

class FinishPage extends Component {
  constructor(props) {
    super(props)
    this.state = {
      showToast: false,
      didShowToast: false
    }
  }

  componentDidUpdate() {
    if (
      this.props.erroredTracks.length > 0 &&
      this.props.uploadType === UploadType.INDIVIDUAL_TRACKS &&
      !this.state.didShowToast
    ) {
      this.setState({
        showToast: true,
        didShowToast: true
      })

      setTimeout(() => {
        this.setState({ showToast: false })
      }, TOAST_DELAY_MILLIS)
    }
  }

  renderProgressBar = ({
    uploadText,
    uploadPercent,
    hasErrored = undefined
  }) => (
    <div className={cn(styles.uploadingInfo)}>
      <div className={styles.progressBar}>
        <ProgressBar
          percent={uploadPercent}
          status={
            hasErrored
              ? 'exception'
              : uploadText === 'Complete!' || uploadPercent !== 100
              ? 'normal'
              : 'active'
          }
        />
      </div>
      <div
        className={cn(styles.uploadText, {
          [styles.uploadComplete]: uploadText === 'Complete!'
        })}
      >
        {uploadText}
      </div>
    </div>
  )

  render() {
    const {
      account,
      tracks,
      uploadProgress,
      upload,
      metadata,
      uploadType,
      inProgress,
      onContinue,
      erroredTracks,
      isFirstUpload
    } = this.props

    const tileProps = {
      size: TrackTileSize.LARGE,
      isActive: false,
      isDisabled: true,
      showArtworkIcon: false,
      disableActions: true,
      uploading: true,
      showSkeleton: false
    }

    const erroredTrackSet = new Set(erroredTracks)
    const isCreator = account.is_creator

    let content
    if (
      uploadType === UploadType.INDIVIDUAL_TRACK ||
      uploadType === UploadType.INDIVIDUAL_TRACKS
    ) {
      content = tracks.map((track, i) => {
        const hasErrored = erroredTrackSet.has(i)
        const userName = (
          <div className={styles.userName}>
            <span className={styles.createdBy}>{account.name}</span>
            <UserBadges
              userId={account.user_id}
              className={styles.iconVerified}
              badgeSize={12}
            />
          </div>
        )

        // If we're waiting around to upgrade to become a creator,
        // fake out the user by setting everything to 1% so it doesn't
        // look totally stalled.
        const uploadPercent = isCreator
          ? (uploadProgress[i].loaded / uploadProgress[i].total) * 100
          : 1

        const artwork = (
          <TrackArtwork
            id={1} // Note the ID must be present to render the default overide image
            coverArtSizes={{
              [DefaultSizes.OVERRIDE]: track.metadata.artwork.url
                ? track.metadata.artwork.url
                : placeholderArt
            }}
            size={'large'}
            isBuffering={false}
            isPlaying={false}
            showArtworkIcon={false}
            showSkeleton={false}
          />
        )
        const uploadText = getUploadText({ ...uploadProgress[i], isCreator })
        const bottomBar = this.renderProgressBar({
          uploadText,
          uploadPercent,
          hasErrored
        })

        return (
          <div key={track.metadata.title + i} className={styles.trackTile}>
            <TrackTile
              userName={userName}
              title={track.metadata.title}
              standalone
              artwork={artwork}
              bottomBar={bottomBar}
              showIconButtons={false}
              coverArtSizes={{
                [DefaultSizes.OVERRIDE]: track.metadata.artwork.url
                  ? track.metadata.artwork.url
                  : placeholderArt
              }}
              {...tileProps}
            />
          </div>
        )
      })
    } else {
      let header = 'ALBUM'
      if (uploadType === UploadType.PLAYLIST) {
        header = 'PLAYLIST'
      }
      const t = tracks.map(track => {
        const { duration } = track.preview
        return {
          ...track.metadata,
          user: account,
          duration: duration
        }
      })
      const loaded = uploadProgress.reduce((avg, v) => avg + v.loaded, 0)
      const total = uploadProgress.reduce((avg, v) => avg + v.total, 0)

      const status =
        // Don't show complete until inProgress = false, to allow
        // the saga to perform final processing steps (e.g. create a playlist after uploading tracks)
        uploadProgress
          .map(u => u.status)
          .every(s => s === ProgressStatus.COMPLETE) && !inProgress
          ? ProgressStatus.COMPLETE
          : ProgressStatus.UPLOADING

      // Same hack as for multitrack upload
      // show 1% if upgrading
      const averagePercent = isCreator ? (loaded / total) * 100 : 1

      const uploadText = getUploadText({ loaded, total, status, isCreator })
      const bottomBar = this.renderProgressBar({
        uploadText,
        uploadPercent: averagePercent
      })

      const userName = (
        <div className={styles.userName}>
          <span className={styles.createdBy}>{`Created by `}</span>
          <span className={styles.createdBy}>{account.name}</span>
          <UserBadges
            userId={account.user_id}
            className={styles.iconVerified}
            badgeSize={12}
          />
        </div>
      )

      const artwork = (
        <CollectionArtwork
          id={1} // Note the ID must be present to render the default overide image
          coverArtSizes={{
            [DefaultSizes.OVERRIDE]:
              metadata.artwork && metadata.artwork.url
                ? metadata.artwork.url
                : placeholderArt
          }}
          size={'large'}
          isBuffering={false}
          isPlaying={false}
          showArtworkIcon={false}
          showSkeleton={false}
        />
      )

      const trackList = t.map((track, i) => (
        <TrackListItem
          index={i}
          key={`${track.title}+${i}`}
          isLoading={false}
          active={false}
          size={TrackTileSize.LARGE}
          disableActions={true}
          playing={false}
          track={track}
          artistHandle={account.handle}
        />
      ))

      content = (
        <PlaylistTile
          header={header}
          userName={userName}
          trackList={trackList}
          title={metadata.playlist_name}
          artwork={artwork}
          activeTrackUid={false} // No track should show as active
          bottomBar={bottomBar}
          showIconButtons={false}
          containerClassName={styles.trackListContainer}
          {...tileProps}
        />
      )
    }

    let continueText
    switch (uploadType) {
      case UploadType.INDIVIDUAL_TRACK:
        continueText = 'View Track Page'
        break
      case UploadType.PLAYLIST:
        continueText = 'View Playlist'
        break
      case UploadType.ALBUM:
        continueText = 'View Album'
        break
      default:
        continueText = 'View Tracks'
    }
    const shareUploadType = getShareUploadType(uploadType, tracks)
    return (
      <Toast
        firesOnClick={false}
        text={messages.error}
        open={this.state.showToast}
        placement={ComponentPlacement.BOTTOM}
      >
        <div className={styles.finish}>
          {!isFirstUpload && (
            <ShareBanner
              type={shareUploadType}
              isHidden={inProgress}
              tracks={tracks}
              upload={upload}
              metadata={metadata}
              user={account}
            />
          )}
          {content}
          <div className={styles.buttons}>
            <div
              name='viewMedia'
              onClick={inProgress ? undefined : onContinue}
              className={cn(styles.continueButton, {
                [styles.isHidden]: inProgress
              })}
            >
              <div>{continueText}</div>
              <IconArrow className={styles.iconArrow} />
            </div>
          </div>
        </div>
      </Toast>
    )
  }
}

FinishPage.propTypes = {
  account: PropTypes.object,
  tracks: PropTypes.array,
  uploadType: PropTypes.oneOf(Object.values(UploadType)),
  uploadProgress: PropTypes.array,
  /** Whether an upload is in progress. Only shows actions after upload is 'done.' */
  inProgress: PropTypes.bool,
  onContinue: PropTypes.func,
  isFirstUpload: PropTypes.bool
}

export default FinishPage
