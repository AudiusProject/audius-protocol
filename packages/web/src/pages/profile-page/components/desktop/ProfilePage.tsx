import { useCallback, memo, ReactNode, useEffect, useState } from 'react'

import {
  useCurrentUserId,
  useGetMutedUsers,
  useUserPlaylists,
  useUserAlbums,
  useProfileTracks,
  useProfileReposts
} from '@audius/common/api'
import { useMuteUser } from '@audius/common/context'
import { commentsMessages } from '@audius/common/messages'
import {
  CreatePlaylistSource,
  Status,
  ID,
  ProfilePictureSizes,
  User
} from '@audius/common/models'
import {
  profilePageFeedLineupActions as feedActions,
  profilePageTracksLineupActions as tracksActions,
  ProfilePageTabs,
  TracksSortMode
} from '@audius/common/store'
import { route } from '@audius/common/utils'
import {
  Box,
  Flex,
  IconAlbum,
  IconCollectible as IconCollectibles,
  IconNote,
  IconPlaylists,
  IconRepost as IconReposts,
  Text,
  Hint,
  IconQuestionCircle,
  LoadingSpinner
} from '@audius/harmony'

import CollectiblesPage from 'components/collectibles/components/CollectiblesPage'
import { CollectionCard } from 'components/collection'
import { ConfirmationModal } from 'components/confirmation-modal'
import CoverPhoto from 'components/cover-photo/CoverPhoto'
import CardLineup from 'components/lineup/CardLineup'
import Lineup from 'components/lineup/Lineup'
import { LineupVariant } from 'components/lineup/types'
import Mask from 'components/mask/Mask'
import NavBanner from 'components/nav-banner/NavBanner'
import Page from 'components/page/Page'
import { ProfileCompletionHeroCard } from 'components/profile-progress/components/ProfileCompletionHeroCard'
import { ProfileMode, StatBanner } from 'components/stat-banner/StatBanner'
import { StatProps } from 'components/stats/Stats'
import UploadChip from 'components/upload/UploadChip'
import useTabs, { TabHeader, useTabRecalculator } from 'hooks/useTabs/useTabs'
import { BlockUserConfirmationModal } from 'pages/chat-page/components/BlockUserConfirmationModal'
import { UnblockUserConfirmationModal } from 'pages/chat-page/components/UnblockUserConfirmationModal'
import EmptyTab from 'pages/profile-page/components/EmptyTab'
import { getUserPageSEOFields } from 'utils/seo'

import { DeactivatedProfileTombstone } from '../DeactivatedProfileTombstone'

import styles from './ProfilePage.module.css'
import ProfileWrapping from './ProfileWrapping'

const { profilePage } = route

export type ProfilePageProps = {
  // State
  editMode: boolean
  shouldMaskContent: boolean
  areArtistRecommendationsVisible: boolean

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
  updatedCoverPhoto: { error: boolean; url: string }
  profilePictureSizes: ProfilePictureSizes | null
  updatedProfilePicture: { error: boolean; url: string }
  hasProfilePicture: boolean
  activeTab: ProfilePageTabs | null
  dropdownDisabled: boolean
  following: boolean
  isSubscribed: boolean
  mode: ProfileMode
  stats: StatProps[]
  isBlocked: boolean
  canCreateChat: boolean
  showBlockUserConfirmationModal: boolean
  showUnblockUserConfirmationModal: boolean
  showMuteUserConfirmationModal: boolean

  profile: User | null
  status: Status

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
  updateProfile: (metadata: any) => void
  updateProfilePicture: (
    selectedFiles: any,
    source: 'original' | 'unsplash' | 'url'
  ) => Promise<void>
  updateCoverPhoto: (
    selectedFiles: any,
    source: 'original' | 'unsplash' | 'url'
  ) => Promise<void>
  setNotificationSubscription: (
    userId: ID,
    isSubscribed: boolean,
    update: boolean
  ) => void
  didChangeTabsFrom: (prevLabel: string, currentLabel: string) => void
  onCloseArtistRecommendations: () => void
  onMessage: () => void
  onBlock: () => void
  onUnblock: () => void
  onMute: () => void
  onCloseBlockUserConfirmationModal: () => void
  onCloseUnblockUserConfirmationModal: () => void
  onCloseMuteUserConfirmationModal: () => void
  trackSortMode: TracksSortMode
}

