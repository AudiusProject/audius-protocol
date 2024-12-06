import { useEffect, useContext, ReactNode } from 'react'

import {
  Status,
  Collection,
  ID,
  UID,
  ProfilePictureSizes,
  CoverPhotoSizes,
  LineupState,
  User,
  Track
} from '@audius/common/models'
import {
  profilePageFeedLineupActions as feedActions,
  profilePageTracksLineupActions as tracksActions,
  ProfilePageTabs,
  ProfileUser
} from '@audius/common/store'
import { route } from '@audius/common/utils'
import {
  IconAlbum,
  IconCollectible as IconCollectibles,
  IconNote,
  IconPlaylists,
  IconRepost as IconReposts,
  LoadingSpinner
} from '@audius/harmony'
import cn from 'classnames'

import CollectiblesPage from 'components/collectibles/components/CollectiblesPage'
import { CollectionCard } from 'components/collection'
import { HeaderContext } from 'components/header/mobile/HeaderContextProvider'
import CardLineup from 'components/lineup/CardLineup'
import Lineup from 'components/lineup/Lineup'
import MobilePageContainer from 'components/mobile-page-container/MobilePageContainer'
import NavContext, {
  LeftPreset,
  CenterPreset
} from 'components/nav/mobile/NavContext'
import TextElement, { Type } from 'components/nav/mobile/TextElement'
import TierExplainerDrawer from 'components/user-badges/TierExplainerDrawer'
import useTabs, { TabHeader } from 'hooks/useTabs/useTabs'
import { getUserPageSEOFields } from 'utils/seo'
import { withNullGuard } from 'utils/withNullGuard'

import { DeactivatedProfileTombstone } from '../DeactivatedProfileTombstone'

import EditProfile from './EditProfile'
import ProfileHeader from './ProfileHeader'
import styles from './ProfilePage.module.css'
import { ShareUserButton } from './ShareUserButton'

const { profilePage } = route

export type ProfilePageProps = {
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
  twitterVerified: boolean
  instagramVerified: boolean
  tikTokVerified: boolean
  website: string
  donation: string
  coverPhotoSizes: CoverPhotoSizes | null
  profilePictureSizes: ProfilePictureSizes | null
  hasProfilePicture: boolean
  followers: User[]
  followersLoading: boolean
  setFollowingUserId: (userId: ID) => void
  setFollowersUserId: (userId: ID) => void
  activeTab: ProfilePageTabs | null
  following: boolean
  isSubscribed: boolean
  mode: string
  // Whether or not the user has edited at least one thing on their profile
  hasMadeEdit: boolean
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
  stats: Array<{ number: number; title: string; key: string }>
  trackIsActive: boolean

  profile: ProfileUser | null
  albums: Collection[] | null
  playlists: Collection[] | null
  status: Status
  collectionStatus: Status
  goToRoute: (route: string) => void
  artistTracks: LineupState<Track>
  userFeed: LineupState<Track | Collection>
  playArtistTrack: (uid: UID) => void
  pauseArtistTrack: () => void
  playUserFeedTrack: (uid: UID) => void
  pauseUserFeedTrack: () => void
  refreshProfile: () => void

  // Updates
  updatedCoverPhoto: { file: File; url: string } | null
  updatedProfilePicture: { file: File; url: string } | null

  // Methods
  changeTab: (tab: ProfilePageTabs) => void
  getLineupProps: (lineup: any) => any
  loadMoreArtistTracks: (offset: number, limit: number) => void
  loadMoreUserFeed: (offset: number, limit: number) => void
  fetchFollowers: () => void
  onFollow: (id: ID) => void
  onConfirmUnfollow: (id: ID) => void
  updateName: (name: string) => void
  updateBio: (bio: string) => void
  updateLocation: (location: string) => void
  updateTwitterHandle: (handle: string) => void
  updateInstagramHandle: (handle: string) => void
  updateTikTokHandle: (handle: string) => void
  updateWebsite: (website: string) => void
  updateDonation: (donation: string) => void
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
  areArtistRecommendationsVisible: boolean
  onCloseArtistRecommendations: () => void
}

type EmptyTabProps = {
  message: ReactNode
}

export const EmptyTab = (props: EmptyTabProps) => {
  return <div className={styles.emptyTab}>{props.message}</div>
}

