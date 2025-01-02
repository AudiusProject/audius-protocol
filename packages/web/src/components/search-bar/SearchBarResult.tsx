import { memo } from 'react'

import { useImageSize } from '@audius/common/hooks'
import { BadgeTier, Kind, SquareSizes } from '@audius/common/models'
import cn from 'classnames'

import DynamicImage from 'components/dynamic-image/DynamicImage'
import UserBadges from 'components/user-badges/UserBadges'
import { preload } from 'utils/image'

import searchBarStyles from './SearchBar.module.css'
import styles from './SearchBarResult.module.css'

type ImageProps = {
  defaultImage: string
  artwork: Record<SquareSizes, string>
  size: SquareSizes
  isUser: boolean
}

const Image = memo(({ defaultImage, artwork, size, isUser }: ImageProps) => {
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

type SearchBarResultProps = {
  kind: Kind
  userId: number
  primary: string
  secondary?: string
  artwork: Record<SquareSizes, string> | null
  size: SquareSizes | null
  defaultImage: string
  isVerifiedUser?: boolean
  tier: BadgeTier
}

const SearchBarResult = memo(
  ({
    kind,
    userId,
    primary,
    secondary,
    artwork,
    size,
    defaultImage,
    isVerifiedUser = false,
    tier
  }: SearchBarResultProps) => {
    const isUser = kind === Kind.USERS

    return (
      <div className={styles.searchBarResultContainer}>
        {artwork && size ? (
          <Image
            isUser={isUser}
            artwork={artwork}
            defaultImage={defaultImage}
            size={size}
          />
        ) : null}
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
  }
)

export default SearchBarResult