const PlaylistTab = ({
  isOwner,
  profile,
  userId
}: {
  isOwner: boolean
  profile: User
  userId: ID | null
}) => {
  const { data: playlists, isPending } = useUserPlaylists({
    userId: userId ?? null
  })

  const playlistCards =
    playlists?.map((playlist) => (
      <CollectionCard
        key={playlist.playlist_id}
        id={playlist.playlist_id}
        size='m'
      />
    )) || []

  if (isOwner) {
    playlistCards.unshift(
      <UploadChip
        key='upload-chip'
        type='playlist'
        variant='card'
        isFirst={playlistCards.length === 0}
        source={CreatePlaylistSource.PROFILE_PAGE}
      />
    )
  }

  if (isPending) {
    return (
      <Flex justifyContent='center' mt='2xl'>
        <Box w={24}>
          <LoadingSpinner />
        </Box>
      </Flex>
    )
  }

  if (!playlists?.length && !isOwner) {
    return (
      <EmptyTab
        isOwner={isOwner}
        name={profile.name}
        text={'created any playlists'}
      />
    )
  }

  return <CardLineup cardsClassName={styles.cardLineup} cards={playlistCards} />
}

const AlbumTab = ({
  isOwner,
  profile,
  userId
}: {
  isOwner: boolean
  profile: User
  userId: ID | null
}) => {
  const { data: albums, isPending } = useUserAlbums({
    userId: userId ?? null
  })

  const albumCards =
    albums?.map((album) => (
      <CollectionCard key={album.playlist_id} id={album.playlist_id} size='m' />
    )) || []

  if (isOwner) {
    albumCards.unshift(
      <UploadChip
        key='upload-chip'
        type='album'
        variant='card'
        isFirst={albumCards.length === 0}
        source={CreatePlaylistSource.PROFILE_PAGE}
      />
    )
  }

  if (isPending) {
    return (
      <Flex justifyContent='center' mt='2xl'>
        <Box w={24}>
          <LoadingSpinner />
        </Box>
      </Flex>
    )
  }

  if (!albums?.length && !isOwner) {
    return (
      <EmptyTab
        isOwner={isOwner}
        name={profile.name}
        text={'created any albums'}
      />
    )
  }

  return <CardLineup cardsClassName={styles.cardLineup} cards={albumCards} />
}

const TracksTab = ({
  isOwner,
  profile,
  handle,
  getLineupProps,
  trackSortMode
}: {
  isOwner: boolean
  profile: User
  handle: string
  getLineupProps: (lineup: any) => any
  trackSortMode: TracksSortMode
}) => {
  const {
    fetchNextPage,
    play,
    pause,
    lineup,
    pageSize,
    isFetchingNextPage,
    hasNextPage
  } = useProfileTracks({
    handle,
    sort: trackSortMode
  })

  const trackUploadChip = isOwner ? (
    <UploadChip
      key='upload-chip'
      type='track'
      variant='tile'
      source='profile'
    />
  ) : null

  const emptyTab = (
    <EmptyTab
      isOwner={isOwner}
      name={profile.name}
      text={'uploaded any tracks'}
    />
  )

  return (
    <div className={styles.tiles}>
      {isOwner ? <ProfileCompletionHeroCard /> : null}
      {profile.track_count === 0 ? (
        emptyTab
      ) : (
        <Lineup
          {...getLineupProps(lineup)}
          pageSize={pageSize}
          extraPrecedingElement={trackUploadChip}
          emptyElement={emptyTab}
          animateLeadingElement
          leadingElementId={profile.artist_pick_track_id}
          loadMore={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage()
            }
          }}
          playTrack={play}
          pauseTrack={pause}
          actions={tracksActions}
          variant={LineupVariant.GRID}
        />
      )}
    </div>
  )
}

