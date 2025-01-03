import { useTrack } from '@audius/common/api'
import type { ID } from '@audius/common/models'
import { SquareSizes } from '@audius/common/models'
import type { StyleProp, ViewStyle } from 'react-native'

import { Flex, Paper, Text } from '@audius/harmony-native'
import { TrackImage } from 'app/components/image/TrackImage'
import { UserLink } from 'app/components/user-link'
import { makeStyles } from 'app/styles'

const messages = {
  trackBy: 'By'
}

type RemixTrackPillProps = {
  trackId: ID
  style?: StyleProp<ViewStyle>
}

const useStyles = makeStyles(({ spacing, palette, typography }) => ({
  trackPill: {
    marginTop: spacing(4)
  },
  trackArtwork: {
    height: spacing(5) + 2,
    width: spacing(5) + 2,
    marginRight: spacing(1),
    borderWidth: 1,
    borderRadius: 2,
    overflow: 'hidden',
    borderColor: palette.neutralLight9
  },
  trackTextContainer: {
    flex: 1
  },
  trackText: {
    fontSize: typography.fontSize.small,
    fontFamily: typography.fontByWeight.demiBold
  },
  byText: {
    color: palette.neutralLight2
  }
}))

export const RemixTrackPill = (props: RemixTrackPillProps) => {
  const { trackId, style } = props
  const { data: track } = useTrack(trackId)
  const styles = useStyles()

  if (!track) return null

  const { user, title } = track

  return (
    <Paper
      style={[styles.trackPill, style]}
      backgroundColor='surface2'
      shadow='flat'
      border='strong'
      borderRadius='xs'
      direction='row'
      alignItems='center'
      p='s'
      gap='xs'
    >
      <TrackImage
        trackId={trackId}
        size={SquareSizes.SIZE_150_BY_150}
        style={{ height: 20, width: 20 }}
        borderRadius='xs'
      />
      <Flex direction='row' alignItems='center'>
        <Text size='s' numberOfLines={1} ellipses>
          {title} <Text color='subdued'>{messages.trackBy} </Text>
        </Text>
        <UserLink userId={user.user_id} size='s' disabled />
      </Flex>
    </Paper>
  )
}
