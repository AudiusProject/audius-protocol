import { useCallback, useContext } from 'react'

import type { UserMetadata } from '@audius/common'
import { css } from '@emotion/native'
import { useField } from 'formik'
import LottieView from 'lottie-react-native'
import { Pressable } from 'react-native'

import {
  Box,
  Flex,
  FollowButton,
  IconNote,
  IconPause,
  IconPlay,
  IconUser,
  Paper,
  SoundwaveCircle,
  Text,
  useTheme
} from '@audius/harmony-native'
import {
  Divider,
  ProfilePicture,
  UserCoverPhoto,
  UserDisplayName
} from 'app/components/core'
import { StaticSkeleton } from 'app/components/skeleton'

import { SelectArtistsPreviewContext } from './selectArtistPreviewContext'

type FollowArtistFieldProps = {
  artist: UserMetadata
  showPreviewHint?: boolean
}

export const FollowArtistField = (props: FollowArtistFieldProps) => {
  const { artist, showPreviewHint } = props
  const { user_id, track_count, follower_count } = artist
  const { spacing } = useTheme()
  const [{ onChange }] = useField({ name: 'selectedArtists', type: 'checkbox' })
  const {
    hasPlayed,
    isPlaying,
    nowPlayingArtistId,
    togglePreview,
    playPreview
  } = useContext(SelectArtistsPreviewContext)

  const isPreviewing = nowPlayingArtistId === user_id

  const handlePress = useCallback(() => {
    if (isPreviewing) {
      togglePreview()
    } else {
      playPreview(user_id)
    }
  }, [isPreviewing, playPreview, togglePreview, user_id])

  return (
    <Paper>
      <Pressable onPress={handlePress}>
        <UserCoverPhoto
          userId={user_id}
          style={css({ height: 68 })}
          topCornerRadius='m'
        >
          {isPreviewing && isPlaying ? (
            <Box
              h='xl'
              w='xl'
              style={css({
                opacity: 0.6,
                position: 'absolute',
                right: spacing.s,
                top: spacing.s
              })}
            >
              <LottieView source={SoundwaveCircle} autoPlay />
            </Box>
          ) : null}
        </UserCoverPhoto>
      </Pressable>
      <Flex
        alignItems='center'
        pointerEvents='box-none'
        style={css({
          position: 'absolute',
          top: spacing['2xl'],
          left: 0,
          right: 0,
          zIndex: 1
        })}
      >
        <Pressable onPress={handlePress}>
          <ProfilePicture size='large' userId={user_id} variant='strong'>
            {showPreviewHint && !hasPlayed ? (
              <IconPlay size='l' color='staticWhite' />
            ) : null}
            {isPreviewing ? (
              isPlaying ? (
                <IconPause size='l' color='staticWhite' />
              ) : (
                <IconPlay size='l' color='staticWhite' />
              )
            ) : null}
          </ProfilePicture>
        </Pressable>
      </Flex>
      <Flex pt='unit12' ph='s' pb='l' alignItems='center' gap='l'>
        <Flex gap='s'>
          <UserDisplayName userId={user_id} />
          <Flex direction='row' gap='s' alignItems='center'>
            <Flex direction='row' gap='xs' alignItems='center'>
              <IconNote size='s' color='subdued' />
              <Text variant='body' size='s' strength='strong'>
                {track_count}
              </Text>
            </Flex>
            <Divider orientation='vertical' />
            <Flex direction='row' gap='xs' alignItems='center'>
              <IconUser size='s' color='subdued' />
              <Text variant='body' size='s' strength='strong'>
                {follower_count}
              </Text>
            </Flex>
          </Flex>
        </Flex>
        <Box w='100%'>
          <FollowButton
            variant='pill'
            size='small'
            value={user_id.toString()}
            onChange={onChange('selectedArtists')}
          />
        </Box>
      </Flex>
    </Paper>
  )
}

export const FollowArtistTileSkeleton = () => {
  return (
    <Paper h={220} direction='column' ph='m' pb='l'>
      <Flex
        direction='column'
        gap='s'
        style={{ marginTop: 34 }}
        alignItems='center'
        flex={1}
      >
        <StaticSkeleton
          height={72}
          width={72}
          style={css({ borderRadius: 36 })}
        />
        <StaticSkeleton height={16} width={150} />
        <StaticSkeleton height={20} width={100} />
      </Flex>
      <StaticSkeleton
        height={32}
        width='100%'
        style={css({ borderRadius: 16 })}
      />
    </Paper>
  )
}
