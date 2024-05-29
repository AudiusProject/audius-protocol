import { useState } from 'react'

import { getUser } from '@audius/common/src/store/cache/users/selectors'
import { formatCount } from '@audius/common/src/utils/formatUtil'
import BadgeArtist from '@audius/harmony/src/assets/icons/ArtistBadge.svg'
import IconDonate from '@audius/harmony/src/assets/icons/Donate.svg'
import IconLink from '@audius/harmony/src/assets/icons/Link.svg'
import { Box } from '@audius/harmony/src/components/layout/Box'
import { Flex } from '@audius/harmony/src/components/layout/Flex'
import { Text } from '@audius/harmony/src/components/text'
import cn from 'classnames'

// import ProfilePageBadge from 'components/user-badges/ProfilePageBadge'
import { ServerUserGeneratedText } from 'components/user-generated-text/ServerUserGeneratedText'
import { useSelector } from 'utils/reducer'

import styles from './components/mobile/ProfileHeader.module.css'

const messages = {
  tracks: 'Tracks',
  followers: 'Followers',
  following: 'Following',
  playlists: 'Playlists',
  showMore: 'Show More',
  showLess: 'Show Less',
  editProfile: 'Edit Profile',
  profilePicAltText: 'User Profile Picture'
}

export type OwnProps = {
  // userId: ID
  userId: any
}

export const ServerProfilePage = ({ userId }: OwnProps) => {
  const user = useSelector((state) => getUser(state, { id: userId }))
  const [isDescriptionMinimized, setIsDescriptionMinimized] = useState(true)
  if (!user) return null

  const {
    bio,
    name,
    handle,
    cover_photo,
    profile_picture,
    track_count,
    playlist_count,
    follower_count,
    followee_count,
    donation,
    website
  } = user

  const isArtist = track_count > 0
  const hasEllipsis = donation || website

  return (
    <Flex direction='column' backgroundColor='default'>
      <Flex
        w='100%'
        h={96}
        direction='column'
        justifyContent='center'
        alignItems='center'
        css={{ overflow: 'hidden' }}
      >
        {/* @ts-ignore */}
        <Box as='img' src={cover_photo!} w='100%' />
        {isArtist && !user.is_deactivated ? (
          <BadgeArtist className={styles.badgeArtist} />
        ) : null}
      </Flex>
      <Box className={styles.profilePictureWrapper}>
        <Box
          as='img'
          // @ts-ignore
          src={profile_picture!}
          h='100%'
          w='100%'
          borderRadius='m'
        />
      </Box>
      <div className={styles.artistInfo}>
        <Flex justifyContent='space-between'>
          <Flex direction='column' gap='xs'>
            <Flex>
              <Text
                color='default'
                variant='title'
                size='l'
                css={{ lineHeight: '22px' }}
              >
                {name}
              </Text>
            </Flex>
            <Box css={{ textAlign: 'left', marginBottom: 14 }}>
              <Box className={styles.artistHandle}>{handle}</Box>
            </Box>
          </Flex>
        </Flex>

        <Flex inline justifyContent='flex-start' w='100%' mb='s' gap='l'>
          <Flex css={{ gap: 3 }}>
            <Text
              color='default'
              variant='title'
              size='s'
              strength='strong'
              css={{ lineHeight: 'normal' }}
            >
              {formatCount(isArtist ? track_count : playlist_count)}
            </Text>
            <Text
              color='subdued'
              variant='title'
              size='s'
              strength='weak'
              css={{ lineHeight: 'normal' }}
            >
              {isArtist ? messages.tracks : messages.playlists}
            </Text>
          </Flex>
          <Flex css={{ gap: 3 }}>
            <Text
              color='default'
              variant='title'
              size='s'
              strength='strong'
              css={{ lineHeight: 'normal' }}
            >
              {formatCount(follower_count)}
            </Text>
            <Text
              color='subdued'
              variant='title'
              size='s'
              strength='weak'
              css={{ lineHeight: 'normal' }}
            >
              {messages.followers}
            </Text>
          </Flex>
          <Flex css={{ gap: 3 }}>
            <Text
              color='default'
              variant='title'
              size='s'
              strength='strong'
              css={{ lineHeight: 'normal' }}
            >
              {formatCount(followee_count)}
            </Text>
            <Text
              color='subdued'
              variant='title'
              size='s'
              strength='weak'
              css={{ lineHeight: 'normal' }}
            >
              {messages.following}
            </Text>
          </Flex>
        </Flex>

        <Flex alignItems='center' gap='m'>
          {/* TODO: Need to add this once the profile page state is added to server state */}
          {/* <ProfilePageBadge userId={user.user_id} isCompact /> */}
        </Flex>

        {bio ? (
          <>
            <ServerUserGeneratedText
              color='subdued'
              size='s'
              className={cn(styles.bio, {
                [styles.bioExpanded]: hasEllipsis && !isDescriptionMinimized
              })}
            >
              {bio}
            </ServerUserGeneratedText>
          </>
        ) : null}
        {hasEllipsis && !isDescriptionMinimized ? (
          <div className={styles.sites}>
            {website && (
              <div className={styles.website} onClick={() => {}}>
                <IconLink size='m' color='default' />
                <span>{website}</span>
              </div>
            )}
            {donation && (
              <div className={styles.donation}>
                <IconDonate size='m' color='default' />
                <ServerUserGeneratedText size='s'>
                  {donation}
                </ServerUserGeneratedText>
              </div>
            )}
          </div>
        ) : null}

        {hasEllipsis ? (
          <div
            className={styles.expandDescription}
            onClick={() => setIsDescriptionMinimized(!isDescriptionMinimized)}
          >
            {isDescriptionMinimized ? messages.showMore : messages.showLess}
          </div>
        ) : null}
      </div>
    </Flex>
  )
}
