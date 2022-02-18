import { useState, useEffect, useRef, useCallback } from 'react'

import { Track } from 'audius-client/src/common/models/Track'
import { User } from 'audius-client/src/common/models/User'
import { getUserId } from 'audius-client/src/common/store/account/selectors'
import { getTrack } from 'audius-client/src/common/store/cache/tracks/selectors'
import { getUserFromTrack } from 'audius-client/src/common/store/cache/users/selectors'
import { isEqual } from 'lodash'
import { Animated, Easing } from 'react-native'
import { useSelector } from 'react-redux'

import { TrackTileProps } from 'app/components/track-tile/types'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { getPlaying, getPlayingUid } from 'app/store/audio/selectors'

import { TrackBannerIcon, TrackBannerIconType } from './TrackBannerIcon'
import { TrackTileActionButtons } from './TrackTileActionButtons'
import { TrackTileCoSign } from './TrackTileCoSign'
import { TrackTileMetadata } from './TrackTileMetadata'
import { TrackTileRoot } from './TrackTileRoot'
import { TrackTileStats } from './TrackTileStats'
import { TrackTileTopRight } from './TrackTileTopRight'

export const TrackTile = (props: TrackTileProps) => {
  const { uid } = props

  // Using isEqual as the equality function to prevent rerenders due to object references
  // not being preserved when syncing redux state from client.
  // This can be removed when no longer dependent on web client
  const track = useSelectorWeb(state => getTrack(state, { uid }), isEqual)
  const user = useSelectorWeb(
    state => getUserFromTrack(state, { uid }),
    isEqual
  )

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
    permalink,
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

  const playingUid = useSelector(getPlayingUid)
  const isPlaying = useSelector(getPlaying)
  const currentUserId = useSelectorWeb(getUserId)

  const [artworkLoaded, setArtworkLoaded] = useState(false)

  const opacity = useRef(new Animated.Value(0)).current

  const isOwner = user_id === currentUserId
  const isLoaded = artworkLoaded
  const fadeIn = { opacity }

  const hideShare: boolean = field_visibility?.share === false
  const hidePlays = field_visibility?.play_count === false

  const handlePress = useCallback(() => togglePlay(uid, track_id), [
    togglePlay,
    uid,
    track_id
  ])

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
    <TrackTileRoot onPress={handlePress}>
      {showArtistPick && _artist_pick === track_id && (
        <TrackBannerIcon type={TrackBannerIconType.STAR} />
      )}
      {is_unlisted && <TrackBannerIcon type={TrackBannerIconType.HIDDEN} />}
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
          id={track_id}
          permalink={permalink}
          isPlaying={uid === playingUid && isPlaying}
          setArtworkLoaded={setArtworkLoaded}
          title={title}
          user={user}
        />
        {_co_sign && <TrackTileCoSign coSign={_co_sign} />}
        <TrackTileStats
          trackId={track_id}
          hidePlays={hidePlays}
          index={index}
          isTrending={isTrending}
          isUnlisted={is_unlisted}
          listenCount={play_count}
          repostCount={repost_count}
          saveCount={save_count}
          showRankIcon={showRankIcon}
        />
      </Animated.View>
      <TrackTileActionButtons
        hasReposted={has_current_user_reposted}
        hasSaved={has_current_user_saved}
        isOwner={isOwner}
        isShareHidden={hideShare}
        isUnlisted={is_unlisted}
        trackId={track_id}
      />
    </TrackTileRoot>
  )
}
