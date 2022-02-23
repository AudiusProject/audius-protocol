import { useState, useEffect, useRef } from 'react'

import { getUserId } from 'audius-client/src/common/store/account/selectors'
import { Animated, Easing } from 'react-native'
import { useSelector } from 'react-redux'

import { LineupTileProps } from 'app/components/lineup-tile/types'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { getPlaying, getPlayingUid } from 'app/store/audio/selectors'

import { LineupTileActionButtons } from './LineupTileActionButtons'
import {
  LineupTileBannerIcon,
  LineupTileBannerIconType
} from './LineupTileBannerIcon'
import { LineupTileCoSign } from './LineupTileCoSign'
import { LineupTileMetadata } from './LineupTileMetadata'
import { LineupTileRoot } from './LineupTileRoot'
import { LineupTileStats } from './LineupTileStats'
import { LineupTileTopRight } from './LineupTileTopRight'

export const LineupTile = ({
  children,
  coSign,
  duration,
  hidePlays,
  hideShare,
  id,
  index,
  isTrending,
  isUnlisted,
  onLoad,
  onPress,
  onPressOverflow,
  onPressRepost,
  onPressSave,
  onPressShare,
  onPressTitle,
  playCount,
  showArtistPick,
  showRankIcon,
  title,
  item,
  uid,
  user
}: LineupTileProps) => {
  const {
    _cover_art_sizes,
    has_current_user_reposted,
    has_current_user_saved,
    repost_count,
    save_count
  } = item
  const { _artist_pick, name, user_id } = user

  const playingUid = useSelector(getPlayingUid)
  const isPlaying = useSelector(getPlaying)
  const currentUserId = useSelectorWeb(getUserId)

  const [artworkLoaded, setArtworkLoaded] = useState(false)

  const opacity = useRef(new Animated.Value(0)).current

  const isOwner = user_id === currentUserId
  const isLoaded = artworkLoaded
  const fadeIn = { opacity }

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
    <LineupTileRoot onPress={onPress}>
      {showArtistPick && _artist_pick === id ? (
        <LineupTileBannerIcon type={LineupTileBannerIconType.STAR} />
      ) : null}
      {isUnlisted ? (
        <LineupTileBannerIcon type={LineupTileBannerIconType.HIDDEN} />
      ) : null}
      <Animated.View style={fadeIn}>
        <LineupTileTopRight
          duration={duration}
          isArtistPick={_artist_pick === id}
          isUnlisted={isUnlisted}
          showArtistPick={showArtistPick}
        />
        <LineupTileMetadata
          artistName={name}
          coSign={coSign}
          coverArtSizes={_cover_art_sizes}
          id={id}
          onPressTitle={onPressTitle}
          isPlaying={uid === playingUid && isPlaying}
          setArtworkLoaded={setArtworkLoaded}
          title={title}
          user={user}
        />
        {coSign ? <LineupTileCoSign coSign={coSign} /> : null}
        <LineupTileStats
          hidePlays={hidePlays}
          id={id}
          index={index}
          isTrending={isTrending}
          isUnlisted={isUnlisted}
          playCount={playCount}
          repostCount={repost_count}
          saveCount={save_count}
          showRankIcon={showRankIcon}
        />
      </Animated.View>
      {children}
      <LineupTileActionButtons
        hasReposted={has_current_user_reposted}
        hasSaved={has_current_user_saved}
        isOwner={isOwner}
        isShareHidden={hideShare}
        isUnlisted={isUnlisted}
        onPressOverflow={onPressOverflow}
        onPressRepost={onPressRepost}
        onPressSave={onPressSave}
        onPressShare={onPressShare}
      />
    </LineupTileRoot>
  )
}
