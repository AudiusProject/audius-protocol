import { useCallback } from 'react'

import type { ID } from '@audius/common'
import { SquareSizes } from 'audius-client/src/common/models/ImageSizes'
import { Track } from 'audius-client/src/common/models/Track'
import { User } from 'audius-client/src/common/models/User'
import { getTrack } from 'audius-client/src/common/store/cache/tracks/selectors'
import { getUserFromTrack } from 'audius-client/src/common/store/cache/users/selectors'
import { profilePage } from 'audius-client/src/utils/route'
import { Pressable, StyleProp, View, ViewStyle } from 'react-native'

import CoSign from 'app/components/co-sign/CoSign'
import { Size } from 'app/components/co-sign/types'
import { DynamicImage } from 'app/components/core'
import Text from 'app/components/text'
import UserBadges from 'app/components/user-badges'
import { useNavigation } from 'app/hooks/useNavigation'
import { isEqual, useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { useTrackCoverArt } from 'app/hooks/useTrackCoverArt'
import { useUserProfilePicture } from 'app/hooks/useUserProfilePicture'
import { flexRowCentered, makeStyles, StylesProp } from 'app/styles'

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
    overflow: 'hidden',
    position: 'absolute',
    top: spacing(-2),
    left: spacing(-2),
    height: 36,
    width: 36,
    borderWidth: 2,
    borderColor: palette.neutralLight8,
    borderRadius: 18
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

export const TrackScreenRemix = ({ id, ...props }: TrackScreenRemixProps) => {
  const track = useSelectorWeb((state) => getTrack(state, { id }), isEqual)
  const user = useSelectorWeb(
    (state) => getUserFromTrack(state, { id }),
    isEqual
  )

  if (!track || !user) {
    console.warn(
      'Track or user missing for TrackScreenRemix, preventing render'
    )
    return null
  }

  return <TrackScreenRemixComponent {...props} track={track} user={user} />
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

  const { _co_sign, permalink, track_id } = track
  const { name, handle } = user
  const navigation = useNavigation()

  const profilePictureImage = useUserProfilePicture({
    id: user.user_id,
    sizes: user._profile_picture_sizes,
    size: SquareSizes.SIZE_150_BY_150
  })

  const coverArtImage = useTrackCoverArt({
    id: track.track_id,
    sizes: track._cover_art_sizes,
    size: SquareSizes.SIZE_480_BY_480
  })

  const handlePressTrack = useCallback(() => {
    navigation.push({
      native: { screen: 'Track', params: { id: track_id } },
      web: { route: permalink }
    })
  }, [navigation, permalink, track_id])

  const handlePressArtist = useCallback(() => {
    navigation.push({
      native: { screen: 'Profile', params: { handle } },
      web: { route: profilePage(handle) }
    })
  }, [handle, navigation])

  const images = (
    <>
      <View style={styles.profilePicture}>
        <DynamicImage uri={profilePictureImage} />
      </View>
      <View style={styles.coverArt}>
        <DynamicImage uri={coverArtImage} />
      </View>
    </>
  )

  return (
    <View style={[styles.root, style, stylesProp?.root]}>
      <Pressable onPress={handlePressTrack}>
        {_co_sign ? <CoSign size={Size.MEDIUM}>{images}</CoSign> : images}
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
