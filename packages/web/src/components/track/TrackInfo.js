import { PureComponent } from 'react'

import cn from 'classnames'
import PropTypes from 'prop-types'

import IconVolume from 'assets/img/iconVolume.svg'
import { ArtistPopover } from 'components/artist/ArtistPopover'
import Skeleton from 'components/skeleton/Skeleton'
import UserBadges from 'components/user-badges/UserBadges'

import styles from './TrackInfo.module.css'

class TrackInfo extends PureComponent {
  onClickTrackName = (e) => {
    e.stopPropagation()
    if (!this.props.disabled && this.props.onClickTrackName)
      this.props.onClickTrackName()
  }

  onClickArtistName = (e) => {
    e.stopPropagation()
    if (!this.props.disabled && this.props.onClickArtistName)
      this.props.onClickArtistName()
  }

  render() {
    const {
      contentTitle,
      isLoading,
      trackTitle,
      active,
      artistName,
      disabled,
      artistHandle,
      size,
      onClickTrackName,
      onClickArtistName,
      popover,
      condense,
      userId
    } = this.props

    const style = {
      [styles.extraLarge]: size === 'extraLarge',
      [styles.large]: size === 'large',
      [styles.medium]: size === 'medium',
      [styles.small]: size === 'small',
      [styles.tiny]: size === 'tiny',
      [styles.miniscule]: size === 'miniscule'
    }

    const trackTitleStyle = cn(styles.trackTitle, style, {
      [styles.active]: active,
      [styles.condense]: condense
    })
    const artistNameStyle = cn(styles.artistName, style, {
      [styles.active]: active,
      [styles.playlistCreator]: contentTitle === 'playlist'
    })

    const hideShow = cn({
      [styles.hide]: isLoading,
      [styles.show]: !isLoading
    })

    return (
      <div
        className={cn(styles.trackInfoWrapper, {
          [styles.disabled]: disabled
        })}
      >
        <div className={trackTitleStyle}>
          <div className={hideShow}>
            <div
              className={cn(styles.trackName, {
                [styles.trackNameLink]: onClickTrackName
              })}
              onClick={this.onClickTrackName}
            >
              {trackTitle}
            </div>
            {active ? (
              <span className={styles.volumeIcon}>
                <IconVolume />
              </span>
            ) : null}
          </div>
          {isLoading && <Skeleton width='80%' className={styles.skeleton} />}
        </div>
        <div className={artistNameStyle}>
          <div className={hideShow}>
            {contentTitle === 'playlist' ? (
              <span className={styles.createdBy}>{'Created by'}</span>
            ) : null}
            {popover ? (
              <ArtistPopover handle={artistHandle}>
                <span
                  className={cn({ [styles.artistNameLink]: onClickArtistName })}
                  onClick={this.onClickArtistName}
                >
                  {artistName}
                </span>
              </ArtistPopover>
            ) : (
              <span
                className={cn(styles.artistName, {
                  [styles.artistNameLink]: onClickArtistName
                })}
                onClick={this.onClickArtistName}
              >
                {artistName}
              </span>
            )}
            {
              <UserBadges
                userId={userId}
                className={styles.iconVerified}
                badgeSize={10}
              />
            }
          </div>
          {isLoading && <Skeleton width='60%' className={styles.skeleton} />}
        </div>
      </div>
    )
  }
}

TrackInfo.propTypes = {
  trackTitle: PropTypes.string,
  artistName: PropTypes.string,
  artistHandle: PropTypes.string,
  isLoading: PropTypes.bool,
  condense: PropTypes.bool,
  size: PropTypes.oneOf([
    'extraLarge',
    'large',
    'medium',
    'small',
    'tiny',
    'miniscule'
  ]),
  popover: PropTypes.bool,
  disabled: PropTypes.bool,
  onClickTrackName: PropTypes.func,
  onClickArtistName: PropTypes.func,
  userId: PropTypes.number
}

TrackInfo.defaultProps = {
  trackTitle: '\u200B',
  artistName: '\u200B',
  artistHandle: '',
  size: 'medium',
  active: false,
  disabled: false,
  condense: false,
  isLoading: false,
  routeArtistPage: false,
  routeTrackPage: false,
  popover: true
}

export default TrackInfo
