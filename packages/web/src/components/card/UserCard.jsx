import { formatCount } from '@audius/common'
import { SquareSizes } from '@audius/common/models'
import cn from 'classnames'
import PropTypes from 'prop-types'

import DynamicImage from 'components/dynamic-image/DynamicImage'
import UserBadges from 'components/user-badges/UserBadges'
import { useUserProfilePicture } from 'hooks/useUserProfilePicture'

import styles from './UserCard.module.css'

const UserCard = ({
  className,
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
          skeletonClassName={styles.coverArtSkeleton}
          className={styles.coverArt}
          image={profileImage}
        />
      </div>
      <div className={styles.textContainer}>
        <div className={styles.primaryText}>{name}</div>
        <UserBadges
          userId={id}
          className={styles.iconVerified}
          badgeSize={12}
        />
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
  isMobile: PropTypes.bool,
  followers: PropTypes.number,
  onFollow: PropTypes.func,
  selected: PropTypes.bool
}

UserCard.defaultProps = {
  onFollow: () => {},
  name: '',
  followers: 0,
  selected: false
}

export default UserCard
