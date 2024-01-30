import { useCallback } from 'react'

import { cacheTracksSelectors, cacheUsersSelectors } from '@audius/common'
import type { ID, Track, User } from '@audius/common/models'
import { SquareSizes } from '@audius/common/models'
import type { StyleProp, ViewStyle } from 'react-native'
import { Pressable, View } from 'react-native'
import { useSelector } from 'react-redux'

import CoSign, { Size } from 'app/components/co-sign'
import { TrackImage } from 'app/components/image/TrackImage'
import Text from 'app/components/text'
import { ProfilePicture } from 'app/components/user'
import UserBadges from 'app/components/user-badges'
import { useNavigation } from 'app/hooks/useNavigation'
import type { StylesProp } from 'app/styles'
import { flexRowCentered, makeStyles } from 'app/styles'
const { getUserFromTrack } = cacheUsersSelectors
const { getTrack } = cacheTracksSelectors

const messages = {
  by: 'By '
}

type TrackScreenRemixProps = {
  id: ID
} & Omit<TrackScreenRemixComponentProps, 'track' | 'user'>

const useStyles = makeStyles(({ palette, spacing, typography }) => ({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing(2)
  },

  coverArt: {
    width: 121,
    height: 121,
    borderWidth: 1,
    borderColor: palette.neutralLight8,
    borderRadius: 4,
    overflow: 'hidden'
  },

  profilePicture: {
    zIndex: 1,
    position: 'absolute',
    top: spacing(-2),
    left: spacing(-2),
    height: 36,
    width: 36
  },

  artist: {
    marginTop: spacing(2),
    ...flexRowCentered(),
    ...typography.body,
    textAlign: 'center'
  },

  name: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    maxWidth: 128
  },

  artistName: {
    color: palette.secondary
  },

  badges: {
    marginLeft: spacing(1),
    top: spacing(0.5)
  }
}))

export const TrackScreenRemix = (props: TrackScreenRemixProps) => {
  const { id, ...other } = props
  const track = useSelector((state) => getTrack(state, { id }))
  const user = useSelector((state) => getUserFromTrack(state, { id }))

  if (!track || !user) {
    console.warn(
      'Track or user missing for TrackScreenRemix, preventing render'
    )
    return null
  }

  return <TrackScreenRemixComponent {...other} track={track} user={user} />
}

type TrackScreenRemixComponentProps = {
  style?: StyleProp<ViewStyle>
  styles?: StylesProp<{
    root: ViewStyle
  }>
  track: Track
  user: User
}

const TrackScreenRemixComponent = ({
  style,
  styles: stylesProp,
  track,
  user
}: TrackScreenRemixComponentProps) => {
  const styles = useStyles()

  const { _co_sign, track_id } = track
  const { name, handle } = user
  const navigation = useNavigation()

  const handlePressTrack = useCallback(() => {
    navigation.push('Track', { id: track_id })
  }, [navigation, track_id])

  const handlePressArtist = useCallback(() => {
    navigation.push('Profile', { handle })
  }, [handle, navigation])

  const images = (
    <>
      <ProfilePicture profile={user} style={styles.profilePicture} />
      <TrackImage
        track={track}
        style={styles.coverArt}
        size={SquareSizes.SIZE_480_BY_480}
      />
    </>
  )

  return (
    <View style={[styles.root, style, stylesProp?.root]}>
      <Pressable onPress={handlePressTrack}>
        {_co_sign ? (
          <CoSign size={Size.MEDIUM} style={{ flex: 0 }}>
            {images}
          </CoSign>
        ) : (
          images
        )}
      </Pressable>
      <Pressable style={styles.artist} onPress={handlePressArtist}>
        <View style={styles.name}>
          <Text>{messages.by}</Text>
          <Text style={styles.artistName} numberOfLines={1}>
            {name}
          </Text>
          <View style={styles.badges}>
            <UserBadges user={user} badgeSize={12} hideName />
          </View>
        </View>
      </Pressable>
    </View>
  )
}
