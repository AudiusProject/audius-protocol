import { HTMLProps } from 'react'

import { UserMetadata, imageProfilePicEmpty } from '@audius/common'
import {
  Avatar,
  Box,
  Divider,
  Flex,
  IconNote,
  IconUser,
  IconVerified,
  Paper,
  Text
} from '@audius/harmony'

type FollowArtistTileProps = {
  user: UserMetadata
} & HTMLProps<HTMLInputElement>

const FollowArtistTile = (props: FollowArtistTileProps) => {
  const {
    user: {
      user_id,
      name,
      cover_photo,
      profile_picture_sizes,
      is_verified,
      track_count,
      follower_count
    },
    checked,
    onChange
  } = props
  return (
    <Paper css={{ minWidth: 200 }}>
      <Flex w='100%' h='100%' direction='column' alignItems='center'>
        <Box w='100%' h={68} css={{ backgroundImage: `url(${cover_photo})` }} />
        <Box w={72} h={72}>
          <Avatar
            variant='strong'
            src={profile_picture_sizes ?? imageProfilePicEmpty}
          />
        </Box>
        <Flex direction='column' alignItems='center' gap='l' p='s'>
          <Flex direction='column' alignItems='center' gap='s'>
            <Flex direction='row' gap='xs' alignItems='center'>
              <Text variant='title' size='s' strength='default'>
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
              {/* TODO: Divider height not working */}
              <Divider />
              <Flex direction='row' gap='xs' alignItems='center'>
                <IconUser width={16} height={16} color='subdued' />
                <Text variant='body' size='s' strength='strong'>
                  {follower_count}
                </Text>
              </Flex>
            </Flex>
          </Flex>
          <label key={user_id}>
            <input
              type='checkbox'
              name={String(user_id)}
              onChange={onChange}
              checked={checked}
            />
            {name}
          </label>
        </Flex>
      </Flex>
    </Paper>
  )
}

export default FollowArtistTile
