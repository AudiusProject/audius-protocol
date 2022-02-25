import { useState } from 'react'

import { ID } from 'audius-client/src/common/models/Identifiers'
import {
  CoverArtSizes,
  SquareSizes
} from 'audius-client/src/common/models/ImageSizes'
import { User } from 'audius-client/src/common/models/User'
import { ImageBackground, Text, TouchableOpacity, View } from 'react-native'

import IconHeart from 'app/assets/images/iconHeart.svg'
import IconPause from 'app/assets/images/pbIconPause.svg'
import IconPlay from 'app/assets/images/pbIconPlay.svg'
import { useTrackCoverArt } from 'app/hooks/useTrackCoverArt'
import { font, makeStyles } from 'app/styles'
import { useThemeColors } from 'app/utils/theme'

import { IconButton } from '../core'
import UserBadges from '../user-badges'

import { TablePlayButton } from './TablePlayButton'

export type TrackItemAction = 'save' | 'overflow'

type ArtworkIconProps = {
  isLoading: boolean
  isPlaying: boolean
}

const useStyles = makeStyles(({ palette, spacing }) => ({
  artworkContainer: {
    position: 'relative',
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 52,
    height: 52,
    width: 52,
    marginRight: spacing(4),
    borderRadius: 4
  },
  artwork: {
    height: '100%',
    width: '100%',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center'
  },
  artworkIcon: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 4
  },
  artworkIconSvg: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    height: '40%',
    width: '40%'
  },
  trackContainer: {
    width: '100%',
    height: 72,
    backgroundColor: palette.white
  },
  trackContainerActive: {
    backgroundColor: palette.neutralLight9
  },
  trackInnerContainer: {
    height: '100%',
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingVertical: spacing(3),
    paddingHorizontal: spacing(6)
  },
  nameArtistContainer: {
    flex: 1,
    justifyContent: 'center',
    overflow: 'hidden',
    height: '100%'
  },
  trackTitle: {
    ...font('demiBold'),
    color: palette.neutral
  },
  artistName: {
    ...font('medium'),
    color: palette.neutralLight2,
    alignItems: 'center'
  },
  iconContainer: {
    marginLeft: spacing(2)
  },
  playButtonContainer: {
    marginRight: spacing(4)
  }
}))

const ArtworkIcon = ({ isLoading, isPlaying }: ArtworkIconProps) => {
  const [artworkHeight, setArtworkHeight] = useState(0)
  const [artworkWidth, setArtworkWidth] = useState(0)
  const styles = useStyles()

  const handleLayout = e => {
    setArtworkWidth(e.nativeEvent.layout.width)
    setArtworkHeight(e.nativeEvent.layout.height)
  }

  let artworkIcon

  if (isLoading) {
    artworkIcon = (
      // <div className={styles.loadingAnimation}>
      //   <Lottie
      //     options={{
      //       loop: true,
      //       autoplay: true,
      //       animationData: loadingSpinner
      //     }}
      //   />
      // </div>
      <View>
        <Text>Loading...</Text>
      </View>
    )
  } else {
    const Icon = isPlaying ? IconPause : IconPlay
    artworkIcon = (
      <Icon
        style={[
          styles.artworkIconSvg,
          {
            transform: [
              {
                translateX: -(artworkWidth / 2),
                translateY: -(artworkHeight / 2)
              }
            ]
          }
        ]}
      />
    )
  }

  return (
    <View onLayout={handleLayout} style={styles.artworkIcon}>
      {artworkIcon}
    </View>
  )
}

type ArtworkProps = {
  trackId: ID
  isLoading: boolean
  isActive?: boolean
  isPlaying: boolean
  coverArtSizes: CoverArtSizes
}

const Artwork = ({
  trackId,
  isPlaying,
  isActive,
  isLoading,
  coverArtSizes
}: ArtworkProps) => {
  const styles = useStyles()
  const image = useTrackCoverArt(
    trackId,
    coverArtSizes,
    SquareSizes.SIZE_150_BY_150
  )

  return (
    <View style={styles.artworkContainer}>
      <View style={styles.artwork}>
        <ImageBackground
          source={image}
          resizeMode='cover'
          style={{ justifyContent: 'center' }}
        >
          {isActive ? (
            <ArtworkIcon isLoading={isLoading} isPlaying={isPlaying} />
          ) : null}
        </ImageBackground>
      </View>
    </View>
  )
}

const getMessages = ({ isDeleted = false }: { isDeleted?: boolean } = {}) => ({
  deleted: isDeleted ? ' [Deleted By Artist]' : ''
})

export type TrackListItemProps = {
  index: number
  isLoading: boolean
  isSaved?: boolean
  isReposted?: boolean
  isActive?: boolean
  isPlaying?: boolean
  isRemoveActive?: boolean
  isDeleted: boolean
  coverArtSizes?: CoverArtSizes
  artistName: string
  artistHandle: string
  trackTitle: string
  trackId: ID
  user: User
  uid?: string
  isReorderable?: boolean
  isDragging?: boolean
  onSave?: (isSaved: boolean, trackId: ID) => void
  onRemove?: (trackId: ID) => void
  togglePlay?: (uid: string, trackId: ID) => void
  onClickOverflow?: () => void
  trackItemAction?: TrackItemAction
}

export const TrackListItem = ({
  isLoading,
  index,
  isSaved = false,
  isActive = false,
  isPlaying = false,
  isRemoveActive = false,
  artistName,
  trackTitle,
  trackId,
  user,
  uid,
  coverArtSizes,
  isDeleted,
  onSave,
  onRemove,
  togglePlay,
  trackItemAction,
  onClickOverflow,
  isReorderable = false,
  isDragging = false
}: TrackListItemProps) => {
  const messages = getMessages({ isDeleted })
  const styles = useStyles()
  const themeColors = useThemeColors()

  const onClickTrack = () => {
    if (uid && !isDeleted && togglePlay) togglePlay(uid, trackId)
  }

  const onSaveTrack = () => {
    const isNotAvailable = isDeleted && !isSaved
    if (!isNotAvailable && onSave) onSave(isSaved, trackId)
  }

  return (
    <View
      style={[
        styles.trackContainer,
        isActive ? styles.trackContainerActive : {}
      ]}
    >
      <TouchableOpacity
        style={styles.trackInnerContainer}
        onPress={onClickTrack}
      >
        {coverArtSizes ? (
          <Artwork
            trackId={trackId}
            coverArtSizes={coverArtSizes}
            isActive={isActive}
            isLoading={isLoading}
            isPlaying={isPlaying}
          />
        ) : isActive && !isDeleted ? (
          <View style={styles.playButtonContainer}>
            <TablePlayButton playing paused={!isPlaying} hideDefault={false} />
          </View>
        ) : null}
        <View style={styles.nameArtistContainer}>
          <Text numberOfLines={1} style={styles.trackTitle}>
            {trackTitle}
            {messages.deleted}
          </Text>
          <Text numberOfLines={1} style={styles.artistName}>
            {artistName}
            <UserBadges user={user} badgeSize={12} hideName />
          </Text>
        </View>
        {onSaveTrack && trackItemAction === 'save' && (
          <IconButton
            icon={IconHeart}
            styles={{ icon: { height: 16, width: 16 } }}
            fill={isSaved ? themeColors.primary : themeColors.neutralLight4}
            onPress={onSaveTrack}
          />
        )}
      </TouchableOpacity>
    </View>
  )
}
