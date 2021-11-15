import React from 'react'

import cn from 'classnames'
import PropTypes from 'prop-types'

import { SquareSizes } from 'common/models/ImageSizes'
import { formatCount } from 'common/utils/formatUtil'
import ArtistPopover from 'components/artist/ArtistPopover'
import DynamicImage from 'components/dynamic-image/DynamicImage'
import UserBadges from 'containers/user-badges/UserBadges'
import { useUserProfilePicture } from 'hooks/useImageSize'

import styles from './ArtistChip.module.css'

const ArtistChip = props => {
  const profilePicture = useUserProfilePicture(
    props.userId,
    props.profilePictureSizes,
    SquareSizes.SIZE_150_BY_150
  )

  return (
    <div
      className={cn(styles.artistChip, {
        [props.className]: !!props.className
      })}
    >
      <DynamicImage
        wrapperClassName={styles.profilePictureWrapper}
        className={styles.profilePicture}
        image={profilePicture}
      />
      <div className={styles.text}>
        <div
          className={cn(styles.name, 'name')}
          onClick={props.onClickArtistName}
        >
          {props.showPopover ? (
            <ArtistPopover handle={props.handle}>{props.name}</ArtistPopover>
          ) : (
            props.name
          )}
          <UserBadges
            userId={props.userId}
            className={styles.verified}
            badgeSize={10}
          />
        </div>
        <div className={cn(styles.followers, 'followers')}>
          {formatCount(props.followers)}{' '}
          {props.followers === 1 ? 'Follower' : 'Followers'}
        </div>
      </div>
    </div>
  )
}

ArtistChip.propTypes = {
  className: PropTypes.string,
  userId: PropTypes.number,
  profilePictureSizes: PropTypes.object,
  name: PropTypes.string,
  handle: PropTypes.string,
  followers: PropTypes.number,
  onClickArtistName: PropTypes.func,
  showPopover: PropTypes.bool
}

ArtistChip.defaultProps = {
  name: '',
  followers: 0,
  showPopover: true
}

export default ArtistChip
