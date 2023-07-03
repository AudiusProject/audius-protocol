import type { UserTrackMetadata } from '@audius/common'
import { SquareSizes, useGetSuggestedTracks } from '@audius/common'
import { View } from 'react-native'

import IconRefresh from 'app/assets/images/iconRefresh.svg'
import { Button, Divider, Text, TextButton, Tile } from 'app/components/core'
import { makeStyles } from 'app/styles'

import { TrackImage } from '../image/TrackImage'
import { UserBadges } from '../user-badges'

const messages = {
  title: 'Add some tracks',
  description:
    'Placeholder copy: dependent on backend logic and what we decide to do with this new feature.',
  addTrack: 'Add',
  refresh: 'Refresh'
}

const useStyles = makeStyles(({ spacing, typography, palette }) => ({
  root: { marginBottom: spacing(12) },
  heading: {
    gap: spacing(2),
    padding: spacing(4)
  },
  suggestedTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing(4),
    gap: spacing(3)
  },
  trackDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(3),
    flex: 1
  },
  trackInfo: {
    gap: 2,
    flex: 1
  },
  trackImage: {
    height: spacing(10),
    width: spacing(10),
    borderRadius: 2
  },
  artistName: {
    fontSize: typography.fontSize.small,
    fontFamily: typography.fontByWeight.medium,
    color: palette.neutralLight4
  },
  refreshButton: {
    marginVertical: spacing(4),
    alignSelf: 'center'
  },
  buttonText: { textTransform: 'none', marginHorizontal: spacing(1) }
}))

type SuggestedTrackProps = {
  track: UserTrackMetadata
}

const SuggestedTrack = (props: SuggestedTrackProps) => {
  const { track } = props
  const { title, user } = track
  const styles = useStyles()

  return (
    <View style={styles.suggestedTrack}>
      <View style={styles.trackDetails}>
        <TrackImage
          track={track}
          size={SquareSizes.SIZE_150_BY_150}
          style={styles.trackImage}
        />
        <View style={styles.trackInfo}>
          <Text
            numberOfLines={1}
            ellipsizeMode='tail'
            fontSize='small'
            weight='demiBold'
          >
            {title}
          </Text>
          <UserBadges user={user} nameStyle={styles.artistName} />
        </View>
      </View>
      <View>
        <Button
          variant='common'
          title={messages.addTrack}
          size='small'
          styles={{ text: styles.buttonText }}
        />
      </View>
    </View>
  )
}

export const SuggestedTracks = () => {
  const styles = useStyles()
  const { data: suggestedTracks } = useGetSuggestedTracks()

  return (
    <Tile style={styles.root}>
      <View style={styles.heading}>
        <Text fontSize='large' weight='heavy' textTransform='uppercase'>
          {messages.title}
        </Text>
        <Text fontSize='medium' weight='medium'>
          {messages.description}
        </Text>
      </View>
      <View>
        <Divider />
        {suggestedTracks?.map((suggestedTrack) => (
          <>
            <SuggestedTrack
              key={suggestedTrack.track_id}
              track={suggestedTrack}
            />
            <Divider />
          </>
        ))}
      </View>
      <TextButton
        variant='neutralLight4'
        icon={IconRefresh}
        iconPosition='left'
        title={messages.refresh}
        TextProps={{ weight: 'bold' }}
        style={styles.refreshButton}
      />
    </Tile>
  )
}
