import { memo, useCallback } from 'react'

import { imageBlank as placeholderArt } from '@audius/common/assets'
import { useImageSize } from '@audius/common/hooks'
import {
  Kind,
  Name,
  BadgeTier,
  SquareSizes,
  WidthSizes,
  ID
} from '@audius/common/models'
import { Nullable } from '@audius/common/utils'
import { Flex, spacing, Tag } from '@audius/harmony'
import cn from 'classnames'

import { make } from 'common/store/analytics/actions'
import DynamicImage from 'components/dynamic-image/DynamicImage'
import UserBadges from 'components/user-badges/UserBadges'
import { XShareButton } from 'components/x-share-button/XShareButton'
import { preload } from 'utils/image'

import styles from './SearchBarResult.module.css'

const messages = {
  disabledTag: 'Ai Attrib. Not Enabled',
  tweet: (handle: string) =>
    `Hey ${handle}, imagine AI generated tracks inspired by your sound! 🤖 Enable AI generated music on @AudiusMusic and see what your fans create using your tunes as their muse.`
}

type ImageProps = {
  kind: Kind
  isUser: boolean
  id: ID
  artwork: any
  defaultImage: string
  size: SquareSizes | WidthSizes
}

const Image = memo((props: ImageProps) => {
  const { defaultImage, artwork, size, isUser } = props
  const { imageUrl } = useImageSize({
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
        [styles.image]: imageUrl,
        [styles.userImage]: isUser,
        [styles.emptyUserImage]: isUser && imageUrl === defaultImage
      })}
      image={imageUrl}
    />
  )
})

type SearchBarResultProps = {
  kind: Kind
  id: ID
  userId: number
  primary: string
  secondary?: string
  artwork: any
  size: SquareSizes | WidthSizes
  defaultImage: string
  isVerifiedUser: boolean
  tier?: BadgeTier
  allowAiAttribution?: boolean
  name: string
  handle: string
}

export const SearchBarResult = memo((props: SearchBarResultProps) => {
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

  const handleXShare = useCallback(
    (xHandle: string, otherXHandle?: Nullable<string>) => {
      const shareText = messages.tweet(xHandle)
      const analytics = make(Name.NOTIFICATIONS_CLICK_TIP_SENT_TWITTER_SHARE, {
        text: shareText
      })
      return {
        shareText,
        analytics
      }
    },
    []
  )

  return (
    <Flex
      w='100%'
      h={spacing.unit12}
      gap='m'
      alignItems='center'
      justifyContent='flex-end'
      css={{
        position: 'relative',
        display: 'inline-flex'
      }}
    >
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
                size='xs'
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
                  size='xs'
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
          <XShareButton
            type='dynamic'
            handle={handle}
            name={name}
            shareData={handleXShare}
            hideText
          />
        </>
      ) : null}
    </Flex>
  )
})
