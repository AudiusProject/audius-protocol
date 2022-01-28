import React, { useState, useEffect, useRef } from 'react'

import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Track } from 'audius-client/src/common/models/Track'
import { User } from 'audius-client/src/common/models/User'
import { getUserId } from 'audius-client/src/common/store/account/selectors'
import { getTrack } from 'audius-client/src/common/store/cache/tracks/selectors'
import { getUserFromTrack } from 'audius-client/src/common/store/cache/users/selectors'
import { isEqual } from 'lodash'
import {
  Animated,
  Easing,
  GestureResponderEvent,
  Pressable,
  StyleSheet
} from 'react-native'
import { useSelector } from 'react-redux'

import { BaseStackParamList } from 'app/components/app-navigator/types'
import { TrackTileProps } from 'app/components/track-tile/types'
// import { usePushRouteWeb } from 'app/hooks/usePushRouteWeb'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { useThemedStyles } from 'app/hooks/useThemedStyles'
import { getPlaying, getPlayingUid } from 'app/store/audio/selectors'
import { ThemeColors } from 'app/utils/theme'

import { TrackBannerIcon, TrackBannerIconType } from './TrackBannerIcon'
import { TrackTileBottomButtons } from './TrackTileBottomButtons'
import { TrackTileCoSign } from './TrackTileCoSign'
import { TrackTileContainer } from './TrackTileContainer'
import { TrackTileMetadata } from './TrackTileMetadata'
import { TrackTileStats } from './TrackTileStats'
import { TrackTileTopRight } from './TrackTileTopRight'

const createStyles = (themeColors: ThemeColors) =>
  StyleSheet.create({
    mainContent: {
      flex: 1
    }
  })

export const TrackTile = (props: TrackTileProps) => {
  const { uid } = props

  // Using isEqual as the equality function to prevent rerenders due to object references
  // not being preserved when syncing redux state from client.
  // This can be removed when no longer dependent on web client
  const track = useSelectorWeb(state => getTrack(state, { uid }), isEqual)
  const user = useSelectorWeb(state => getUserFromTrack(state, { uid }))

  if (!track || !user) {
    console.warn('Track or user missing for TrackTile, preventing render')
    return null
  }

  if (track.is_delete || user?.is_deactivated) {
    return null
  }

  return <TrackTileComponent {...props} track={track} user={user} />
}

const TrackTileComponent = ({
  index,
  isTrending,
  onLoad,
  showArtistPick,
  showRankIcon,
  togglePlay,
  track,
  uid,
  user
}: TrackTileProps & { track: Track; user: User }) => {
  const {
    // permalink,
    _co_sign,
    _cover_art_sizes,
    duration,
    field_visibility,
    has_current_user_reposted,
    has_current_user_saved,
    is_unlisted,
    play_count,
    repost_count,
    save_count,
    title,
    track_id
  } = track
  const { _artist_pick, name, user_id } = user
  const navigation = useNavigation<
    NativeStackNavigationProp<BaseStackParamList>
  >()

  // const pushRouteWeb = usePushRouteWeb()

  const playingUid = useSelector(getPlayingUid)
  const isPlaying = useSelector(getPlaying)
  const currentUserId = useSelectorWeb(getUserId)

  const [artworkLoaded, setArtworkLoaded] = useState(false)

  const styles = useThemedStyles(createStyles)
  const opacity = useRef(new Animated.Value(0)).current

  const isOwner = user_id === currentUserId
  const isLoaded = artworkLoaded
  const fadeIn = { opacity }

  const hideShare: boolean = field_visibility?.share === false
  const hidePlays = field_visibility?.play_count === false

  const goToTrackPage = (e: GestureResponderEvent) => {
    navigation.navigate('track', { id: track_id })
  }

  const goToArtistPage = (e: GestureResponderEvent) => {
    // navigate to artist page
  }

  const onPressReposts = (e: GestureResponderEvent) => {
    // navigate to reposts page
    // goToRoute(REPOSTING_USERS_ROUTE)
  }

  const onPressFavorites = (e: GestureResponderEvent) => {
    // navigate to favorites page
    // goToRoute(REPOSTING_USERS_ROUTE)
  }

  useEffect(() => {
    if (isLoaded) {
      onLoad?.(index)
      Animated.timing(opacity, {
        toValue: 1,
        easing: Easing.ease,
        useNativeDriver: true
      }).start()
    }
  }, [onLoad, isLoaded, index, opacity])

  return (
    <TrackTileContainer>
      {showArtistPick && _artist_pick === track_id && (
        <TrackBannerIcon type={TrackBannerIconType.STAR} />
      )}
      {is_unlisted && <TrackBannerIcon type={TrackBannerIconType.HIDDEN} />}
      <Pressable
        style={styles.mainContent}
        onPress={() => togglePlay(uid, track_id)}
      >
        <Animated.View style={fadeIn}>
          <TrackTileTopRight
            duration={duration}
            isArtistPick={_artist_pick === track_id}
            isUnlisted={is_unlisted}
            showArtistPick={showArtistPick}
          />
          <TrackTileMetadata
            artistName={name}
            coSign={_co_sign}
            coverArtSizes={_cover_art_sizes}
            goToArtistPage={goToArtistPage}
            goToTrackPage={goToTrackPage}
            id={track_id}
            isPlaying={uid === playingUid && isPlaying}
            setArtworkLoaded={setArtworkLoaded}
            title={title}
            user={user}
          />
          {_co_sign && <TrackTileCoSign coSign={_co_sign} />}
          <TrackTileStats
            hidePlays={hidePlays}
            index={index}
            isTrending={isTrending}
            isUnlisted={is_unlisted}
            listenCount={play_count}
            onPressFavorites={onPressFavorites}
            onPressReposts={onPressReposts}
            repostCount={repost_count}
            saveCount={save_count}
            showRankIcon={showRankIcon}
          />
        </Animated.View>
        <TrackTileBottomButtons
          hasReposted={has_current_user_reposted}
          hasSaved={has_current_user_saved}
          isOwner={isOwner}
          isShareHidden={hideShare}
          isUnlisted={is_unlisted}
          trackId={track_id}
        />
      </Pressable>
    </TrackTileContainer>
  )
}
