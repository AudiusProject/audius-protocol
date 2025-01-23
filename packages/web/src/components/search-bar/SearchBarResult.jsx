import { memo } from 'react'

import { imageBlank as placeholderArt } from '@audius/common/assets'
import { useImageSize } from '@audius/common/hooks'
import { Kind } from '@audius/common/models'
import cn from 'classnames'
import PropTypes from 'prop-types'

import DynamicImage from 'components/dynamic-image/DynamicImage'
import UserBadges from 'components/user-badges/UserBadges'
import { preload } from 'utils/image'

import searchBarStyles from './SearchBar.module.css'
import styles from './SearchBarResult.module.css'

const Image = memo((props) => {
  const { defaultImage, artwork, size, isUser } = props
  const image = useImageSize({
    artwork,
    targetSize: size,
    defaultImage,
    preloadImageFn: preload
  })
  return (
    <DynamicImage
      skeletonClassName={cn({ [styles.userImageContainerSkeleton]: isUser })}
      wrapperClassName={cn(styles.imageContainer)}
      className={cn({
        [styles.image]: image,
        [styles.userImage]: isUser,
        [styles.emptyUserImage]: isUser && image === defaultImage
      })}
      image={image}
    />
  )
})

const SearchBarResult = memo((props) => {
  const {
    kind,
    id,
    userId,
    sizes,
    primary,
    secondary,
    artwork,
    size,
    defaultImage,
    isVerifiedUser,
    tier
  } = props
  const isUser = kind === Kind.USERS

  return (
    <div className={styles.searchBarResultContainer}>
      <Image
        kind={kind}
        isUser={isUser}
        id={id}
        sizes={sizes}
        artwork={artwork}
        defaultImage={defaultImage}
        size={size}
      />
      <div className={styles.textContainer}>
        <span
          className={cn(styles.primaryContainer, searchBarStyles.resultText)}
        >
          <div className={styles.primaryText}>{primary}</div>
          {isUser && (
            <UserBadges
              className={styles.verified}
              userId={userId}
              badgeSize={12}
              isVerifiedOverride={isVerifiedUser}
              overrideTier={tier}
            />
          )}
        </span>
        {secondary ? (
          <span
            className={cn(
              styles.secondaryContainer,
              searchBarStyles.resultText
            )}
          >
            <span>{secondary}</span>
            {!isUser && (
              <UserBadges
                className={styles.verified}
                userId={userId}
                badgeSize={10}
                isVerifiedOverride={isVerifiedUser}
                overrideTier={tier}
              />
            )}
          </span>
        ) : null}
      </div>
    </div>
  )
})

SearchBarResult.propTypes = {
  imageUrl: PropTypes.string.isRequired,
  primary: PropTypes.string.isRequired,
  secondary: PropTypes.string,
  kind: PropTypes.string,
  id: PropTypes.string,
  sizes: PropTypes.object,
  artwork: PropTypes.object,
  size: PropTypes.string,
  defaultImage: PropTypes.string,
  isVerifiedUser: PropTypes.bool
}

SearchBarResult.defaultProps = {
  imageUrl: placeholderArt
}

export default SearchBarResult
