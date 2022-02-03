import { ReactNode, useCallback } from 'react'

// import DownloadButtons from 'app/components/download-buttons'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Name, PlaybackSource } from 'audius-client/src/common/models/Analytics'
import { ID, UID } from 'audius-client/src/common/models/Identifiers'
import { SquareSizes } from 'audius-client/src/common/models/ImageSizes'
import { Track } from 'audius-client/src/common/models/Track'
import { User } from 'audius-client/src/common/models/User'
import { squashNewLines } from 'audius-client/src/common/utils/formatUtil'
import { getCanonicalName } from 'audius-client/src/common/utils/genres'
import {
  formatSeconds,
  formatDate
} from 'audius-client/src/common/utils/timeUtil'
import { Nullable } from 'audius-client/src/common/utils/typeUtils'
import { tracksActions } from 'common/store/pages/track/lineup/actions'
import {
  Image,
  ImageStyle,
  Linking,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native'
import HyperLink from 'react-native-hyperlink'
import { Shadow } from 'react-native-shadow-2'
import { useSelector } from 'react-redux'

import IconPause from 'app/assets/images/iconPause.svg'
import IconPlay from 'app/assets/images/iconPlay.svg'
import { BaseStackParamList } from 'app/components/app-navigator/types'
import Button from 'app/components/button'
import CoSign from 'app/components/co-sign/CoSign'
import { Size } from 'app/components/co-sign/types'
import { DynamicImage } from 'app/components/core'
import Text from 'app/components/text'
import UserBadges from 'app/components/user-badges'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useThemedStyles } from 'app/hooks/useThemedStyles'
import { useTrackCoverArt } from 'app/hooks/useTrackCoverArt'
import { getPlaying, getPlayingUid, getTrack } from 'app/store/audio/selectors'
import { flexRowCentered } from 'app/styles'
import { make, track } from 'app/utils/analytics'
import { moodMap } from 'app/utils/moods'

// import HiddenTrackHeader from '../HiddenTrackHeader'

import { ThemeColors } from 'app/utils/theme'

import { TrackScreenActionButtons } from './TrackScreenActionButtons'
import { TrackScreenStats } from './TrackScreenStats'

const messages = {
  track: 'TRACK',
  remix: 'REMIX',
  play: 'PLAY',
  pause: 'PAUSE'
}

type TrackHeaderProps = {
  currentUserId: Nullable<ID>
  track: Track
  uid: UID
  user: User
}

const createStyles = (themeColors: ThemeColors) =>
  StyleSheet.create({
    root: {
      paddingTop: 16,
      paddingHorizontal: 24,
      width: '100%',
      alignItems: 'center',
      backgroundColor: themeColors.white,
      borderWidth: 1,
      borderColor: themeColors.neutralLight8,
      borderRadius: 6,
      overflow: 'hidden'
    },

    hiddenTrackHeaderWrapper: {
      marginBottom: 12
    },

    typeLabel: {
      marginBottom: 15,
      height: 18,
      color: themeColors.neutralLight4,
      fontSize: 14,
      letterSpacing: 2,
      textAlign: 'center',
      textTransform: 'uppercase'
    },

    coverArtWrapper: {
      borderWidth: 1,
      borderColor: themeColors.neutralLight8,
      borderRadius: 4,
      overflow: 'hidden',
      height: 195,
      width: 195,
      marginBottom: 23
    },

    coverArt: {
      borderRadius: 4,
      overflow: 'hidden'
    },

    title: {
      fontSize: 18,
      textAlign: 'center',
      marginBottom: 8
    },

    artistContainer: {
      ...flexRowCentered(),
      marginBottom: 16
    },

    artist: {
      color: themeColors.secondary,
      fontSize: 18
    },

    badge: {
      marginLeft: 4
    },

    descriptionContainer: {
      width: '100%'
    },

    description: {
      fontSize: 16,
      textAlign: 'left',
      width: '100%',
      marginBottom: 24
    },

    buttonSection: {
      width: '100%',
      marginBottom: 12
    },

    playButton: {
      width: '100%',
      ...flexRowCentered(),
      justifyContent: 'center',
      height: 40,
      padding: 0
    },

    tags: {
      borderTopWidth: 1,
      borderTopColor: themeColors.neutralLight7,
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'center',
      flexWrap: 'wrap',
      paddingVertical: 16
    },

    tag: {
      margin: 4,
      borderRadius: 2,
      backgroundColor: themeColors.neutralLight4,
      paddingVertical: 4,
      paddingHorizontal: 8,
      color: themeColors.white,
      fontSize: 10,
      textTransform: 'uppercase',
      overflow: 'hidden'
    },

    infoSection: {
      borderTopWidth: 1,
      borderTopColor: themeColors.neutralLight7,
      flexWrap: 'wrap',
      flexDirection: 'row',
      width: '100%',
      paddingTop: 24,
      paddingBottom: 8
    },

    noStats: {
      borderWidth: 0
    },

    infoFact: {
      ...flexRowCentered(),
      flexBasis: '50%',
      marginBottom: 16
    },

    infoLabel: {
      ...flexRowCentered(),
      color: themeColors.neutralLight5,
      fontSize: 14,
      textTransform: 'uppercase',
      marginRight: 8
    },

    infoValue: {
      ...flexRowCentered(),
      color: themeColors.neutral,
      fontSize: 14
    },

    infoIcon: {
      marginTop: -4
    },

    moodEmoji: {
      marginLeft: 4,
      width: 20,
      height: 20
    },

    link: {
      color: themeColors.primary
    }
  })

