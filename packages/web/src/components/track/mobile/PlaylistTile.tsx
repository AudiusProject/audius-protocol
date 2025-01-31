import { MouseEvent, useCallback } from 'react'

import {
  ID,
  UID,
  LineupTrack,
  AccessConditions,
  ModalSource,
  isContentUSDCPurchaseGated
} from '@audius/common/models'
import {
  gatedContentActions,
  PurchaseableContentType,
  usePremiumContentPurchaseModal
} from '@audius/common/store'
import { Nullable, formatLineupTileDuration } from '@audius/common/utils'
import {
  Box,
  Flex,
  IconVolumeLevel2 as IconVolume,
  Text
} from '@audius/harmony'
import cn from 'classnames'
import { range } from 'lodash'
import { useDispatch } from 'react-redux'

import { useModalState } from 'common/hooks/useModalState'
import { CollectionDogEar } from 'components/collection'
import { CollectionTileStats } from 'components/collection/CollectionTileStats'
import { TextLink, UserLink } from 'components/link'
import Skeleton from 'components/skeleton/Skeleton'
import { PlaylistTileProps, TrackTileSize } from 'components/track/types'
import { useRequiresAccountOnClick } from 'hooks/useRequiresAccount'

import BottomButtons from './BottomButtons'
import styles from './PlaylistTile.module.css'
import TrackTileArt from './TrackTileArt'
const { setLockedContentId } = gatedContentActions

type TrackItemProps = {
  index: number
  track?: LineupTrack
  isAlbum: boolean
  active: boolean
  deleted?: boolean
  forceSkeleton?: boolean
}

// Max number of track to display in a playlist
const DISPLAY_TRACK_COUNT = 5

const messages = {
  by: 'by',
  deleted: '[Deleted by Artist]',
  hidden: 'Hidden'
}

const TrackItem = (props: TrackItemProps) => {
  const { active, deleted, index, isAlbum, track, forceSkeleton } = props
  return (
    <>
      <div className={styles.trackItemDivider}></div>
      <div
        className={cn(styles.trackItem, {
          [styles.deletedTrackItem]: deleted,
          [styles.activeTrackItem]: active
        })}
      >
        {forceSkeleton ? (
          <Skeleton width='100%' height='10px' />
        ) : track ? (
          <>
            <div className={styles.index}> {index + 1} </div>
            <div className={styles.trackTitle}> {track.title} </div>
            {!isAlbum ? (
              <div className={styles.byArtist}>
                {' '}
                {`${messages.by} ${track.user.name}`}{' '}
              </div>
            ) : null}
            {deleted ? (
              <div className={styles.deletedTrack}>{messages.deleted}</div>
            ) : null}
          </>
        ) : null}
      </div>
    </>
  )
}

type TrackListProps = {
  activeTrackUid: UID | null
  tracks: LineupTrack[]
  goToCollectionPage: (e: MouseEvent<HTMLElement>) => void
  isLoading?: boolean
  isAlbum: boolean
  numLoadingSkeletonRows?: number
  trackCount?: number
}

const TrackList = ({
  tracks,
  activeTrackUid,
  goToCollectionPage,
  isLoading,
  isAlbum,
  numLoadingSkeletonRows,
  trackCount
}: TrackListProps) => {
  if (!tracks.length && isLoading && numLoadingSkeletonRows) {
    return (
      <Box backgroundColor='surface1'>
        {range(numLoadingSkeletonRows).map((i) => (
          <TrackItem
            key={i}
            active={false}
            index={i}
            isAlbum={isAlbum}
            forceSkeleton
          />
        ))}
      </Box>
    )
  }

  return (
    <Box backgroundColor='surface1' onClick={goToCollectionPage}>
      {tracks.slice(0, DISPLAY_TRACK_COUNT).map((track, index) => (
        <TrackItem
          key={track.uid}
          active={activeTrackUid === track.uid}
          deleted={track.is_delete}
          index={index}
          isAlbum={isAlbum}
          track={track}
        />
      ))}
      {trackCount && trackCount > DISPLAY_TRACK_COUNT ? (
        <>
          <div className={styles.trackItemDivider}></div>
          <div className={cn(styles.trackItem, styles.trackItemMore)}>
            {`+${trackCount - DISPLAY_TRACK_COUNT} more tracks`}
          </div>
        </>
      ) : null}
    </Box>
  )
}

type ExtraProps = {
  index: number
  isLoading: boolean
  isPlaying: boolean
  isActive: boolean
  goToCollectionPage: (e: MouseEvent<HTMLElement>) => void
  toggleSave: () => void
  toggleRepost: () => void
  onClickOverflow: () => void
  onShare: () => void
  togglePlay: () => void
  makeGoToRepostsPage: (id: ID) => (e: MouseEvent<HTMLElement>) => void
  makeGoToFavoritesPage: (id: ID) => (e: MouseEvent<HTMLElement>) => void
  isOwner: boolean
  isUnlisted: boolean
  darkMode: boolean
  isMatrix: boolean
  isStreamGated: boolean
  hasStreamAccess: boolean
  streamConditions: Nullable<AccessConditions>
}

