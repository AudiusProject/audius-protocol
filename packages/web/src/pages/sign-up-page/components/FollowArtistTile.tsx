import { HTMLProps } from 'react'

import { ID, UserMetadata, WidthSizes } from '@audius/common'
import {
  Box,
  Divider,
  Flex,
  FollowButton,
  IconNote,
  IconUser,
  IconVerified,
  Paper,
  Text
} from '@audius/harmony'
import { useField } from 'formik'

import { Avatar } from 'components/avatar/Avatar'
import { useMedia } from 'hooks/useMedia'
import { useCoverPhoto } from 'hooks/useUserCoverPhoto'

type FollowArtistTileProps = {
  user: UserMetadata
  onPreviewClick: (userId: ID, source: string) => void
} & HTMLProps<HTMLInputElement>

const FollowArtistTile = (props: FollowArtistTileProps) => {
  const {
    user: { name, user_id, is_verified, track_count, follower_count },
    onPreviewClick
  } = props
  const { isMobile } = useMedia()
  const coverPhoto = useCoverPhoto(user_id, WidthSizes.SIZE_640)
  const [followField] = useField({ name: 'selectedArtists', type: 'checkbox' })

  return (
    <Paper
      h={220}
      css={{
        width: isMobile ? 'calc(50% - 4px)' : 235
      }}
    >
      <Flex w='100%' direction='column' alignItems='center'>
        <Box
          w={72}
          h={72}
          css={{ position: 'absolute', top: 34 }}
          onClick={() => {
            onPreviewClick(
              user_id,
              'https://discoveryprovider2.audius.co/v1/tracks/Kdb0BgY/stream'
            )
          }}
        >
          <Avatar variant='strong' userId={user_id} />
        </Box>
        <Box w='100%' h={68} css={{ backgroundImage: `url(${coverPhoto})` }} />
        <Flex
          direction='column'
          alignItems='center'
          gap='l'
          pt='3xl'
          pb='l'
          ph='s'
          w='100%'
        >
          <Flex direction='column' alignItems='center' gap='s'>
            <Flex direction='row' gap='xs' alignItems='center'>
              <Text
                variant='title'
                size='s'
                strength='default'
                css={{
                  // TODO: Need to contain width
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {name}
              </Text>
              {is_verified ? (
                <IconVerified css={{ width: 12, height: 12 }} />
              ) : null}
            </Flex>
            <Flex direction='row' gap='s' alignItems='center'>
              <Flex direction='row' gap='xs' alignItems='center'>
                <IconNote width={16} height={16} color='subdued' />
                <Text variant='body' size='s' strength='strong'>
                  {track_count}
                </Text>
              </Flex>
              <Divider />
              <Flex direction='row' gap='xs' alignItems='center'>
                <IconUser width={16} height={16} color='subdued' />
                <Text variant='body' size='s' strength='strong'>
                  {follower_count}
                </Text>
              </Flex>
            </Flex>
          </Flex>
          <FollowButton
            variant='pill'
            type='checkbox'
            {...followField}
            isFollowing={followField.value.includes(user_id.toString())}
            value={user_id}
          />
        </Flex>
      </Flex>
    </Paper>
  )
}

export default FollowArtistTile
