import {
  PlayableType,
  SquareSizes,
  ID,
  Playable,
  User
} from '@audius/common/models'
import { NestedNonNullable } from '@audius/common/utils'
import { Button, IconUser } from '@audius/harmony'

import { ArtistPopover } from 'components/artist/ArtistPopover'
import CoverPhoto from 'components/cover-photo/CoverPhoto'
import DynamicImage from 'components/dynamic-image/DynamicImage'
import Lineup, { LineupProps } from 'components/lineup/Lineup'
import NavBanner from 'components/nav-banner/NavBanner'
import Page from 'components/page/Page'
import { StatBanner } from 'components/stat-banner/StatBanner'
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

const TrackArt = ({ trackId }: { trackId: ID }) => {
  const image = useTrackCoverArt({
    trackId,
    size: SquareSizes.SIZE_480_BY_480
  })
  return <DynamicImage wrapperClassName={styles.image} image={image} />
}

const CollectionArt = ({ collectionId }: { collectionId: ID }) => {
  const image = useCollectionCoverArt({
    collectionId,
    size: SquareSizes.SIZE_480_BY_480
  })
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
    user && {
      ...p,
      playable: playable as NestedNonNullable<Playable>,
      user
    }
)

const DeletedPage = g(
  ({
    title,
    description,
    canonicalUrl,
    structuredData,
    playable,
    user,
    deletedByArtist = true,
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
          {playable.type === PlayableType.PLAYLIST ||
          playable.type === PlayableType.ALBUM ? (
            <CollectionArt collectionId={playable.metadata.playlist_id} />
          ) : (
            <TrackArt trackId={playable.metadata.track_id} />
          )}
          <div className={styles.rightSide}>
            <div className={styles.type}>{headingText}</div>
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
                    userId={user?.user_id}
                    badgeSize={16}
                    className={styles.verified}
                  />
                </h2>
              </ArtistPopover>
            </div>
            <div>
              <Button
                variant='secondary'
                iconLeft={IconUser}
                onClick={goToArtistPage}
              >
                {messages.checkOut(user.name)}
              </Button>
            </div>
          </div>
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
      <Page
        title={title}
        description={description}
        canonicalUrl={canonicalUrl}
        structuredData={structuredData}
        variant='flush'
        scrollableSearch
      >
        <div className={styles.headerWrapper}>
          <CoverPhoto userId={user ? user.user_id : null} />
          <StatBanner isEmpty />
          <NavBanner empty />
        </div>
        <div className={styles.contentWrapper}>
          {renderTile()}
          {renderLineup()}
        </div>
      </Page>
    )
  }
)

export default DeletedPage