const PlaylistTile = (props: PlaylistTileProps & ExtraProps) => {
  const {
    id,
    index,
    showSkeleton,
    numLoadingSkeletonRows,
    trackCount,
    variant,
    containerClassName,
    permalink,
    isActive,
    isUnlisted,
    playlistTitle,
    isPlaying,
    isAlbum,
    ownerId,
    hasStreamAccess,
    streamConditions,
    source,
    isTrending
  } = props

  const isReadonly = variant === 'readonly'
  const shouldShow = !showSkeleton
  const fadeIn = {
    [styles.show]: shouldShow,
    [styles.hide]: !shouldShow
  }

  const [, setModalVisibility] = useModalState('LockedContent')
  const dispatch = useDispatch()
  const openLockedContentModal = useCallback(() => {
    if (id) {
      dispatch(setLockedContentId({ id }))
      setModalVisibility(true)
    }
  }, [dispatch, id, setModalVisibility])

  const { onOpen: openPremiumContentPurchaseModal } =
    usePremiumContentPurchaseModal()
  const isPurchase = isContentUSDCPurchaseGated(streamConditions)

  const onClickGatedUnlockPill = useRequiresAccountOnClick(() => {
    if (isPurchase && id) {
      openPremiumContentPurchaseModal(
        { contentId: id, contentType: PurchaseableContentType.ALBUM },
        { source: source ?? ModalSource.TrackTile }
      )
    } else if (id && !hasStreamAccess) {
      openLockedContentModal()
    }
  }, [
    isPurchase,
    id,
    openPremiumContentPurchaseModal,
    hasStreamAccess,
    openLockedContentModal
  ])

  return (
    <div
      className={cn(
        styles.container,
        { [styles.readonly]: isReadonly },
        containerClassName
      )}
    >
      <CollectionDogEar collectionId={id} borderOffset={0} hideUnlocked />
      <div
        css={{ overflow: 'hidden' }}
        className={styles.mainContent}
        onClick={props.togglePlay}
      >
        <Text
          className={cn(styles.duration, fadeIn)}
          variant='body'
          size='xs'
          strength='default'
          color='subdued'
        >
          {formatLineupTileDuration(
            props.duration,
            false,
            /* isCollection */ true
          )}
        </Text>

        <div className={styles.metadata}>
          <TrackTileArt
            id={props.id}
            isTrack={false}
            showSkeleton={props.showSkeleton}
            className={styles.albumArtContainer}
            isPlaying={props.isPlaying}
            isBuffering={props.isLoading}
            artworkIconClassName={styles.artworkIcon}
          />
          <Flex
            direction='column'
            justifyContent='center'
            gap='2xs'
            mt='m'
            mr='m'
            flex='0 1 65%'
            css={{ overflow: 'hidden' }}
          >
            <TextLink
              to={permalink ?? ''}
              textVariant='title'
              isActive={isActive}
              applyHoverStylesToInnerSvg
            >
              <Text ellipses className={cn(fadeIn)}>
                {playlistTitle}
              </Text>
              {isPlaying ? <IconVolume size='m' /> : null}
              {!shouldShow ? (
                <Skeleton className={styles.skeleton} height='20px' />
              ) : null}
            </TextLink>
            <UserLink userId={ownerId} badgeSize='xs'>
              {!shouldShow ? (
                <Skeleton className={styles.skeleton} height='20px' />
              ) : null}
            </UserLink>
          </Flex>
        </div>
        <Flex ph='s'>
          <CollectionTileStats
            collectionId={id}
            isTrending={isTrending}
            rankIndex={index}
            size={TrackTileSize.SMALL}
          />
        </Flex>
        <TrackList
          activeTrackUid={props.activeTrackUid}
          goToCollectionPage={props.goToCollectionPage}
          tracks={props.tracks}
          isLoading={showSkeleton}
          isAlbum={isAlbum}
          numLoadingSkeletonRows={numLoadingSkeletonRows}
          trackCount={trackCount}
        />
        {!isReadonly ? (
          <div className={cn(fadeIn)}>
            <BottomButtons
              hasSaved={props.hasCurrentUserSaved}
              hasReposted={props.hasCurrentUserReposted}
              toggleSave={props.toggleSave}
              toggleRepost={props.toggleRepost}
              onShare={props.onShare}
              onClickOverflow={props.onClickOverflow}
              onClickGatedUnlockPill={onClickGatedUnlockPill}
              isLoading={props.isLoading}
              isOwner={props.isOwner}
              isDarkMode={props.darkMode}
              isMatrixMode={props.isMatrix}
              hasStreamAccess={props.hasStreamAccess}
              streamConditions={props.streamConditions}
              isUnlisted={isUnlisted}
              contentId={id}
              contentType='playlist'
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default PlaylistTile
