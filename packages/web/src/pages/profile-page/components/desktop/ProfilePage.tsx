import { useCallback, memo } from 'react'

import {
  ID,
  UID,
  Name,
  Collection,
  CoverPhotoSizes,
  ProfilePictureSizes,
  LineupState,
  Status,
  profilePageTracksLineupActions as tracksActions,
  ProfileUser,
  ProfilePageTabs,
  profilePageFeedLineupActions as feedActions,
  badgeTiers,
  useSelectTierInfo
} from '@audius/common'

import { ReactComponent as IconAlbum } from 'assets/img/iconAlbum.svg'
import { ReactComponent as IconCollectibles } from 'assets/img/iconCollectibles.svg'
import { ReactComponent as IconNote } from 'assets/img/iconNote.svg'
import { ReactComponent as IconPlaylists } from 'assets/img/iconPlaylists.svg'
import { ReactComponent as IconReposts } from 'assets/img/iconRepost.svg'
import { make, useRecord } from 'common/store/analytics/actions'
import Card from 'components/card/desktop/Card'
import CollectiblesPage from 'components/collectibles/components/CollectiblesPage'
import CoverPhoto from 'components/cover-photo/CoverPhoto'
import CardLineup from 'components/lineup/CardLineup'
import Lineup from 'components/lineup/Lineup'
import Mask from 'components/mask/Mask'
import NavBanner from 'components/nav-banner/NavBanner'
import Page from 'components/page/Page'
import ConnectedProfileCompletionHeroCard from 'components/profile-progress/ConnectedProfileCompletionHeroCard'
import StatBanner from 'components/stat-banner/StatBanner'
import UploadChip from 'components/upload/UploadChip'
import useTabs, { useTabRecalculator } from 'hooks/useTabs/useTabs'
import { MIN_COLLECTIBLES_TIER } from 'pages/profile-page/ProfilePageProvider'
import EmptyTab from 'pages/profile-page/components/EmptyTab'
import {
  albumPage,
  playlistPage,
  profilePage,
  fullProfilePage,
  UPLOAD_PAGE,
  UPLOAD_ALBUM_PAGE,
  UPLOAD_PLAYLIST_PAGE
} from 'utils/route'

import { DeactivatedProfileTombstone } from '../DeactivatedProfileTombstone'

import styles from './ProfilePage.module.css'
import ProfileWrapping from './ProfileWrapping'

export type ProfilePageProps = {
  // State
  editMode: boolean
  shouldMaskContent: boolean
  areArtistRecommendationsVisible: boolean

  mostUsedTags: string[]
  // Computed
  accountUserId: ID | null
  isArtist: boolean
  isOwner: boolean
  userId: ID | null
  handle: string
  verified: boolean
  created: string
  name: string
  bio: string
  location: string
  twitterHandle: string
  instagramHandle: string
  tikTokHandle: string
  twitterVerified?: boolean
  instagramVerified?: boolean
  website: string
  donation: string
  coverPhotoSizes: CoverPhotoSizes | null
  updatedCoverPhoto: { error: boolean; url: string }
  profilePictureSizes: ProfilePictureSizes | null
  updatedProfilePicture: { error: boolean; url: string }
  hasProfilePicture: boolean
  activeTab: ProfilePageTabs | null
  dropdownDisabled: boolean
  following: boolean
  isSubscribed: boolean
  mode: string
  stats: Array<{ number: number; title: string; key: string }>

  profile: ProfileUser | null
  albums: Collection[] | null
  playlists: Collection[] | null
  status: Status
  goToRoute: (route: string) => void
  artistTracks: LineupState<{ id: ID }>
  playArtistTrack: (uid: UID) => void
  pauseArtistTrack: () => void
  // Feed
  userFeed: LineupState<{ id: ID }>
  playUserFeedTrack: (uid: UID) => void
  pauseUserFeedTrack: () => void

  // Methods
  onFollow: () => void
  onUnfollow: () => void
  updateName: (name: string) => void
  updateBio: (bio: string) => void
  updateLocation: (location: string) => void
  updateTwitterHandle: (handle: string) => void
  updateInstagramHandle: (handle: string) => void
  updateTikTokHandle: (handle: string) => void
  updateWebsite: (website: string) => void
  updateDonation: (donation: string) => void
  changeTab: (tab: ProfilePageTabs) => void
  getLineupProps: (lineup: any) => any
  onEdit: () => void
  onSave: () => void
  onShare: () => void
  onCancel: () => void
  onSortByRecent: () => void
  onSortByPopular: () => void
  loadMoreArtistTracks: (offset: number, limit: number) => void
  loadMoreUserFeed: (offset: number, limit: number) => void
  formatCardSecondaryText: (
    saves: number,
    tracks: number,
    isPrivate?: boolean
  ) => string
  openCreatePlaylistModal: () => void
  updateProfile: (metadata: any) => void
  updateProfilePicture: (
    selectedFiles: any,
    source: 'original' | 'unsplash' | 'url'
  ) => Promise<void>
  updateCoverPhoto: (
    selectedFiles: any,
    source: 'original' | 'unsplash' | 'url'
  ) => Promise<void>
  setNotificationSubscription: (userId: ID, isSubscribed: boolean) => void
  didChangeTabsFrom: (prevLabel: string, currentLabel: string) => void
  onCloseArtistRecommendations: () => void
}

