import {
  PlayableType,
  SquareSizes,
  ID,
  CoverArtSizes,
  Playable,
  User
} from '@audius/common/models'
import { NestedNonNullable } from '@audius/common/utils'
import { Button, IconUser } from '@audius/harmony'

import { ArtistPopover } from 'components/artist/ArtistPopover'
import DynamicImage from 'components/dynamic-image/DynamicImage'
import Lineup, { LineupProps } from 'components/lineup/Lineup'
import MobilePageContainer from 'components/mobile-page-container/MobilePageContainer'
import UserBadges from 'components/user-badges/UserBadges'
import { useCollectionCoverArt } from 'hooks/useCollectionCoverArt'
import { useTrackCoverArt } from 'hooks/useTrackCoverArt'
import { withNullGuard } from 'utils/withNullGuard'

import styles from './DeletedPage.module.css'

const messages = {
  trackDeleted: 'Track [Deleted]',
  trackDeletedByArtist: 'Track [Deleted By Artist]',
  playlistDeleted: 'Playlist [Deleted by Artist]',
  albumDeleted: 'Album [Deleted By Artist]',
  checkOut: (name: string) => `Check out more by ${name}`,
  moreBy: (name: string) => `More by ${name}`
}

const TrackArt = ({
  trackId,
  coverArtSizes
}: {
  trackId: ID
  coverArtSizes: CoverArtSizes
}) => {
  const image = useTrackCoverArt({
    trackId,
    size: SquareSizes.SIZE_480_BY_480
  })
  return <DynamicImage wrapperClassName={styles.image} image={image} />
}

const CollectionArt = ({
  collectionId,
  coverArtSizes
}: {
  collectionId: ID
  coverArtSizes: CoverArtSizes
}) => {
  const image = useCollectionCoverArt(
    collectionId,
    coverArtSizes,
    SquareSizes.SIZE_480_BY_480
  )
  return <DynamicImage wrapperClassName={styles.image} image={image} />
}

export type DeletedPageProps = {
  title: string
  description: string
  canonicalUrl: string
  structuredData?: Object
  deletedByArtist: boolean

  playable: Playable
  user: User | null
  getLineupProps: () => LineupProps
  goToArtistPage: () => void
}

const g = withNullGuard(
  ({ playable, user, ...p }: DeletedPageProps) =>
    playable?.metadata &&
    user && { ...p, playable: playable as NestedNonNullable<Playable>, user }
)

const DeletedPage = g(
  ({
    title,
    description,
    canonicalUrl,
    structuredData,
    playable,
    deletedByArtist = true,
    user,
    getLineupProps,
    goToArtistPage
  }) => {
    const isPlaylist =
      playable.type === PlayableType.PLAYLIST ||
      playable.type === PlayableType.ALBUM
    const isAlbum = playable.type === PlayableType.ALBUM

    const headingText = isPlaylist
      ? isAlbum
        ? messages.albumDeleted
        : messages.playlistDeleted
      : deletedByArtist
      ? messages.trackDeletedByArtist
      : messages.trackDeleted

    const renderTile = () => {
      return (
        <div className={styles.tile}>
          <div className={styles.type}>{headingText}</div>
          {playable.type === PlayableType.PLAYLIST ||
          playable.type === PlayableType.ALBUM ? (
            <CollectionArt
              collectionId={playable.metadata.playlist_id}
              coverArtSizes={playable.metadata._cover_art_sizes}
            />
          ) : (
            <TrackArt
              trackId={playable.metadata.track_id}
              coverArtSizes={playable.metadata._cover_art_sizes}
            />
          )}
          <div className={styles.title}>
            <h1>
              {playable.type === PlayableType.PLAYLIST ||
              playable.type === PlayableType.ALBUM
                ? playable.metadata.playlist_name
                : playable.metadata.title}
            </h1>
          </div>
          <div className={styles.artistWrapper}>
            <span>By</span>
            <ArtistPopover handle={user.handle}>
              <h2 className={styles.artist} onClick={goToArtistPage}>
                {user.name}
                <UserBadges
                  userId={user.user_id}
                  badgeSize={16}
                  className={styles.verified}
                />
              </h2>
            </ArtistPopover>
          </div>
          <Button
            variant='secondary'
            iconLeft={IconUser}
            onClick={goToArtistPage}
          >
            {messages.checkOut(user.name)}
          </Button>
        </div>
      )
    }

    const renderLineup = () => {
      return (
        <div className={styles.lineupWrapper}>
          <div className={styles.lineupHeader}>{`${messages.moreBy(
            user.name
          )}`}</div>
          <Lineup {...getLineupProps()} />
        </div>
      )
    }

    return (
      <MobilePageContainer
        title={title}
        description={description}
        canonicalUrl={canonicalUrl}
        structuredData={structuredData}
      >
        <div className={styles.contentWrapper}>
          {renderTile()}
          {renderLineup()}
        </div>
      </MobilePageContainer>
    )
  }
)

export default DeletedPage
