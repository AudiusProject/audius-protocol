import { ChangeEvent, useMemo } from 'react'

import {
  Variant,
  Status,
  Collection,
  SmartCollection,
  ID,
  User,
  isContentUSDCPurchaseGated,
  ModalSource,
  Track
} from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import {
  CollectionTrack,
  CollectionsPageType,
  CollectionPageTrackRecord,
  usePremiumContentPurchaseModal,
  PurchaseableContentType
} from '@audius/common/store'
import { getDogEarType, removeNullable } from '@audius/common/utils'

import {
  CollectiblesPlaylistTableColumn,
  CollectiblesPlaylistTable
} from 'components/collectibles-playlist-table/CollectiblesPlaylistTable'
import { CollectionHeader } from 'components/collection/desktop/CollectionHeader'
import { Divider } from 'components/divider'
import Page from 'components/page/Page'
import { SuggestedTracks } from 'components/suggested-tracks'
import { Tile } from 'components/tile'
import { TracksTable, TracksTableColumn } from 'components/tracks-table'
import { useAuthenticatedCallback } from 'hooks/useAuthenticatedCallback'
import { useFlag } from 'hooks/useRemoteConfig'
import { smartCollectionIcons } from 'pages/collection-page/smartCollectionIcons'
import { computeCollectionMetadataProps } from 'pages/collection-page/store/utils'

import styles from './CollectionPage.module.css'

const getMessages = (collectionType: 'album' | 'playlist') => ({
  emptyPage: {
    owner: `This ${collectionType} is empty. Start adding tracks to share it or make it public.`,
    visitor: `This ${collectionType} is empty...`
  },
  type: {
    playlist: 'Playlist',
    album: 'Album'
  },
  remove: 'Remove from this'
})

const EmptyPage = (props: {
  text?: string | null
  isOwner: boolean
  isAlbum: boolean
}) => {
  const messages = getMessages(props.isAlbum ? 'album' : 'playlist')
  const text =
    props.text ||
    (props.isOwner ? messages.emptyPage.owner : messages.emptyPage.visitor)
  return (
    <div className={styles.emptyWrapper}>
      <p className={styles.emptyText}>{text}</p>
    </div>
  )
}

export type CollectionPageProps = {
  title: string
  description: string
  canonicalUrl: string
  structuredData?: Object
  playlistId: ID
  playing: boolean
  previewing: boolean
  getPlayingUid: () => string | null
  type: CollectionsPageType
  collection: {
    status: string
    metadata: Collection | SmartCollection | null
    user: User | null
  }
  tracks: {
    status: string
    entries: CollectionTrack[]
  }
  userId?: ID | null
  userPlaylists?: any
  isQueued: () => boolean
  onPlay: () => void
  onPreview: () => void
  onClickRow: (record: CollectionPageTrackRecord, index: number) => void
  onClickSave?: (record: CollectionPageTrackRecord) => void
  allowReordering: boolean
  getFilteredData: (
    trackMetadata: CollectionTrack[]
  ) => [CollectionPageTrackRecord[], number]
  onFilterChange: (evt: ChangeEvent<HTMLInputElement>) => void
  onClickRepostTrack: (record: CollectionPageTrackRecord) => void
  onClickPurchaseTrack: (record: CollectionPageTrackRecord) => void
  onSortTracks: (sorters: any) => void
  onReorderTracks: (source: number, destination: number) => void
  onClickRemove: (
    trackId: number,
    index: number,
    uid: string,
    timestamp: number
  ) => void
  onClickReposts?: () => void
  onClickFavorites?: () => void
}