const artistTabs: TabHeader[] = [
  {
    icon: <IconNote />,
    text: 'Tracks',
    label: ProfilePageTabs.TRACKS,
    to: 'tracks'
  },
  {
    icon: <IconAlbum />,
    text: 'Albums',
    label: ProfilePageTabs.ALBUMS,
    to: 'albums'
  },
  {
    icon: <IconPlaylists />,
    text: 'Playlists',
    label: ProfilePageTabs.PLAYLISTS,
    to: 'playlists'
  },
  {
    icon: <IconReposts className={styles.iconReposts} />,
    text: 'Reposts',
    label: ProfilePageTabs.REPOSTS,
    to: 'reposts'
  }
]

const userTabs: TabHeader[] = [
  {
    icon: <IconReposts className={styles.iconReposts} />,
    text: 'Reposts',
    label: ProfilePageTabs.REPOSTS,
    to: 'reposts'
  },
  {
    icon: <IconPlaylists />,
    text: 'Playlists',
    label: ProfilePageTabs.PLAYLISTS,
    to: 'playlists'
  }
]

const collectiblesTab = {
  icon: <IconCollectibles />,
  text: 'Collectibles',
  label: ProfilePageTabs.COLLECTIBLES,
  to: 'collectibles'
}

const artistTabsWithCollectibles = [...artistTabs, collectiblesTab]
const userTabsWithCollectibles = [...userTabs, collectiblesTab]

const getMessages = ({
  name,
  isOwner
}: {
  name: string
  isOwner: boolean
}) => ({
  emptyTracks: isOwner
    ? "You haven't created any tracks yet"
    : `${name} hasn't created any tracks yet`,
  emptyAlbums: isOwner
    ? "You haven't created any albums yet"
    : `${name} hasn't created any albums yet`,
  emptyPlaylists: isOwner
    ? "You haven't created any playlists yet"
    : `${name} hasn't created any playlists yet`,
  emptyReposts: isOwner
    ? "You haven't reposted anything yet"
    : `${name} hasn't reposted anything yet`
})

const g = withNullGuard((props: ProfilePageProps) => {
  const { profile, albums, playlists } = props
  if (profile && albums && playlists) {
    return { ...props, profile, albums, playlists }
  }
})