export const TrackScreenHeader = ({
  currentUserId,
  track: {
    _co_sign,
    _cover_art_sizes,
    created_at,
    credits_splits,
    description,
    duration,
    field_visibility,
    genre,
    has_current_user_reposted,
    has_current_user_saved,
    is_unlisted,
    mood,
    owner_id,
    play_count,
    release_date,
    remix_of,
    repost_count,
    save_count,
    tags,
    title,
    track_id
  },
  uid,
  user
}: TrackHeaderProps) => {
  const dispatchWeb = useDispatchWeb()
  const styles = useThemedStyles(createStyles)
  const navigation = useNavigation<
    NativeStackNavigationProp<BaseStackParamList>
  >()

  const image = useTrackCoverArt(
    track_id,
    _cover_art_sizes,
    SquareSizes.SIZE_480_BY_480
  )

  const isPlaying = useSelector(getPlaying)
  const playingUid = useSelector(getPlayingUid)
  const queueTrack = useSelector(getTrack)

  const remixParentTrackId = remix_of?.tracks?.[0]?.parent_track_id
  const isRemix = !!remixParentTrackId

  const isOwner = owner_id === currentUserId

  const onPlay = useCallback(() => {
    const trackPlay = () =>
      track(
        make({
          eventName: Name.PLAYBACK_PLAY,
          id: String(track_id),
          source: PlaybackSource.TRACK_PAGE
        })
      )

    if (isPlaying) {
      dispatchWeb(tracksActions.pause())
      track(
        make({
          eventName: Name.PLAYBACK_PAUSE,
          id: String(track_id),
          source: PlaybackSource.TRACK_PAGE
        })
      )
    } else if (
      playingUid !== uid &&
      queueTrack &&
      queueTrack?.trackId === track_id
    ) {
      dispatchWeb(tracksActions.play())
      trackPlay()
    } else {
      dispatchWeb(tracksActions.play(uid))
      trackPlay()
    }
  }, [track_id, uid, dispatchWeb, isPlaying, playingUid, queueTrack])

  const onPressArtistName = useCallback(() => {
    navigation.navigate('profile', { handle: user.handle })
  }, [navigation, user])

  const onPressTag = useCallback((tag: string) => {
    // TODO: navigate to search screen
    // goToSearchResultsPage(`#${tag}`)
  }, [])

  const onExternalLinkClick = useCallback(url => {
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url)
        track(
          make({
            eventName: Name.LINK_CLICKING,
            url,
            source: 'track page' as const
          })
        )
      }
    })
  }, [])

  const filteredTags = (tags || '').split(',').filter(Boolean)

  const trackLabels: {
    value: ReactNode
    label: string
    icon?: ReactNode
  }[] = [
    { value: formatSeconds(duration), label: 'Duration' },
    { value: getCanonicalName(genre), label: 'Genre' },
    { value: formatDate(release_date || created_at), label: 'Released' },
    {
      value: mood,
      icon:
        mood && mood in moodMap ? (
          <Image
            source={moodMap[mood]}
            style={styles.moodEmoji as ImageStyle}
          />
        ) : null,
      label: 'Mood'
    },
    { value: credits_splits, label: 'Credit' }
  ].filter(info => !!info.value)

  const renderTags = () => {
    if (is_unlisted && !field_visibility?.tags) {
      return null
    }

    return (
      <>
        {filteredTags.length > 0 ? (
          <View style={styles.tags}>
            {filteredTags.map(tag => (
              <Pressable key={tag} onPress={() => onPressTag(tag)}>
                <Text style={styles.tag} weight='bold'>
                  {tag}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </>
    )
  }

  const renderDownloadButtons = () => {
    // return (
    //   <DownloadButtons
    //     style={styles.downloadButtonsContainer}
    //     trackId={trackId}
    //     isOwner={isOwner}
    //     following={isFollowing}
    //     onDownload={onDownload}
    //   />
    // )
    // TODO
    return null
  }

  const renderTrackLabels = () => {
    return trackLabels.map(infoFact => {
      if (infoFact.label === 'Genre' && is_unlisted && !field_visibility?.genre)
        return null
      if (infoFact.label === 'Released' && is_unlisted) return null
      if (infoFact.label === 'Mood' && is_unlisted && !field_visibility?.mood)
        return null
      return (
        <View key={infoFact.label} style={styles.infoFact}>
          <Text style={styles.infoLabel} weight='bold'>
            {infoFact.label}
          </Text>
          <Text style={styles.infoValue} weight='demiBold'>
            {infoFact.value}
          </Text>
          <View style={styles.infoIcon}>{infoFact.icon}</View>
        </View>
      )
    })
  }

  const imageElement = _co_sign ? (
    <CoSign
      size={Size.LARGE}
      // hasFavorited={coSign.has_remix_author_saved}
      // hasReposted={coSign.has_remix_author_reposted}
      // coSignName={coSign.user.name}
      style={styles.coverArt}
      // userId={coSign.user.user_id}
    >
      <DynamicImage
        source={{ uri: image }}
        styles={{ image: styles.coverArt as ImageStyle }}
      />
    </CoSign>
  ) : (
    <DynamicImage
      source={{ uri: image }}
      styles={{ image: styles.coverArt as ImageStyle }}
    />
  )

  return (
    <Shadow
      offset={[0, 2]}
      viewStyle={{ alignSelf: 'stretch' }}
      distance={4}
      startColor='rgba(133,129,153,0.05)'
    >
      <View style={styles.root}>
        {is_unlisted ? (
          <View style={styles.hiddenTrackHeaderWrapper}>
            {/* <HiddenTrackHeader /> */}
          </View>
        ) : (
          <Text style={styles.typeLabel} weight='demiBold'>
            {isRemix ? messages.remix : messages.track}
          </Text>
        )}
        <View style={styles.coverArtWrapper}>{imageElement}</View>
        <Text style={styles.title} weight='bold'>
          {title}
        </Text>
        <TouchableOpacity onPress={onPressArtistName}>
          <View style={styles.artistContainer}>
            <Text style={styles.artist}>{user.name}</Text>
            <UserBadges
              style={styles.badge}
              badgeSize={16}
              user={user}
              hideName
            />
          </View>
        </TouchableOpacity>
        <View style={styles.buttonSection}>
          <Button
            style={styles.playButton}
            title={isPlaying ? messages.pause : messages.play}
            iconPosition='left'
            renderIcon={fill =>
              isPlaying ? (
                <IconPause fill={fill as string} />
              ) : (
                <IconPlay fill={fill as string} />
              )
            }
            onPress={onPlay}
          />
          <TrackScreenActionButtons
            hasReposted={has_current_user_reposted}
            hasSaved={has_current_user_saved}
            isFollowing={user.does_current_user_follow}
            isOwner={isOwner}
            isUnlisted={is_unlisted}
            showFavorite={!is_unlisted}
            showOverflow
            showRepost={!is_unlisted}
            showShare={!is_unlisted || !!field_visibility?.share}
            trackId={track_id}
          />
        </View>
        <TrackScreenStats
          favoriteCount={save_count}
          playCount={play_count}
          repostCount={repost_count}
          showFavoriteCount={!is_unlisted}
          showListenCount={!is_unlisted || !field_visibility?.play_count}
          showRepostCount={!is_unlisted}
          trackId={track_id}
        />
        <View style={styles.descriptionContainer}>
          {description ? (
            <HyperLink onPress={onExternalLinkClick} linkStyle={styles.link}>
              <Text style={styles.description} suppressHighlighting>
                {squashNewLines(description)}
              </Text>
            </HyperLink>
          ) : null}
        </View>
        <View
          style={[
            styles.infoSection,
            is_unlisted && !field_visibility?.play_count && styles.noStats
          ]}
        >
          {renderTrackLabels()}
        </View>
        {renderDownloadButtons()}
        {renderTags()}
      </View>
    </Shadow>
  )
}