const RepostsTab = ({
  isOwner,
  profile,
  handle,
  getLineupProps
}: {
  isOwner: boolean
  profile: User
  handle: string
  getLineupProps: (lineup: any) => any
}) => {
  const {
    fetchNextPage,
    play,
    pause,
    lineup,
    isFetchingNextPage,
    hasNextPage,
    pageSize
  } = useProfileReposts({
    handle
  })

  const emptyTab = (
    <EmptyTab
      isOwner={isOwner}
      name={profile.name}
      text={'reposted anything'}
    />
  )

  return (
    <div className={styles.tiles}>
      {profile.repost_count === 0 ? (
        emptyTab
      ) : (
        <Lineup
          {...getLineupProps(lineup)}
          emptyElement={emptyTab}
          pageSize={pageSize}
          loadMore={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage()
            }
          }}
          playTrack={play}
          pauseTrack={pause}
          actions={feedActions}
        />
      )}
    </div>
  )
}

const ProfilePage = ({
  isOwner,
  profile,
  status,
  getLineupProps,
  updateProfile,
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
  activeTab,
  shouldMaskContent,
  editMode,
  areArtistRecommendationsVisible,
  onCloseArtistRecommendations,
  canCreateChat,
  onMessage,
  onBlock,
  onUnblock,
  onMute,
  isBlocked,
  showBlockUserConfirmationModal,
  onCloseBlockUserConfirmationModal,
  showUnblockUserConfirmationModal,
  onCloseUnblockUserConfirmationModal,
  showMuteUserConfirmationModal,
  onCloseMuteUserConfirmationModal,
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
  tikTokVerified,
  website,
  donation,
  updatedCoverPhoto,
  profilePictureSizes,
  updatedProfilePicture,
  hasProfilePicture,
  dropdownDisabled,
  following,
  isSubscribed,
  setNotificationSubscription,
  didChangeTabsFrom,
  trackSortMode
}: ProfilePageProps) => {
  const renderProfileCompletionCard = () => {
    return isOwner ? <ProfileCompletionHeroCard /> : null
  }

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
    if (!profile) return { headers: [], elements: [] }

    const headers: TabHeader[] = [
      {
        icon: <IconNote />,
        text: ProfilePageTabs.TRACKS,
        label: ProfilePageTabs.TRACKS,
        to: 'tracks'
      },
      {
        icon: <IconAlbum />,
        text: ProfilePageTabs.ALBUMS,
        label: ProfilePageTabs.ALBUMS,
        to: 'albums'
      },
      {
        icon: <IconPlaylists />,
        text: ProfilePageTabs.PLAYLISTS,
        label: ProfilePageTabs.PLAYLISTS,
        to: 'playlists'
      },
      {
        icon: <IconReposts />,
        text: ProfilePageTabs.REPOSTS,
        label: ProfilePageTabs.REPOSTS,
        to: 'reposts'
      }
    ]
    const elements = [
      <TracksTab
        key={ProfilePageTabs.TRACKS}
        isOwner={isOwner}
        profile={profile}
        handle={handle}
        getLineupProps={getLineupProps}
        trackSortMode={trackSortMode}
      />,
      <div key={ProfilePageTabs.ALBUMS} className={styles.cards}>
        <AlbumTab isOwner={isOwner} profile={profile} userId={userId} />
      </div>,
      <div key={ProfilePageTabs.PLAYLISTS} className={styles.cards}>
        <PlaylistTab isOwner={isOwner} profile={profile} userId={userId} />
      </div>,
      <div key={ProfilePageTabs.REPOSTS} className={styles.tiles}>
        <RepostsTab
          isOwner={isOwner}
          profile={profile}
          handle={handle}
          getLineupProps={getLineupProps}
        />
      </div>
    ]

    if (
      // `has_collectibles` is a shortcut that is only true iff the user has a modified collectibles state
      (profile?.has_collectibles && !didCollectiblesLoadAndWasEmpty) ||
      profileHasVisibleImageOrVideoCollectibles ||
      (profileHasCollectibles && isUserOnTheirProfile)
    ) {
      headers.push({
        icon: <IconCollectibles />,
        text: ProfilePageTabs.COLLECTIBLES,
        label: ProfilePageTabs.COLLECTIBLES,
        to: 'collectibles'
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
    setNotificationSubscription(userId, !isSubscribed, true)
  }

  const getUserProfileContent = () => {
    if (!profile) return { headers: [], elements: [] }

    const headers: TabHeader[] = [
      {
        icon: <IconReposts />,
        text: ProfilePageTabs.REPOSTS,
        label: ProfilePageTabs.REPOSTS,
        to: 'reposts'
      },
      {
        icon: <IconPlaylists />,
        text: ProfilePageTabs.PLAYLISTS,
        label: ProfilePageTabs.PLAYLISTS,
        to: 'playlists'
      }
    ]
    const elements = [
      <div key={ProfilePageTabs.REPOSTS} className={styles.tiles}>
        {renderProfileCompletionCard()}
        <RepostsTab
          isOwner={isOwner}
          profile={profile}
          handle={handle}
          getLineupProps={getLineupProps}
        />
      </div>,
      <div key={ProfilePageTabs.PLAYLISTS} className={styles.cards}>
        <PlaylistTab isOwner={isOwner} profile={profile} userId={userId} />
      </div>
    ]

    if (
      (profile?.has_collectibles && !didCollectiblesLoadAndWasEmpty) ||
      profileHasVisibleImageOrVideoCollectibles ||
      (profileHasCollectibles && isUserOnTheirProfile)
    ) {
      headers.push({
        icon: <IconCollectibles />,
        text: ProfilePageTabs.COLLECTIBLES,
        label: ProfilePageTabs.COLLECTIBLES,
        to: 'collectibles'
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
    elements,
    pathname: profilePage(handle)
  })

  const {
    title = '',
    description = '',
    canonicalUrl = '',
    structuredData
  } = getUserPageSEOFields({ handle, userName: name, bio })

  const muteUserConfirmationBody = (
    <Flex gap='l' direction='column'>
      <Text color='default' textAlign='left'>
        {commentsMessages.popups.muteUser.body(name)}
      </Text>
      <Hint icon={IconQuestionCircle} css={{ textAlign: 'left' }}>
        {commentsMessages.popups.muteUser.hint}
      </Hint>
    </Flex>
  ) as ReactNode

  const unMuteUserConfirmationBody = (
    <Flex gap='l' direction='column'>
      <Text color='default' textAlign='left'>
        {commentsMessages.popups.unmuteUser.body(name)}
      </Text>
      <Hint icon={IconQuestionCircle} css={{ textAlign: 'left' }}>
        {commentsMessages.popups.unmuteUser.hint}
      </Hint>
    </Flex>
  ) as ReactNode

  const [muteUser] = useMuteUser()
  const { data: currentUserId } = useCurrentUserId()

  const { data: mutedUsers } = useGetMutedUsers({
    userId: currentUserId!
  })

  const isMutedFromRequest =
    mutedUsers?.some((user) => user.user_id === userId) ?? false

  const [isMutedState, setIsMuted] = useState(isMutedFromRequest)

  useEffect(() => {
    setIsMuted(isMutedFromRequest)
  }, [isMutedFromRequest])

  return (
    <Page
      title={title}
      description={description}
      canonicalUrl={canonicalUrl}
      structuredData={structuredData}
      variant='flush'
      contentClassName={styles.profilePageWrapper}
      scrollableSearch
      fromOpacity={1}
    >
      <Box w='100%'>
        <ProfileWrapping
          userId={userId}
          isDeactivated={!!profile?.is_deactivated}
          allowAiAttribution={!!profile?.allow_ai_attribution}
          loading={status === Status.LOADING}
          verified={verified}
          profilePictureSizes={profilePictureSizes}
          updatedProfilePicture={updatedProfilePicture}
          hasProfilePicture={hasProfilePicture}
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
          tikTokVerified={!!tikTokVerified}
          website={website}
          donation={donation}
          created={created}
          onUpdateName={updateName}
          onUpdateProfilePicture={updateProfilePicture}
          onUpdateBio={updateBio}
          onUpdateLocation={updateLocation}
          onUpdateTwitterHandle={updateTwitterHandle}
          onUpdateInstagramHandle={updateInstagramHandle}
          onUpdateTikTokHandle={updateTikTokHandle}
          onUpdateWebsite={updateWebsite}
          onUpdateDonation={updateDonation}
        />
        <CoverPhoto
          userId={userId}
          updatedCoverPhoto={updatedCoverPhoto ? updatedCoverPhoto.url : ''}
          error={updatedCoverPhoto ? updatedCoverPhoto.error : false}
          loading={status === Status.LOADING}
          onDrop={updateCoverPhoto}
          edit={editMode}
          darken={editMode}
        />
        <Mask show={editMode} zIndex={2}>
          <StatBanner
            isEmpty={!profile || profile.is_deactivated}
            mode={mode}
            stats={stats}
            profileId={profile?.user_id}
            areArtistRecommendationsVisible={areArtistRecommendationsVisible}
            onCloseArtistRecommendations={onCloseArtistRecommendations}
            onEdit={onEdit}
            onSave={onSave}
            onShare={onShare}
            onCancel={onCancel}
            following={following}
            isSubscribed={isSubscribed}
            onToggleSubscribe={toggleNotificationSubscription}
            onFollow={onFollow}
            onUnfollow={onUnfollow}
            canCreateChat={canCreateChat}
            onMessage={onMessage}
            isBlocked={isBlocked}
            isMuted={isMutedState}
            accountUserId={accountUserId}
            onBlock={onBlock}
            onUnblock={onUnblock}
            onMute={onMute}
          />
          <Flex direction='column'>
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
                <DeactivatedProfileTombstone />
              ) : (
                body
              )}
            </div>
          </Flex>
        </Mask>
      </Box>

      {profile ? (
        <>
          <BlockUserConfirmationModal
            user={profile}
            isVisible={showBlockUserConfirmationModal}
            onClose={onCloseBlockUserConfirmationModal}
          />
          <UnblockUserConfirmationModal
            user={profile}
            isVisible={showUnblockUserConfirmationModal}
            onClose={onCloseUnblockUserConfirmationModal}
          />
          <ConfirmationModal
            onClose={onCloseMuteUserConfirmationModal}
            isOpen={showMuteUserConfirmationModal}
            messages={
              isMutedState
                ? {
                    header: commentsMessages.popups.unmuteUser.title,
                    description: unMuteUserConfirmationBody,
                    confirm: commentsMessages.popups.unmuteUser.confirm
                  }
                : {
                    header: commentsMessages.popups.muteUser.title,
                    description: muteUserConfirmationBody,
                    confirm: commentsMessages.popups.muteUser.confirm
                  }
            }
            onConfirm={() => {
              if (userId) {
                muteUser({
                  mutedUserId: userId,
                  isMuted: isMutedState
                })
                setIsMuted(!isMutedState)
              }
            }}
          ></ConfirmationModal>
        </>
      ) : null}
    </Page>
  )
}

export default memo(ProfilePage)
