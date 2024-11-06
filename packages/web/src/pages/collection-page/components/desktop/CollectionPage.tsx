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
import {
  CollectionTrack,
  CollectionsPageType,
  CollectionPageTrackRecord,
  usePremiumContentPurchaseModal,
  PurchaseableContentType
} from '@audius/common/store'
import { removeNullable } from '@audius/common/utils'
import { Flex, Paper, Text } from '@audius/harmony'

import {
  CollectiblesPlaylistTableColumn,
  CollectiblesPlaylistTable
} from 'components/collectibles-playlist-table/CollectiblesPlaylistTable'
import { CollectionDogEar } from 'components/collection'
import { CollectionHeader } from 'components/collection/desktop/CollectionHeader'
import { Divider } from 'components/divider'
import Page from 'components/page/Page'
import { SuggestedTracks } from 'components/suggested-tracks'
import { TracksTable, TracksTableColumn } from 'components/tracks-table'
import { useRequiresAccountCallback } from 'hooks/useRequiresAccount'
import { smartCollectionIcons } from 'pages/collection-page/smartCollectionIcons'
import { computeCollectionMetadataProps } from 'pages/collection-page/store/utils'

import styles from './CollectionPage.module.css'

const messages = {
  noFilterMatches: 'No tracks match your search...'
}

const getMessages = (collectionType: 'album' | 'playlist') => ({
  emptyPage: {
    ownerTitle: 'Nothing here yet',
    ownerCta: 'Start adding tracks',
    visitor: `This ${collectionType} is empty...`
  },
  type: {
    playlist: 'Playlist',
    album: 'Album'
  },
  remove: 'Remove from this'
})

type EmptyContentProps = {
  text?: string | null
  isOwner: boolean
  isAlbum: boolean
}

const EmptyContent = (props: EmptyContentProps) => {
  const { isAlbum, isOwner, text: textProp } = props
  const messages = getMessages(isAlbum ? 'album' : 'playlist')
  return (
    <Flex column p='2xl' alignItems='center' gap='s'>
      <Text variant='title' size='l'>
        {textProp ?? isOwner
          ? messages.emptyPage.ownerTitle
          : messages.emptyPage.visitor}
      </Text>
      {isOwner ? <Text size='l'>{messages.emptyPage.ownerCta}</Text> : null}
    </Flex>
  )
}

const NoSearchResultsContent = () => {
  return (
    <Flex column p='2xl' alignItems='center' gap='s'>
      <Text variant='title' size='l'>
        {messages.noFilterMatches}
      </Text>
    </Flex>
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
    status: Status
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
  trackCount: number
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
  onSortTracks,
  onReorderTracks,
  onClickRemove,
  onClickReposts,
  onClickFavorites,
  trackCount
}: CollectionPageProps) => {
  const { status, metadata, user } = collection

  // TODO: Consider dynamic lineups, esp. for caching improvement.
  const [dataSource, playingIndex] =
    tracks.status === Status.SUCCESS
      ? getFilteredData(tracks.entries)
      : [[], -1]
  const collectionLoading = status === Status.LOADING
  const queuedAndPlaying = playing && isQueued()
  const queuedAndPreviewing = previewing && isQueued()
  const tracksLoading =
    trackCount > 0 &&
    (tracks.status === Status.LOADING || tracks.status === Status.IDLE)

  const coverArtSizes =
    metadata && metadata?.variant !== Variant.SMART
      ? metadata._cover_art_sizes
      : null
  const duration =
    dataSource.reduce(
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
  } = computeCollectionMetadataProps(metadata, tracks)
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
  const openPurchaseModal = useRequiresAccountCallback(
    ({ track_id }: Track) => {
      openPremiumContentModal(
        { contentId: track_id, contentType: PurchaseableContentType.TRACK },
        { source: ModalSource.TrackListItem }
      )
    },
    [openPremiumContentModal]
  )
  const isPlayable = !areAllTracksDeleted && numTracks > 0

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
      <Paper column mb='unit-10' css={{ minWidth: 774 }}>
        <CollectionDogEar collectionId={playlistId} borderOffset={0} />
        <div className={styles.topSectionWrapper}>{topSection}</div>
        {!collectionLoading && isEmpty ? (
          <EmptyContent
            isOwner={isOwner}
            isAlbum={isAlbum}
            text={customEmptyText}
          />
        ) : !collectionLoading && dataSource.length === 0 ? (
          <NoSearchResultsContent />
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
      </Paper>

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