const ProfilePage = ({
  isOwner,
  profile,
  albums,
  playlists,
  status,
  goToRoute,
  // Tracks
  artistTracks,
  playArtistTrack,
  pauseArtistTrack,
  getLineupProps,
  // Feed
  userFeed,
  playUserFeedTrack,
  pauseUserFeedTrack,
  formatCardSecondaryText,
  loadMoreUserFeed,
  loadMoreArtistTracks,
  openCreatePlaylistModal,
  updateProfile,

  mostUsedTags,
  onFollow,
  onUnfollow,
  updateName,
  updateBio,
  updateLocation,
  updateTwitterHandle,
  updateInstagramHandle,
  updateTikTokHandle,
  updateWebsite,
  updateDonation,
  updateProfilePicture,
  updateCoverPhoto,
  changeTab,
  mode,
  stats,
  onEdit,
  onSave,
  onShare,
  onCancel,
  onSortByRecent,
  onSortByPopular,
  isArtist,
  status: profileLoadingStatus,
  activeTab,
  shouldMaskContent,
  editMode,
  areArtistRecommendationsVisible,
  onCloseArtistRecommendations,

  accountUserId,
  userId,
  handle,
  verified,
  created,
  name,
  bio,
  location,
  twitterHandle,
  instagramHandle,
  tikTokHandle,
  twitterVerified,
  instagramVerified,
  website,
  donation,
  coverPhotoSizes,
  updatedCoverPhoto,
  profilePictureSizes,
  updatedProfilePicture,
  hasProfilePicture,
  dropdownDisabled,
  following,
  isSubscribed,
  setNotificationSubscription,
  didChangeTabsFrom
}: ProfilePageProps) => {
  const renderProfileCompletionCard = () => {
    return isOwner ? <ConnectedProfileCompletionHeroCard /> : null
  }
  const record = useRecord()
  const onClickUploadAlbum = useCallback(() => {
    goToRoute(UPLOAD_ALBUM_PAGE)
    record(make(Name.TRACK_UPLOAD_OPEN, { source: 'profile' }))
  }, [goToRoute, record])
  const onClickUploadPlaylist = useCallback(() => {
    goToRoute(UPLOAD_PLAYLIST_PAGE)
    record(make(Name.TRACK_UPLOAD_OPEN, { source: 'profile' }))
  }, [goToRoute, record])
  const onClickUploadTrack = useCallback(() => {
    goToRoute(UPLOAD_PAGE)
    record(make(Name.TRACK_UPLOAD_OPEN, { source: 'profile' }))
  }, [goToRoute, record])

  const { tierNumber } = useSelectTierInfo(userId ?? 0)
  const profileHasCollectiblesTierRequirement =
    tierNumber >= badgeTiers.findIndex((t) => t.tier === MIN_COLLECTIBLES_TIER)

  const profileHasCollectibles =
    profile?.collectibleList?.length || profile?.solanaCollectibleList?.length
  const profileNeverSetCollectiblesOrder = !profile?.collectibles
  const profileHasNonEmptyCollectiblesOrder =
    profile?.collectibles?.order?.length ?? false
  const profileHasVisibleImageOrVideoCollectibles =
    profileHasCollectibles &&
    (profileNeverSetCollectiblesOrder || profileHasNonEmptyCollectiblesOrder)
  const didCollectiblesLoadAndWasEmpty =
    profileHasCollectibles && !profileHasNonEmptyCollectiblesOrder

  const isUserOnTheirProfile = accountUserId === userId

  const tabRecalculator = useTabRecalculator()
  const recalculate = useCallback(() => {
    tabRecalculator.recalculate()
  }, [tabRecalculator])

  const getArtistProfileContent = () => {
    if (!profile || !albums || !playlists) return { headers: [], elements: [] }
    const albumCards = albums.map((album, index) => (
      <Card
        key={index}
        size='medium'
        handle={profile.handle}
        playlistName={album.playlist_name}
        playlistId={album.playlist_id}
        id={album.playlist_id}
        userId={album.playlist_owner_id}
        isPublic={!album.is_private}
        imageSize={album._cover_art_sizes}
        isPlaylist={!album.is_album}
        primaryText={album.playlist_name}
        // link={fullAlbumPage(profile.handle, album.playlist_name, album.playlist_id)}
        secondaryText={formatCardSecondaryText(
          album.save_count,
          album.playlist_contents.track_ids.length
        )}
        cardCoverImageSizes={album._cover_art_sizes}
        isReposted={album.has_current_user_reposted}
        isSaved={album.has_current_user_saved}
        onClick={() =>
          goToRoute(
            albumPage(profile.handle, album.playlist_name, album.playlist_id)
          )
        }
      />
    ))
    if (isOwner) {
      albumCards.unshift(
        <UploadChip
          key='upload-chip'
          type='album'
          variant='card'
          onClick={onClickUploadAlbum}
          isFirst={albumCards.length === 0}
        />
      )
    }

    const playlistCards = playlists.map((playlist, index) => (
      <Card
        key={index}
        size='medium'
        handle={profile.handle}
        playlistName={playlist.playlist_name}
        playlistId={playlist.playlist_id}
        id={playlist.playlist_id}
        imageSize={playlist._cover_art_sizes}
        userId={playlist.playlist_owner_id}
        isPublic={!playlist.is_private}
        // isAlbum={playlist.is_album}
        primaryText={playlist.playlist_name}
        // link={fullPlaylistPage(profile.handle, playlist.playlist_name, playlist.playlist_id)}
        secondaryText={formatCardSecondaryText(
          playlist.save_count,
          playlist.playlist_contents.track_ids.length,
          playlist.is_private
        )}
        cardCoverImageSizes={playlist._cover_art_sizes}
        isReposted={playlist.has_current_user_reposted}
        isSaved={playlist.has_current_user_saved}
        onClick={() =>
          goToRoute(
            playlistPage(
              profile.handle,
              playlist.playlist_name,
              playlist.playlist_id
            )
          )
        }
      />
    ))
    if (isOwner) {
      playlistCards.unshift(
        <UploadChip
          key='upload-chip'
          type='playlist'
          variant='card'
          onClick={onClickUploadPlaylist}
          isArtist
          isFirst={playlistCards.length === 0}
        />
      )
    }

    const trackUploadChip = isOwner ? (
      <UploadChip
        key='upload-chip'
        type='track'
        variant='tile'
        onClick={onClickUploadTrack}
      />
    ) : null

    const headers = [
      {
        icon: <IconNote />,
        text: ProfilePageTabs.TRACKS,
        label: ProfilePageTabs.TRACKS
      },
      {
        icon: <IconAlbum />,
        text: ProfilePageTabs.ALBUMS,
        label: ProfilePageTabs.ALBUMS
      },
      {
        icon: <IconPlaylists />,
        text: ProfilePageTabs.PLAYLISTS,
        label: ProfilePageTabs.PLAYLISTS
      },
      {
        icon: <IconReposts />,
        text: ProfilePageTabs.REPOSTS,
        label: ProfilePageTabs.REPOSTS
      }
    ]
    const elements = [
      <div key={ProfilePageTabs.TRACKS} className={styles.tiles}>
        {renderProfileCompletionCard()}
        {status !== Status.LOADING ? (
          artistTracks.status !== Status.LOADING &&
          artistTracks.entries.length === 0 ? (
            <EmptyTab
              isOwner={isOwner}
              name={profile.name}
              text={'uploaded any tracks'}
            />
          ) : (
            <Lineup
              {...getLineupProps(artistTracks)}
              extraPrecedingElement={trackUploadChip}
              animateLeadingElement
              leadingElementId={profile._artist_pick}
              loadMore={loadMoreArtistTracks}
              playTrack={playArtistTrack}
              pauseTrack={pauseArtistTrack}
              actions={tracksActions}
            />
          )
        ) : null}
      </div>,
      <div key={ProfilePageTabs.ALBUMS} className={styles.cards}>
        {albums.length === 0 && !isOwner ? (
          <EmptyTab
            isOwner={isOwner}
            name={profile.name}
            text={'created any albums'}
          />
        ) : (
          <CardLineup cardsClassName={styles.cardLineup} cards={albumCards} />
        )}
      </div>,
      <div key={ProfilePageTabs.PLAYLISTS} className={styles.cards}>
        {playlists.length === 0 && !isOwner ? (
          <EmptyTab
            isOwner={isOwner}
            name={profile.name}
            text={'created any playlists'}
          />
        ) : (
          <CardLineup
            cardsClassName={styles.cardLineup}
            cards={playlistCards}
          />
        )}
      </div>,
      <div key={ProfilePageTabs.REPOSTS} className={styles.tiles}>
        {status !== Status.LOADING ? (
          (userFeed.status !== Status.LOADING &&
            userFeed.entries.length === 0) ||
          profile.repost_count === 0 ? (
            <EmptyTab
              isOwner={isOwner}
              name={profile.name}
              text={'reposted anything'}
            />
          ) : (
            <Lineup
              {...getLineupProps(userFeed)}
              loadMore={loadMoreUserFeed}
              playTrack={playUserFeedTrack}
              pauseTrack={pauseUserFeedTrack}
              actions={feedActions}
            />
          )
        ) : null}
      </div>
    ]

    if (
      // `has_collectibles` is a shortcut that is only true iff the user has a modified collectibles state
      (profile?.has_collectibles &&
        profileHasCollectiblesTierRequirement &&
        !didCollectiblesLoadAndWasEmpty) ||
      (profileHasCollectiblesTierRequirement &&
        (profileHasVisibleImageOrVideoCollectibles ||
          (profileHasCollectibles && isUserOnTheirProfile)))
    ) {
      headers.push({
        icon: <IconCollectibles />,
        text: ProfilePageTabs.COLLECTIBLES,
        label: ProfilePageTabs.COLLECTIBLES
      })

      elements.push(
        <div key={ProfilePageTabs.COLLECTIBLES} className={styles.tiles}>
          <CollectiblesPage
            userId={userId}
            name={name}
            isMobile={false}
            isUserOnTheirProfile={isUserOnTheirProfile}
            profile={profile}
            updateProfile={updateProfile}
            updateProfilePicture={updateProfilePicture}
            onLoad={recalculate}
            onSave={onSave}
          />
        </div>
      )
    }

    return { headers, elements }
  }

  const toggleNotificationSubscription = () => {
    if (!userId) return
    setNotificationSubscription(userId, !isSubscribed)
  }

  const getUserProfileContent = () => {
    if (!profile || !playlists) return { headers: [], elements: [] }
    const playlistCards = playlists.map((playlist, index) => (
      <Card
        key={index}
        size='medium'
        id={playlist.playlist_id}
        userId={playlist.playlist_owner_id}
        imageSize={playlist._cover_art_sizes}
        handle={profile.handle}
        playlistId={playlist.playlist_id}
        isPublic={!playlist.is_private}
        playlistName={playlist.playlist_name}
        // isAlbum={playlist.is_album}
        primaryText={playlist.playlist_name}
        secondaryText={formatCardSecondaryText(
          playlist.save_count,
          playlist.playlist_contents.track_ids.length,
          playlist.is_private
        )}
        // link={fullPlaylistPage(profile.handle, playlist.playlist_name, playlist.playlist_id)}
        isReposted={playlist.has_current_user_reposted}
        isSaved={playlist.has_current_user_saved}
        cardCoverImageSizes={playlist._cover_art_sizes}
        onClick={() =>
          goToRoute(
            playlistPage(
              profile.handle,
              playlist.playlist_name,
              playlist.playlist_id
            )
          )
        }
      />
    ))
    playlistCards.unshift(
      <UploadChip
        type='playlist'
        variant='card'
        onClick={openCreatePlaylistModal}
        isFirst={playlistCards.length === 0}
      />
    )

    const headers = [
      {
        icon: <IconReposts />,
        text: ProfilePageTabs.REPOSTS,
        label: ProfilePageTabs.REPOSTS
      },
      {
        icon: <IconPlaylists />,
        text: ProfilePageTabs.PLAYLISTS,
        label: ProfilePageTabs.PLAYLISTS
      }
    ]
    const elements = [
      <div key={ProfilePageTabs.REPOSTS} className={styles.tiles}>
        {renderProfileCompletionCard()}
        {(userFeed.status !== Status.LOADING &&
          userFeed.entries.length === 0) ||
        profile.repost_count === 0 ? (
          <EmptyTab
            isOwner={isOwner}
            name={profile.name}
            text={'reposted anything'}
          />
        ) : (
          <Lineup
            {...getLineupProps(userFeed)}
            count={profile.repost_count}
            loadMore={loadMoreUserFeed}
            playTrack={playUserFeedTrack}
            pauseTrack={pauseUserFeedTrack}
            actions={feedActions}
          />
        )}
      </div>,
      <div key={ProfilePageTabs.PLAYLISTS} className={styles.cards}>
        {playlists.length === 0 && !isOwner ? (
          <EmptyTab
            isOwner={isOwner}
            name={profile.name}
            text={'created any playlists'}
          />
        ) : (
          <CardLineup
            cardsClassName={styles.cardLineup}
            cards={playlistCards}
          />
        )}
      </div>
    ]

    if (
      (profile?.has_collectibles &&
        profileHasCollectiblesTierRequirement &&
        !didCollectiblesLoadAndWasEmpty) ||
      (profileHasCollectiblesTierRequirement &&
        (profileHasVisibleImageOrVideoCollectibles ||
          (profileHasCollectibles && isUserOnTheirProfile)))
    ) {
      headers.push({
        icon: <IconCollectibles />,
        text: ProfilePageTabs.COLLECTIBLES,
        label: ProfilePageTabs.COLLECTIBLES
      })

      elements.push(
        <div key={ProfilePageTabs.COLLECTIBLES} className={styles.tiles}>
          <CollectiblesPage
            userId={userId}
            name={name}
            isMobile={false}
            isUserOnTheirProfile={isUserOnTheirProfile}
            profile={profile}
            updateProfile={updateProfile}
            updateProfilePicture={updateProfilePicture}
            onLoad={recalculate}
            onSave={onSave}
          />
        </div>
      )
    }

    return { headers, elements }
  }

  const { headers, elements } = profile
    ? isArtist
      ? getArtistProfileContent()
      : getUserProfileContent()
    : { headers: [], elements: [] }

  const { tabs, body } = useTabs({
    didChangeTabsFrom,
    isMobile: false,
    tabs: headers,
    tabRecalculator,
    bodyClassName: styles.tabBody,
    initialTab: activeTab || undefined,
    elements
  })

  return (
    <Page
      title={name && handle ? `${name} (${handle})` : ''}
      description={bio}
      canonicalUrl={fullProfilePage(handle)}
      variant='flush'
      contentClassName={styles.profilePageWrapper}
      scrollableSearch
    >
      <div className={styles.headerWrapper}>
        <ProfileWrapping
          userId={userId}
          isDeactivated={!!profile?.is_deactivated}
          loading={status === Status.LOADING}
          verified={verified}
          profilePictureSizes={profilePictureSizes}
          updatedProfilePicture={updatedProfilePicture}
          hasProfilePicture={hasProfilePicture}
          doesFollowCurrentUser={profile?.does_follow_current_user || false}
          isOwner={isOwner}
          isArtist={isArtist}
          editMode={editMode}
          name={name}
          handle={handle}
          bio={bio}
          location={location}
          twitterHandle={twitterHandle}
          instagramHandle={instagramHandle}
          tikTokHandle={tikTokHandle}
          twitterVerified={!!twitterVerified}
          instagramVerified={!!instagramVerified}
          website={website}
          donation={donation}
          created={created}
          tags={mostUsedTags || []}
          onUpdateName={updateName}
          onUpdateProfilePicture={updateProfilePicture}
          onUpdateBio={updateBio}
          onUpdateLocation={updateLocation}
          onUpdateTwitterHandle={updateTwitterHandle}
          onUpdateInstagramHandle={updateInstagramHandle}
          onUpdateTikTokHandle={updateTikTokHandle}
          onUpdateWebsite={updateWebsite}
          onUpdateDonation={updateDonation}
          goToRoute={goToRoute}
        />
        <CoverPhoto
          userId={userId}
          coverPhotoSizes={
            profile && profile.is_deactivated ? null : coverPhotoSizes
          }
          updatedCoverPhoto={updatedCoverPhoto ? updatedCoverPhoto.url : ''}
          error={updatedCoverPhoto ? updatedCoverPhoto.error : false}
          loading={profileLoadingStatus === Status.LOADING}
          onDrop={updateCoverPhoto}
          edit={editMode}
          darken={editMode}
        />
        <Mask show={editMode} zIndex={2}>
          <StatBanner
            empty={!profile || profile.is_deactivated}
            mode={mode}
            stats={stats}
            userId={accountUserId}
            handle={handle}
            profileId={profile?.user_id}
            areArtistRecommendationsVisible={areArtistRecommendationsVisible}
            onCloseArtistRecommendations={onCloseArtistRecommendations}
            onClickArtistName={(handle: string) => {
              goToRoute(profilePage(handle))
            }}
            onEdit={onEdit}
            onSave={onSave}
            onShare={onShare}
            onCancel={onCancel}
            following={following}
            isSubscribed={isSubscribed}
            onToggleSubscribe={toggleNotificationSubscription}
            onFollow={onFollow}
            onUnfollow={onUnfollow}
          />
          <div className={styles.inset}>
            <NavBanner
              empty={!profile || profile.is_deactivated}
              tabs={tabs}
              dropdownDisabled={dropdownDisabled}
              onChange={changeTab}
              activeTab={activeTab}
              isArtist={isArtist}
              onSortByRecent={onSortByRecent}
              onSortByPopular={onSortByPopular}
              shouldMaskContent={shouldMaskContent}
            />
            <div className={styles.content}>
              {profile && profile.is_deactivated ? (
                <DeactivatedProfileTombstone goToRoute={goToRoute} />
              ) : (
                body
              )}
            </div>
          </div>
        </Mask>
      </div>
    </Page>
  )
}

export default memo(ProfilePage)
