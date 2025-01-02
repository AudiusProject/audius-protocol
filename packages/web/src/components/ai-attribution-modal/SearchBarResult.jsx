import { useEffect, memo, useCallback } from 'react'

import { imageBlank as placeholderArt } from '@audius/common/assets'
import { useImageSize } from '@audius/common/hooks'
import { Kind } from '@audius/common/models'
import { cacheUsersActions } from '@audius/common/store'
import { Tag } from '@audius/harmony'
import cn from 'classnames'
import PropTypes from 'prop-types'
import { useDispatch } from 'react-redux'

import DynamicImage from 'components/dynamic-image/DynamicImage'
import { TwitterShareButton } from 'components/notification/Notification/components/TwitterShareButton'
import UserBadges from 'components/user-badges/UserBadges'
import { preload } from 'utils/image'

import styles from './SearchBarResult.module.css'

const messages = {
  disabledTag: 'Ai Attrib. Not Enabled',
  tweet: (handle) =>
    `Hey ${handle}, imagine AI generated tracks inspired by your sound! 🤖 Enable AI generated music on @AudiusMusic and see what your fans create using your tunes as their muse. #AudiusAI`
}

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
    primary,
    secondary,
    artwork,
    size,
    defaultImage = placeholderArt,
    isVerifiedUser,
    tier,
    allowAiAttribution,
    name,
    handle
  } = props
  const isUser = kind === Kind.USERS
  const { fetchUserSocials } = cacheUsersActions
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(fetchUserSocials(handle))
  }, [dispatch, fetchUserSocials, handle])

  const handleTwitterShare = useCallback((handle) => {
    const shareText = messages.tweet(handle)
    return { shareText }
  }, [])

  return (
    <div className={styles.searchBarResultContainer}>
      <span className={styles.userInfo}>
        <Image
          kind={kind}
          isUser={isUser}
          id={id}
          artwork={artwork}
          defaultImage={defaultImage}
          size={size}
        />
        <div
          className={cn(styles.textContainer, {
            [styles.disabled]: !allowAiAttribution
          })}
        >
          <span
            className={cn(styles.primaryContainer, {
              [styles.hoverable]: allowAiAttribution
            })}
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
            <span className={cn(styles.secondaryContainer)}>
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
      </span>
      {!allowAiAttribution ? (
        <>
          <Tag>{messages.disabledTag}</Tag>
          <TwitterShareButton
            className={styles.twitterButton}
            type='dynamic'
            handle={handle}
            name={name}
            shareData={handleTwitterShare}
            hideText
          />
        </>
      ) : null}
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
  size: PropTypes.string,
  defaultImage: PropTypes.string,
  isVerifiedUser: PropTypes.bool
}

export default SearchBarResult
