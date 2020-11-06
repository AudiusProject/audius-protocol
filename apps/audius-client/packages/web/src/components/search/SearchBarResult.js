import React, { useState, useEffect, memo } from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'

import { ReactComponent as IconVerified } from 'assets/img/iconVerified.svg'
import styles from './SearchBarResult.module.css'
import searchBarStyles from './SearchBar.module.css'
import placeholderArt from 'assets/img/imageBlank2x.png'
import AudiusBackend from 'services/AudiusBackend'
import DynamicImage from 'components/dynamic-image/DynamicImage'
import { getCreatorNodeIPFSGateways } from 'utils/gatewayUtil'
import { Kind } from 'store/types'

const Image = memo(props => {
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

const SearchBarResult = memo(props => {
  const {
    kind,
    isVerifiedUser,
    id,
    sizes,
    primary,
    secondary,
    imageMultihash,
    creatorNodeEndpoint,
    size,
    defaultImage
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
          className={cn(styles.primaryContainer, searchBarStyles.resultText)}
        >
          <div className={styles.primaryText}>{primary}</div>
          {isUser && isVerifiedUser && (
            <IconVerified className={styles.verified} />
          )}
        </span>
        {secondary ? (
          <span
            className={cn(
              styles.secondaryContainer,
              searchBarStyles.resultText
            )}
          >
            {secondary}
            {!isUser && isVerifiedUser && (
              <IconVerified className={styles.verified} />
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
  isVerifiedUser: PropTypes.bool,
  imageMultihash: PropTypes.string,
  creatorNodeEndpoint: PropTypes.string,
  size: PropTypes.string,
  defaultImage: PropTypes.string
}

SearchBarResult.defaultProps = {
  imageUrl: placeholderArt,
  isVerifiedUser: false
}

export default SearchBarResult
