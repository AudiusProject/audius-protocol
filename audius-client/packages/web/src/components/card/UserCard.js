import React from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'
import { formatCount } from 'utils/formatUtil'

import styles from './UserCard.module.css'
import { ReactComponent as IconVerified } from 'assets/img/iconVerified.svg'
import DynamicImage from 'components/dynamic-image/DynamicImage'
import { SquareSizes } from 'models/common/ImageSizes'
import { useUserProfilePicture } from 'hooks/useImageSize'

const UserCard = ({
  className,
  isVerified,
  followers,
  id,
  imageSizes,
  name,
  selected,
  onClick,
  isMobile
}) => {
  const profileImage = useUserProfilePicture(
    id,
    imageSizes,
    SquareSizes.SIZE_150_BY_150
  )

  return (
    <div
      className={cn(styles.cardContainer, className, {
        [styles.desktop]: !isMobile,
        [styles.mobile]: isMobile,
        [styles.selected]: selected
      })}
      onClick={onClick}
    >
      <div className={styles.tileCoverArtContainer}>
        <DynamicImage
          wrapperClassName={styles.coverArtWrapper}
          className={styles.coverArt}
          image={profileImage}
        />
      </div>
      <div className={styles.textContainer}>
        <div className={styles.primaryText}>{name}</div>
        {isVerified ? <IconVerified className={styles.iconVerified} /> : null}
      </div>
      <div className={styles.secondaryText}>
        {`${formatCount(followers)} Followers`}
      </div>
    </div>
  )
}

UserCard.propTypes = {
  className: PropTypes.string,
  name: PropTypes.string,
  isVerified: PropTypes.bool,
  isMobile: PropTypes.bool,
  followers: PropTypes.number,
  onFollow: PropTypes.func,
  selected: PropTypes.bool
}

UserCard.defaultProps = {
  isVerified: true,
  onFollow: () => {},
  name: '',
  followers: 0,
  selected: false
}

export default UserCard
