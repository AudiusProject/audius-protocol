import { ID } from '@audius/common/src/models/Identifiers'
import { getUser } from '@audius/common/src/store/cache/users/selectors'
import BadgeArtist from '@audius/harmony/src/assets/icons/ArtistBadge.svg'
import { Box } from '@audius/harmony/src/components/layout/Box'
import { Flex } from '@audius/harmony/src/components/layout/Flex'
import { Text } from '@audius/harmony/src/components/text'

import { useSelector } from 'utils/reducer'

import styles from './components/desktop/ProfilePage.module.css'

export type OwnProps = {
  userId: ID
}

const messages = {
  tracks: 'Tracks',
  playlists: 'Playlists',
  followers: 'Followers',
  following: 'Following'
}

export const ServerProfilePage = ({ userId }: OwnProps) => {
  const user = useSelector((state) => getUser(state, { id: userId }))
  if (!user) return null

  const {
    cover_photo,
    handle,
    name,
    profile_picture,
    track_count,
    followee_count,
    follower_count,
    playlist_count
  } = user

  const isArtist = track_count > 0

  return (
    <Flex w='100%' direction='column'>
      <Box
        as='img'
        // @ts-ignore
        src={cover_photo}
        w='100%'
        h={376}
        css={{ objectFit: 'cover' }}
      />
      <div className={styles.profileWrapping}>
        <div className={styles.header}>
          <Box
            h={208}
            w={208}
            borderRadius='circle'
            css={{
              boxShadow: '0 2px 6px -2px #0d101280'
            }}
          >
            <Box
              h='100%'
              w='100%'
              as='img'
              // @ts-ignore
              src={profile_picture}
              css={{ border: '4px solid var(--harmony-n-25)' }}
              borderRadius='circle'
            />
          </Box>
          <div className={styles.nameWrapper}>
            <BadgeArtist
              css={{
                filter: 'drop-shadow(0 1px 4px rgba(0, 0, 0, 0.3))',
                visibility: isArtist ? 'visible' : 'hidden'
              }}
            />
            <Text
              variant='display'
              size='s'
              strength='strong'
              color='staticWhite'
              css={{ letterSpacing: 0.5 }}
            >
              {name}
            </Text>
            <div className={styles.handleWrapper}>
              <h2 className={styles.handle}>@{handle}</h2>
            </div>
          </div>
        </div>
      </div>

      {/* Stat Banner */}
      <Flex
        h={56}
        w='100%'
        justifyContent='center'
        alignItems='center'
        backgroundColor='surface1'
        borderBottom='default'
      >
        <Flex
          justifyContent='space-between'
          w={756}
          css={{
            marginLeft: 233,
            paddingLeft: 30,
            paddingRight: 16
          }}
        >
          <Flex justifyContent='space-between' alignItems='center' w={330}>
            <Flex
              direction='column'
              justifyContent='center'
              alignItems='center'
              gap='xs'
            >
              <Text
                variant='label'
                strength='strong'
                color='default'
                css={{ fontSize: 22, lineHeight: '22px' }}
              >
                {isArtist ? track_count : playlist_count}
              </Text>
              <Text
                variant='label'
                size='s'
                strength='strong'
                color='subdued'
                css={{ letterSpacing: 0.75 }}
              >
                {isArtist ? messages.tracks : messages.playlists}
              </Text>
            </Flex>
            <Flex
              direction='column'
              justifyContent='center'
              alignItems='center'
              gap='xs'
            >
              <Text
                variant='label'
                strength='strong'
                color='default'
                css={{ fontSize: 22, lineHeight: '22px' }}
              >
                {follower_count}
              </Text>
              <Text
                variant='label'
                size='s'
                strength='strong'
                color='subdued'
                css={{ letterSpacing: 0.75 }}
              >
                {messages.followers}
              </Text>
            </Flex>
            <Flex
              direction='column'
              justifyContent='center'
              alignItems='center'
              gap='xs'
            >
              <Text
                variant='label'
                strength='strong'
                color='default'
                css={{ fontSize: 22, lineHeight: '22px' }}
              >
                {followee_count}
              </Text>
              <Text
                variant='label'
                size='s'
                strength='strong'
                color='subdued'
                css={{ letterSpacing: 0.75 }}
              >
                {messages.following}
              </Text>
            </Flex>
          </Flex>
        </Flex>
      </Flex>

      {/* Nav Banner */}
      <Flex h={48} w='100%' backgroundColor='surface1' />
    </Flex>
  )
}
