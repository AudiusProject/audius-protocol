import { useCallback } from 'react'

import { SquareSizes } from '@audius/common/models'
import type {
  SearchUser,
  User,
  SearchTrack,
  Track
} from '@audius/common/models'
import { css } from '@emotion/react'
import { Text as NativeText, View } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'

import {
  Button,
  Flex,
  IconUser,
  Paper,
  Text,
  useTheme
} from '@audius/harmony-native'
import { TrackImage } from 'app/components/image/TrackImage'
import { UserBadges } from 'app/components/user-badges'
import { useNavigation } from 'app/hooks/useNavigation'
import { makeStyles } from 'app/styles'

const messages = {
  deleted: '[deleted by artist]',
  track: 'track',
  moreBy: (artistName: string) => `Check out more by ${artistName}`
}

const useStyles = makeStyles(({ palette, spacing, typography }) => ({
  coverArt: {
    borderWidth: 1,
    borderColor: palette.neutralLight8,
    borderRadius: spacing(2),
    height: 224,
    width: 224,
    alignSelf: 'center'
  }
}))

export const TrackScreenDeletedTile = ({
  track,
  user
}: {
  track: Track | SearchTrack
  user: User | SearchUser
}) => {
  const styles = useStyles()
  const { spacing } = useTheme()
  const { title } = track
  const navigation = useNavigation()

  const handlePressArtistName = useCallback(() => {
    if (!user) {
      return
    }
    navigation.push('Profile', { handle: user.handle })
  }, [navigation, user])

  return (
    <Paper alignItems='center' p='l' gap='l' w='100%'>
      <Text variant='label' color='subdued' style={{ letterSpacing: 2 }}>
        {messages.track} {messages.deleted}
      </Text>
      <TrackImage
        track={track}
        size={SquareSizes.SIZE_480_BY_480}
        style={styles.coverArt}
      />
      <Flex gap='xs' alignItems='center'>
        <Text variant='heading' size='s'>
          {title}
        </Text>
        {user ? (
          <TouchableOpacity onPress={handlePressArtistName}>
            <Flex direction='row' gap='xs'>
              <Text variant='body' color='accent' size='l'>
                {user.name}
              </Text>
              <UserBadges badgeSize={spacing.l} user={user} hideName />
            </Flex>
          </TouchableOpacity>
        ) : null}
      </Flex>
      <Button
        variant='secondary'
        iconLeft={IconUser}
        onPress={handlePressArtistName}
        style={{ width: '100%' }}
      >
        {messages.moreBy(user.name)}
      </Button>
    </Paper>
  )
}
