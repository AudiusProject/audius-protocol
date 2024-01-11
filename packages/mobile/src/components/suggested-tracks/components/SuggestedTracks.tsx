import { Fragment, useCallback, useEffect, useRef } from 'react'

import type { ID, Track } from '@audius/common'
import { SquareSizes, cacheUsersSelectors } from '@audius/common'
import type { SuggestedTrack } from '@audius/common'
import { Animated, LayoutAnimation, View } from 'react-native'
import { useSelector } from 'react-redux'
import { useToggle } from 'react-use'

import IconCaretDown from 'app/assets/images/iconCaretDown.svg'
import IconRefresh from 'app/assets/images/iconRefresh.svg'
import {
  Button,
  Divider,
  IconButton,
  Text,
  TextButton,
  Tile
} from 'app/components/core'
import { makeStyles } from 'app/styles'

import { TrackImage } from '../../image/TrackImage'
import { Skeleton } from '../../skeleton'
import { UserBadges } from '../../user-badges'

const { getUser } = cacheUsersSelectors

const messages = {
  title: 'Add some tracks',
  addTrack: 'Add',
  refresh: 'Refresh'
}

const useStyles = makeStyles(({ spacing, typography, palette }) => ({
  root: { marginBottom: spacing(12) },
  heading: {
    flexDirection: 'row',
    gap: spacing(3),
    padding: spacing(4),
    alignItems: 'center'
  },
  headingText: {
    gap: spacing(2),
    flex: 1
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
  track: Track
  onAddTrack: (trackId: ID) => void
}

const SuggestedTrack = (props: SuggestedTrackProps) => {
  const { track, onAddTrack } = props
  const { track_id, title, owner_id } = track

  const user = useSelector((state) => getUser(state, { id: owner_id }))
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
          {user ? (
            <UserBadges user={user} nameStyle={styles.artistName} />
          ) : null}
        </View>
      </View>
      <View>
        <Button
          variant='common'
          title={messages.addTrack}
          size='small'
          styles={{ text: styles.buttonText }}
          onPress={() => onAddTrack(track_id)}
        />
      </View>
    </View>
  )
}

const SuggestedTrackSkeleton = () => {
  const styles = useStyles()
  return (
    <View style={styles.suggestedTrack}>
      <View style={styles.trackDetails}>
        <Skeleton style={styles.trackImage} />
        <View style={styles.trackInfo}>
          <Skeleton height={14} width={150} />
          <Skeleton height={14} width={100} />
        </View>
      </View>
    </View>
  )
}

type SuggestedTracksProps = {
  suggestedTracks: SuggestedTrack[]
  onRefresh: () => void
  onAddTrack: (trackId: ID) => void
  isRefreshing: boolean
}

// TODO: add files for SuggestedAlbumTracks and SuggestedPlaylistTracks
export const SuggestedTracks = (props: SuggestedTracksProps) => {
  const { suggestedTracks, onRefresh, onAddTrack, isRefreshing } = props
  const styles = useStyles()

  const [isExpanded, toggleIsExpanded] = useToggle(false)

  const handleExpanded = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    toggleIsExpanded()
  }, [toggleIsExpanded])

  const expandAnimation = useRef(new Animated.Value(0))
  const expandIconStyle = {
    transform: [
      {
        rotate: expandAnimation.current.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '180deg']
        })
      }
    ]
  }

  useEffect(() => {
    Animated.spring(expandAnimation.current, {
      toValue: isExpanded ? 1 : 0,
      useNativeDriver: true
    }).start()
  }, [isExpanded])

  return (
    <Tile style={styles.root}>
      <View style={styles.heading}>
        <View style={styles.headingText}>
          <Text fontSize='large' weight='heavy' textTransform='uppercase'>
            {messages.title}
          </Text>
        </View>
        <Animated.View style={expandIconStyle}>
          <IconButton icon={IconCaretDown} onPress={handleExpanded} />
        </Animated.View>
      </View>
      {isExpanded ? (
        <>
          <View>
            <Divider />
            {suggestedTracks?.map((suggestedTrack) => (
              <Fragment key={suggestedTrack.key}>
                {!isRefreshing && 'track' in suggestedTrack ? (
                  <SuggestedTrack
                    track={suggestedTrack.track}
                    onAddTrack={onAddTrack}
                  />
                ) : (
                  <SuggestedTrackSkeleton />
                )}
                <Divider />
              </Fragment>
            ))}
          </View>
          <TextButton
            variant='neutralLight4'
            icon={IconRefresh}
            iconPosition='left'
            title={messages.refresh}
            TextProps={{ weight: 'bold' }}
            style={styles.refreshButton}
            onPress={onRefresh}
          />
        </>
      ) : null}
    </Tile>
  )
}
