import { useState, useEffect, useRef } from 'react'

import { accountSelectors } from '@audius/common'
import { Animated, Easing } from 'react-native'
import { useSelector } from 'react-redux'

import type { LineupTileProps } from 'app/components/lineup-tile/types'

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
const getUserId = accountSelectors.getUserId

export const LineupTile = ({
  children,
  coSign,
  duration,
  favoriteType,
  hidePlays,
  hideShare,
  id,
  imageUrl,
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
  repostType,
  showArtistPick,
  showRankIcon,
  title,
  item,
  uid,
  user,
  isPlayingUid
}: LineupTileProps) => {
  const {
    has_current_user_reposted,
    has_current_user_saved,
    repost_count,
    save_count
  } = item
  const { _artist_pick, name, user_id } = user
  const currentUserId = useSelector(getUserId)

  const [artworkLoaded, setArtworkLoaded] = useState(false)

  const opacity = useRef(new Animated.Value(0.5)).current

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
  }, [onLoad, isLoaded, index, opacity, title])

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
          imageUrl={imageUrl}
          onPressTitle={onPressTitle}
          setArtworkLoaded={setArtworkLoaded}
          uid={uid}
          title={title}
          user={user}
          isPlayingUid={isPlayingUid}
        />
        {coSign ? <LineupTileCoSign coSign={coSign} /> : null}
        <LineupTileStats
          favoriteType={favoriteType}
          repostType={repostType}
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