const ProfilePage = g(
  ({
    accountUserId,
    userId,
    name,
    handle,
    profile,
    bio,
    location,
    status,
    collectionStatus,
    isArtist,
    isOwner,
    verified,
    coverPhotoSizes,
    profilePictureSizes,
    hasProfilePicture,
    followers,
    twitterHandle,
    instagramHandle,
    tikTokHandle,
    twitterVerified,
    instagramVerified,
    tikTokVerified,
    website,
    donation,
    albums,
    playlists,
    artistTracks,
    userFeed,
    getLineupProps,
    loadMoreArtistTracks,
    loadMoreUserFeed,
    playArtistTrack,
    pauseArtistTrack,
    playUserFeedTrack,
    pauseUserFeedTrack,
    setFollowingUserId,
    setFollowersUserId,
    goToRoute,
    following,
    isSubscribed,
    onFollow,
    onConfirmUnfollow,
    mode,
    hasMadeEdit,
    onEdit,
    onSave,
    onCancel,
    updatedCoverPhoto,
    updatedProfilePicture,
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
    setNotificationSubscription,
    didChangeTabsFrom,
    activeTab,
    areArtistRecommendationsVisible,
    onCloseArtistRecommendations
  }) => {
    const { setHeader } = useContext(HeaderContext)
    useEffect(() => {
      setHeader(null)
    }, [setHeader])

    const messages = getMessages({ name, isOwner })
    let content
    let profileTabs
    let profileElements
    const isLoading = status === Status.LOADING
    const isEditing = mode === 'editing'

    // Set Nav-Bar Menu
    const { setLeft, setCenter, setRight } = useContext(NavContext)!
    useEffect(() => {
      let leftNav
      let rightNav
      if (isEditing) {
        leftNav = (
          <TextElement text='Cancel' type={Type.SECONDARY} onClick={onCancel} />
        )
        rightNav = (
          <TextElement
            text='Save'
            type={Type.PRIMARY}
            isEnabled={hasMadeEdit}
            onClick={onSave}
          />
        )
      } else {
        leftNav = isOwner ? LeftPreset.SETTINGS : LeftPreset.BACK
        rightNav = <ShareUserButton userId={userId} />
      }
      if (userId) {
        setLeft(leftNav)
        setRight(rightNav)
        setCenter(CenterPreset.LOGO)
      }
    }, [
      setLeft,
      setCenter,
      setRight,
      userId,
      isOwner,
      isEditing,
      onCancel,
      onSave,
      hasMadeEdit
    ])

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

    if (isLoading) {
      content = null
    } else if (isEditing) {
      content = (
        <EditProfile
          name={name}
          bio={bio}
          location={location}
          twitterHandle={twitterHandle}
          instagramHandle={instagramHandle}
          tikTokHandle={tikTokHandle}
          twitterVerified={twitterVerified}
          instagramVerified={instagramVerified}
          tikTokVerified={tikTokVerified}
          website={website}
          donation={donation}
          onUpdateName={updateName}
          onUpdateBio={updateBio}
          onUpdateLocation={updateLocation}
          onUpdateTwitterHandle={updateTwitterHandle}
          onUpdateInstagramHandle={updateInstagramHandle}
          onUpdateTikTokHandle={updateTikTokHandle}
          onUpdateWebsite={updateWebsite}
          onUpdateDonation={updateDonation}
        />
      )
    } else {
      const playlistCards = (playlists || []).map((playlist) => (
        <CollectionCard
          key={playlist.playlist_id}
          id={playlist.playlist_id}
          size='xs'
        />
      ))
      if (isArtist) {
        const albumCards = (albums || []).map((album) => (
          <CollectionCard
            key={album.playlist_id}
            id={album.playlist_id}
            size='xs'
          />
        ))

        profileTabs = artistTabs
        profileElements = [
          <div className={styles.tracksLineupContainer} key='artistTracks'>
            {profile.track_count === 0 ? (
              <EmptyTab
                message={
                  <>
                    {messages.emptyTracks}
                    <i
                      className={cn('emoji', 'face-with-monocle', styles.emoji)}
                    />
                  </>
                }
              />
            ) : (
              <Lineup
                {...getLineupProps(artistTracks)}
                leadingElementId={profile.artist_pick_track_id}
                limit={profile.track_count}
                loadMore={loadMoreArtistTracks}
                playTrack={playArtistTrack}
                pauseTrack={pauseArtistTrack}
                actions={tracksActions}
              />
            )}
          </div>,
          <div className={styles.cardLineupContainer} key='artistAlbums'>
            {collectionStatus !== Status.SUCCESS &&
            collectionStatus !== Status.ERROR ? (
              <LoadingSpinner />
            ) : (albums || []).length === 0 ? (
              <EmptyTab
                message={
                  <>
                    {messages.emptyAlbums}
                    <i
                      className={cn('emoji', 'face-with-monocle', styles.emoji)}
                    />
                  </>
                }
              />
            ) : (
              <CardLineup
                cardsClassName={styles.cardLineup}
                cards={albumCards}
              />
            )}
          </div>,
          <div className={styles.cardLineupContainer} key='artistPlaylists'>
            {collectionStatus !== Status.SUCCESS &&
            collectionStatus !== Status.ERROR ? (
              <LoadingSpinner />
            ) : (playlists || []).length === 0 ? (
              <EmptyTab
                message={
                  <>
                    {messages.emptyPlaylists}
                    <i
                      className={cn('emoji', 'face-with-monocle', styles.emoji)}
                    />
                  </>
                }
              />
            ) : (
              <CardLineup
                cardsClassName={styles.cardLineup}
                cards={playlistCards}
              />
            )}
          </div>,
          <div className={styles.tracksLineupContainer} key='artistUsers'>
            {profile.repost_count === 0 ? (
              <EmptyTab
                message={
                  <>
                    {messages.emptyReposts}
                    <i
                      className={cn('emoji', 'face-with-monocle', styles.emoji)}
                    />
                  </>
                }
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
          </div>
        ]
      } else {
        profileTabs = userTabs
        profileElements = [
          <div className={styles.tracksLineupContainer} key='tracks'>
            {profile.repost_count === 0 ? (
              <EmptyTab
                message={
                  <>
                    {messages.emptyReposts}
                    <i
                      className={cn('emoji', 'face-with-monocle', styles.emoji)}
                    />
                  </>
                }
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
          <div className={styles.cardLineupContainer} key='playlists'>
            {(playlists || []).length === 0 ? (
              <EmptyTab
                message={
                  <>
                    {messages.emptyPlaylists}
                    <i
                      className={cn('emoji', 'face-with-monocle', styles.emoji)}
                    />
                  </>
                }
              />
            ) : (
              <CardLineup
                cardsClassName={styles.cardLineup}
                cards={playlistCards}
              />
            )}
          </div>
        ]
      }

      if (
        // `has_collectibles` is a shortcut that is only true iff the user has a modified collectibles state
        (profile?.has_collectibles && !didCollectiblesLoadAndWasEmpty) ||
        profileHasVisibleImageOrVideoCollectibles ||
        (profileHasCollectibles && isUserOnTheirProfile)
      ) {
        profileTabs = isArtist
          ? artistTabsWithCollectibles
          : userTabsWithCollectibles
        profileElements.push(
          <div key='collectibles' className={styles.tracksLineupContainer}>
            <CollectiblesPage
              userId={userId}
              name={name}
              isMobile={true}
              isUserOnTheirProfile={isUserOnTheirProfile}
              updateProfilePicture={updateProfilePicture}
              profile={profile}
              onSave={onSave}
            />
          </div>
        )
      }
    }

    const { tabs, body } = useTabs({
      didChangeTabsFrom,
      tabs: isLoading ? [] : profileTabs || [],
      elements: isLoading ? [] : profileElements || [],
      initialTab: activeTab || undefined,
      pathname: profilePage(handle)
    })

    if (profile && profile.is_deactivated) {
      content = (
        <div className={styles.contentContainer}>
          <DeactivatedProfileTombstone isMobile />
        </div>
      )
    } else if (!isLoading && !isEditing) {
      content = (
        <div className={styles.contentContainer}>
          <div className={styles.tabs}>{tabs}</div>
          {body}
        </div>
      )
    }

    const {
      title = '',
      description = '',
      canonicalUrl = '',
      structuredData
    } = getUserPageSEOFields({ handle, userName: name, bio })

    return (
      <>
        <MobilePageContainer
          title={title}
          description={description}
          canonicalUrl={canonicalUrl}
          structuredData={structuredData}
          containerClassName={styles.container}
        >
          <ProfileHeader
            isDeactivated={profile?.is_deactivated}
            profile={profile}
            name={name}
            handle={handle}
            isArtist={isArtist}
            bio={bio}
            verified={verified}
            userId={profile.user_id}
            loading={status === Status.LOADING}
            coverPhotoSizes={coverPhotoSizes}
            profilePictureSizes={profilePictureSizes}
            hasProfilePicture={hasProfilePicture}
            playlistCount={profile.playlist_count}
            trackCount={profile.track_count}
            followerCount={profile.follower_count}
            followingCount={profile.followee_count}
            setFollowingUserId={setFollowingUserId}
            setFollowersUserId={setFollowersUserId}
            twitterHandle={twitterHandle}
            instagramHandle={instagramHandle}
            tikTokHandle={tikTokHandle}
            website={website}
            donation={donation}
            followers={followers}
            following={following}
            isSubscribed={isSubscribed}
            onFollow={onFollow}
            onUnfollow={onConfirmUnfollow}
            goToRoute={goToRoute}
            mode={mode}
            switchToEditMode={onEdit}
            updatedProfilePicture={
              updatedProfilePicture ? updatedProfilePicture.url : null
            }
            updatedCoverPhoto={updatedCoverPhoto ? updatedCoverPhoto.url : null}
            onUpdateProfilePicture={updateProfilePicture}
            onUpdateCoverPhoto={updateCoverPhoto}
            setNotificationSubscription={setNotificationSubscription}
            areArtistRecommendationsVisible={areArtistRecommendationsVisible}
            onCloseArtistRecommendations={onCloseArtistRecommendations}
          />
          {content}
        </MobilePageContainer>

        <TierExplainerDrawer />
      </>
    )
  }
)

export default ProfilePage