const CollectionPage = ({
  title,
  description: pageDescription,
  canonicalUrl,
  structuredData,
  playlistId,
  allowReordering,
  playing,
  previewing,
  type,
  collection,
  tracks,
  userId,
  getFilteredData,
  isQueued,
  onFilterChange,
  onPlay,
  onPreview,
  onClickRow,
  onClickSave,
  onClickRepostTrack,
  onClickPurchaseTrack,
  onSortTracks,
  onReorderTracks,
  onClickRemove,
  onClickReposts,
  onClickFavorites
}: CollectionPageProps) => {
  const { status, metadata, user } = collection
  const { isEnabled: isPremiumAlbumsEnabled } = useFlag(
    FeatureFlags.PREMIUM_ALBUMS_ENABLED
  )

  // TODO: Consider dynamic lineups, esp. for caching improvement.
  const [dataSource, playingIndex] =
    tracks.status === Status.SUCCESS
      ? getFilteredData(tracks.entries)
      : [[], -1]
  const collectionLoading = status === Status.LOADING
  const queuedAndPlaying = playing && isQueued()
  const queuedAndPreviewing = previewing && isQueued()
  const tracksLoading =
    tracks.status === Status.LOADING || tracks.status === Status.IDLE

  const coverArtSizes =
    metadata && metadata?.variant !== Variant.SMART
      ? metadata._cover_art_sizes
      : null
  const duration =
    tracks.entries?.reduce(
      (duration: number, entry: CollectionTrack) =>
        duration + entry.duration || 0,
      0
    ) ?? 0

  const playlistOwnerName = user?.name ?? ''
  const playlistOwnerHandle = user?.handle ?? ''
  const playlistOwnerId = user?.user_id ?? null
  const isOwner = userId === playlistOwnerId

  const variant = metadata?.variant ?? null
  const gradient = metadata?.variant === Variant.SMART ? metadata.gradient : ''
  const icon =
    metadata?.variant === Variant.SMART
      ? smartCollectionIcons[metadata.playlist_name]
      : null
  const imageOverride =
    metadata?.variant === Variant.SMART ? metadata.imageOverride : ''
  const typeTitle =
    metadata?.variant === Variant.SMART ? metadata?.typeTitle ?? type : type
  const customEmptyText =
    metadata?.variant === Variant.SMART ? metadata?.customEmptyText : null
  const access =
    metadata !== null && 'access' in metadata ? metadata?.access : null

  const isNftPlaylist = typeTitle === 'Audio NFT Playlist'

  const streamConditions =
    metadata && 'stream_conditions' in metadata
      ? metadata?.stream_conditions
      : null

  const {
    isEmpty,
    lastModifiedDate,
    releaseDate,
    playlistName,
    description,
    isPrivate,
    isAlbum,
    playlistSaveCount,
    playlistRepostCount
  } = computeCollectionMetadataProps(metadata)
  const numTracks = tracks.entries.length
  const areAllTracksDeleted = tracks.entries.every((track) => track.is_delete)
  const areAllTracksPremium = tracks.entries.every(
    (track) =>
      track.is_stream_gated &&
      isContentUSDCPurchaseGated(track.stream_conditions)
  )

  // Note: This would normally belong in the CollectionPageProvider,
  // but it benefits us more to reuse existing hooks and that component cannot use hooks
  const { onOpen: openPremiumContentModal } = usePremiumContentPurchaseModal()
  const openPurchaseModal = useAuthenticatedCallback(
    ({ track_id }: Track) => {
      openPremiumContentModal(
        { contentId: track_id, contentType: PurchaseableContentType.TRACK },
        { source: ModalSource.TrackListItem }
      )
    },
    [openPremiumContentModal]
  )
  const isPlayable = !areAllTracksDeleted && numTracks > 0
  const dogEarType =
    (!collectionLoading &&
      getDogEarType({
        streamConditions
      })) ||
    undefined

  const topSection = (
    <CollectionHeader
      access={access}
      collectionId={playlistId}
      userId={playlistOwnerId}
      loading={isNftPlaylist ? tracksLoading : collectionLoading}
      tracksLoading={tracksLoading}
      type={typeTitle}
      title={playlistName}
      artistName={playlistOwnerName}
      artistHandle={playlistOwnerHandle}
      coverArtSizes={coverArtSizes}
      description={description}
      isOwner={isOwner}
      isAlbum={isAlbum}
      numTracks={numTracks}
      isPlayable={isPlayable}
      lastModifiedDate={lastModifiedDate}
      releaseDate={releaseDate}
      duration={duration}
      isPublished={!isPrivate}
      reposts={playlistRepostCount}
      saves={playlistSaveCount}
      playing={queuedAndPlaying}
      previewing={queuedAndPreviewing}
      // Actions
      onFilterChange={onFilterChange}
      onPlay={onPlay}
      onPreview={onPreview}
      onClickReposts={onClickReposts}
      onClickFavorites={onClickFavorites}
      // Smart collection
      variant={variant}
      gradient={gradient}
      icon={icon}
      imageOverride={imageOverride}
      ownerId={playlistOwnerId}
      isStreamGated={
        metadata?.variant === Variant.USER_GENERATED
          ? metadata?.is_stream_gated
          : null
      }
      streamConditions={
        metadata?.variant === Variant.USER_GENERATED
          ? metadata?.stream_conditions
          : null
      }
    />
  )

  const TableComponent = useMemo(() => {
    return isNftPlaylist ? CollectiblesPlaylistTable : TracksTable
  }, [isNftPlaylist])

  const tracksTableColumns = useMemo(() => {
    let columns: (
      | TracksTableColumn
      | CollectiblesPlaylistTableColumn
      | undefined
    )[]

    if (isNftPlaylist) {
      columns = ['playButton', 'collectibleName', 'chain', 'length', 'spacer']
    } else {
      columns = [
        'playButton',
        'trackName',
        isAlbum ? undefined : 'artistName',
        isAlbum ? 'date' : 'addedDate',
        'length',
        areAllTracksPremium ? undefined : 'plays',
        'reposts',
        'overflowActions'
      ]
    }
    return columns.filter(removeNullable)
  }, [areAllTracksPremium, isAlbum, isNftPlaylist])

  const messages = getMessages(isAlbum ? 'album' : 'playlist')
  return (
    <Page
      title={title}
      description={pageDescription}
      canonicalUrl={canonicalUrl}
      structuredData={structuredData}
      containerClassName={styles.pageContainer}
      contentClassName={styles.pageContent}
      fromOpacity={1}
      scrollableSearch
    >
      <Tile
        className={styles.bodyWrapper}
        size='large'
        elevation='mid'
        dogEar={isPremiumAlbumsEnabled ? dogEarType : undefined}
      >
        <div className={styles.topSectionWrapper}>{topSection}</div>
        {!collectionLoading && isEmpty ? (
          <EmptyPage
            isOwner={isOwner}
            isAlbum={isAlbum}
            text={customEmptyText}
          />
        ) : (
          <div className={styles.tableWrapper}>
            <TableComponent
              // @ts-ignore
              columns={tracksTableColumns}
              wrapperClassName={styles.tracksTableWrapper}
              key={playlistName}
              loading={isNftPlaylist ? collectionLoading : tracksLoading}
              userId={userId}
              playing={playing}
              playingIndex={playingIndex}
              data={dataSource}
              onClickRow={onClickRow}
              onClickFavorite={onClickSave}
              onClickRemove={isOwner ? onClickRemove : undefined}
              onClickRepost={onClickRepostTrack}
              onClickPurchase={openPurchaseModal}
              isPremiumEnabled={isPremiumAlbumsEnabled}
              onReorderTracks={onReorderTracks}
              onSortTracks={onSortTracks}
              isReorderable={
                userId !== null && userId === playlistOwnerId && allowReordering
              }
              removeText={`${messages.remove} ${
                isAlbum ? messages.type.album : messages.type.playlist
              }`}
              isAlbumPage={isAlbum}
              isAlbumPremium={
                !!metadata && 'is_stream_gated' in metadata
                  ? metadata?.is_stream_gated
                  : false
              }
            />
          </div>
        )}
      </Tile>

      {!collectionLoading && isOwner && !isAlbum && !isNftPlaylist ? (
        <>
          <Divider variant='default' className={styles.tileDivider} />
          <SuggestedTracks collectionId={playlistId} />
        </>
      ) : null}
    </Page>
  )
}

export default CollectionPage
