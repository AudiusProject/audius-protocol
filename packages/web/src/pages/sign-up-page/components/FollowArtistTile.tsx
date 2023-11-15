import { HTMLProps } from 'react'

import { UserMetadata } from '@audius/common'
import {
  Avatar,
  Box,
  Button,
  ButtonSize,
  ButtonType,
  Divider,
  Flex,
  IconNote,
  IconUser,
  IconUserFollow,
  IconVerified,
  Paper,
  Text
} from '@audius/harmony'

import audiusCoverPhoto from 'assets/img/4-Conductor-16-9.jpg'
import audiusProfilePic from 'assets/img/appIcon240.png'

type FollowArtistTileProps = {
  user: UserMetadata
} & HTMLProps<HTMLInputElement>

const FollowArtistTile = (props: FollowArtistTileProps) => {
  const {
    user: { name, user_id, is_verified, track_count, follower_count },
    onChange
  } = props
  return (
    <Paper w={235} h={220}>
      <Flex w='100%' direction='column' alignItems='center'>
        <Box w={72} h={72} css={{ position: 'absolute', top: 34 }}>
          <Avatar variant='strong' src={audiusProfilePic} />
        </Box>
        <Box
          w='100%'
          h={68}
          css={{ backgroundImage: `url(${audiusCoverPhoto})` }}
        />
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
          {/* TODO: Use Harmony FollowButton */}
          <label key={user_id}>
            <Flex alignItems='center' gap='xs'>
              <input
                type='checkbox'
                name={String(user_id)}
                onChange={onChange}
              />
              <IconUserFollow color='subdued' />
              Follow
            </Flex>
          </label>
        </Flex>
      </Flex>
    </Paper>
  )
}

export default FollowArtistTile
