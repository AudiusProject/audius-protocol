import React, { Fragment, useCallback, useEffect, useMemo, useRef } from 'react'

import {
  SUGGESTED_TRACK_COUNT,
  useCollection,
  useSuggestedPlaylistTracks,
  useUser
} from '@audius/common/api'
import { SquareSizes } from '@audius/common/models'
import type { ID, Track } from '@audius/common/models'
import { Animated, LayoutAnimation, View } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'
import { useToggle } from 'react-use'

import {
  IconCaretDown,
  IconRefresh,
  Button,
  PlainButton,
  Divider
} from '@audius/harmony-native'
import { Text, Tile } from 'app/components/core'
import { makeStyles } from 'app/styles'

import { TrackImage } from '../image/TrackImage'
import { Skeleton } from '../skeleton'
import { UserBadges } from '../user-badges'

const messages = {
  title: 'Add some tracks',
  addTrack: 'Add',
  refresh: 'Refresh',
  added: 'Added'
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
  }
}))

type SuggestedTrackProps = {
  collectionId: ID
  track: Track
  onAddTrack: (trackId: ID) => void
}

const SuggestedTrackRow = (props: SuggestedTrackProps) => {
  const { collectionId, track, onAddTrack } = props
  const { track_id, title, owner_id } = track

  const { data: user } = useUser(owner_id)
  const styles = useStyles()

  const { data: collection } = useCollection(collectionId)
  const trackIsInCollection = useMemo(
    () =>
      collection?.playlist_contents.track_ids.some(
        (trackId) => trackId.track === track_id
      ),
    [collection?.playlist_contents.track_ids, track_id]
  )

  return (
    <View style={styles.suggestedTrack}>
      <View style={styles.trackDetails}>
        <TrackImage
          trackId={track.track_id}
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
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              <Text style={styles.artistName}>{user.name}</Text>
              <UserBadges userId={user.user_id} badgeSize='xs' />
            </View>
          ) : null}
        </View>
      </View>
      <View>
        <Button
          variant='secondary'
          size='small'
          onPress={() => onAddTrack(track_id)}
          disabled={trackIsInCollection}
        >
          {trackIsInCollection ? messages.added : messages.addTrack}
        </Button>
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
  collectionId: ID
}

export const SuggestedTracks = (props: SuggestedTracksProps) => {
  const { collectionId } = props
  const { suggestedTracks, onRefresh, onAddTrack } =
    useSuggestedPlaylistTracks(collectionId)
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
      <TouchableOpacity onPress={handleExpanded}>
        <View style={styles.heading}>
          <View style={styles.headingText}>
            <Text fontSize='large' weight='heavy' textTransform='uppercase'>
              {messages.title}
            </Text>
          </View>
          <Animated.View style={expandIconStyle}>
            <IconCaretDown size='l' color='default' />
          </Animated.View>
        </View>
      </TouchableOpacity>
      {isExpanded ? (
        <>
          <View>
            <Divider />
            {Array.from({ length: SUGGESTED_TRACK_COUNT }).map((_, i) => (
              <Fragment key={suggestedTracks[i]?.track_id ?? i}>
                {suggestedTracks[i] ? (
                  <SuggestedTrackRow
                    collectionId={collectionId}
                    track={suggestedTracks[i]}
                    onAddTrack={onAddTrack}
                  />
                ) : (
                  <SuggestedTrackSkeleton />
                )}
                <Divider />
              </Fragment>
            ))}
          </View>
          <PlainButton
            variant='subdued'
            iconLeft={IconRefresh}
            style={styles.refreshButton}
            onPress={onRefresh}
          >
            {messages.refresh}
          </PlainButton>
        </>
      ) : null}
    </Tile>
  )
}
