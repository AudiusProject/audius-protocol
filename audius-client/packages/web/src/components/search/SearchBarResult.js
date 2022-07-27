import { useState, useEffect, memo } from 'react'

import { Kind } from '@audius/common'
import cn from 'classnames'
import PropTypes from 'prop-types'

import placeholderArt from 'assets/img/imageBlank2x.png'
import DynamicImage from 'components/dynamic-image/DynamicImage'
import UserBadges from 'components/user-badges/UserBadges'
import AudiusBackend from 'services/AudiusBackend'
import { getCreatorNodeIPFSGateways } from 'utils/gatewayUtil'

import searchBarStyles from './SearchBar.module.css'
import styles from './SearchBarResult.module.css'

const Image = memo((props) => {
  const { defaultImage, imageMultihash, size, isUser } = props
  const [image, setImage] = useState(imageMultihash ? '' : defaultImage)
  useEffect(() => {
    if (!imageMultihash) return
    let isCanceled = false
    const getImage = async () => {
      try {
        const gateways = getCreatorNodeIPFSGateways(props.creatorNodeEndpoint)
        const url = await AudiusBackend.getImageUrl(
          imageMultihash,
          size,
          gateways
        )
        if (!isCanceled) setImage(url || defaultImage)
      } catch (err) {
        if (!isCanceled) setImage(defaultImage)
      }
    }
    getImage()
    return () => {
      isCanceled = true
    }
  }, [defaultImage, imageMultihash, props.creatorNodeEndpoint, size])
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
    imageMultihash,
    creatorNodeEndpoint,
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
        imageMultihash={imageMultihash}
        creatorNodeEndpoint={creatorNodeEndpoint}
        defaultImage={defaultImage}
        size={size}
      />
      <div className={styles.textContainer}>
        <span
          className={cn(styles.primaryContainer, searchBarStyles.resultText)}>
          <div className={styles.primaryText}>{primary}</div>
          {isUser && (
            <UserBadges
              className={styles.verified}
              userId={userId}
              badgeSize={10}
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
            )}>
            {secondary}
            {!isUser && (
              <UserBadges
                className={styles.verified}
                userId={userId}
                badgeSize={8}
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
  imageMultihash: PropTypes.string,
  creatorNodeEndpoint: PropTypes.string,
  size: PropTypes.string,
  defaultImage: PropTypes.string,
  isVerifiedUser: PropTypes.bool
}

SearchBarResult.defaultProps = {
  imageUrl: placeholderArt
}

export default SearchBarResult
