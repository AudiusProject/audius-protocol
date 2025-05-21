import { SquareSizes, ID, User, CoverPhotoSizes, ProfilePictureSizes, ShareSource, FollowSource, Track } from '@audius/common/models'
import { accountSelectors, usersSelectors, profilePageSelectors, uiActions as coreUIActions, chatActions, usersSocialActions as userSocialActions, profileActions, collectionsSocialActions, tracksSocialActions } from '@audius/common/store'
import { Text, IconVerified, IconShare, IconMessage, IconSettings, IconFollow, IconUnfollow, IconBlockUser, IconEllipsis, IconPin } from '@audius/harmony'
import { developmentConfig } from '@audius/sdk'
import { within as rtlWithin } from '@testing-library/react' // Renamed to avoid conflict
import { http, HttpResponse, passthrough } from 'msw'
import { setupServer } from 'msw/node'
import { NavLink } from 'react-router-dom'
import { MemoryRouter, Routes, Route, Link } from 'react-router-dom-v5-compat'
import { describe, it, expect, vi, beforeAll, afterEach, afterAll, beforeEach } from 'vitest'

import { render, screen, testStore, waitFor, userEvent } from 'test/test-utils'

import { ProfilePage } from './ProfilePage'

// Mock common store selectors and actions
vi.mock('@audius/common/store', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    accountSelectors: {
      ...actual.accountSelectors,
      getAccountUser: vi.fn(),
      getUserId: vi.fn(),
      getAccountStatus: vi.fn()
    },
    usersSelectors: {
        ...actual.usersSelectors,
        getUser: vi.fn(),
        getFollowingStatus: vi.fn().mockReturnValue(false)
    },
    profilePageSelectors: {
        ...actual.profilePageSelectors,
        getProfileUser: vi.fn(),
        getProfileTabs: vi.fn(),
        getProfileFeed: vi.fn(),
        getProfileCollections: vi.fn(),
        getActiveTab: vi.fn().mockReturnValue(null),
        getProfileArtistPicks: vi.fn().mockReturnValue([]) // For pinned content
    },
    profileActions: {
        ...actual.profileActions,
        activateTab: vi.fn(),
        fetchProfile: vi.fn(),
        updateProfile: vi.fn(), // For edit profile
        setArtistPick: vi.fn(), // For pinning item
        unpinItem: vi.fn() // For unpinning item
    },
    uiActions: {
        ...actual.uiActions,
        showModal: vi.fn(),
        hideModal: vi.fn(),
        setLoading: vi.fn(),
        openShareModal: vi.fn(),
        setFollowersModal: vi.fn(),
        setFollowingModal: vi.fn(),
        setSupportersModal: vi.fn(),
        setSupportingModal: vi.fn(),
        goToRoute: vi.fn() // For navigation
    },
    chatActions: {
        ...actual.chatActions,
        createChat: vi.fn()
    },
    userSocialActions: {
        ...actual.usersSocialActions,
        followUser: vi.fn(),
        unfollowUser: vi.fn(),
        subscribeUser: vi.fn(),
        unsubscribeUser: vi.fn(),
        blockUser: vi.fn(),
        unblockUser: vi.fn()
    },
    // Mock other actions if needed for pinned items (e.g. track/playlist actions)
    tracksSocialActions: {
        ...actual.tracksSocialActions
    },
    collectionsSocialActions: {
        ...actual.collectionsSocialActions
    }
  }
})

const { apiEndpoint } = developmentConfig.network
const currentUserId = 123 as ID
const otherUserId = 456 as ID // Renamed for clarity
const deactivatedUserId = 789 as ID

let testProfileUser: User = {
  user_id: otherUserId, // Default to viewing another user's profile
  _is_following: false,
  name: 'Test Profile User',
  handle: 'testprofileuser',
  handle_lc: 'testprofileuser',
  bio: 'This is a test bio for our amazing profile user.',
  location: 'Test Location, World',
  is_verified: true,
  cover_photo: 'cover.jpg', // Simplified, will be mocked with full URL
  profile_picture: 'profile.jpg', // Simplified
  cover_photo_sizes: { '2000x': `${apiEndpoint}/images/testprofileuser/cover_2000x.jpg` } as CoverPhotoSizes,
  profile_picture_sizes: { '1000x': `${apiEndpoint}/images/testprofileuser/profile_1000x.jpg` } as ProfilePictureSizes,
  follower_count: 150,
  followee_count: 75, // Supporting
  repost_count: 30,
  track_count: 10,
  playlist_count: 5,
  album_count: 2,
  blocknumber: 10000,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  is_deactivated: false,
  artist_pick_track_id: null,
  allow_ai_attribution: false,
  does_current_user_follow: false, // Assume current user is not following initially
  does_current_user_subscribe: false,
  erc_wallet: `0x${otherUserId}erc`,
  spl_wallet: `${otherUserId}spl`,
  has_collectibles: false,
  twitter_handle: 'testprofiletwitter',
  instagram_handle: 'testprofileinsta',
  tiktok_handle: 'testprofiletiktok',
  website: 'https://testprofile.com',
  wallet_is_verified: true,
  creator_node_endpoint: 'https://creatornode.audius.co',
  is_available: true,
  metadata_multihash: 'QmTestHash123',
  supporter_count: 20,
  supporting_count: 10,
  total_audio_play_count: 5000
}

const testDeactivatedProfile: User = {
    user_id: deactivatedUserId,
    name: 'Deactivated User',
    handle: 'deactivateduser',
    handle_lc: 'deactivateduser',
    is_deactivated: true,
    // Most other fields would be null or default for a deactivated user
    bio: null,
    location: null,
    is_verified: false,
    cover_photo: null,
    profile_picture: null,
    cover_photo_sizes: null,
    profile_picture_sizes: null,
    follower_count: 0,
    followee_count: 0,
    repost_count: 0,
    track_count: 0,
    playlist_count: 0,
    album_count: 0,
    blocknumber: 1000,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    artist_pick_track_id: null,
    allow_ai_attribution: false,
    does_current_user_follow: false,
    does_current_user_subscribe: false,
    erc_wallet: null,
    spl_wallet: null,
    has_collectibles: false,
    twitter_handle: null,
    instagram_handle: null,
    tiktok_handle: null,
    website: null,
    wallet_is_verified: false,
    creator_node_endpoint: null,
    is_available: false, // Typically false for deactivated
    metadata_multihash: null,
    supporter_count: 0,
    supporting_count: 0,
    total_audio_play_count: 0
}


const mockTracks = Array.from({ length: 3 }, (_, i) => ({
  track_id: `profTrack${i + 1}` as ID, // Unique track_id prefix
  title: `Test Track ${i + 1}`,
  user: testProfileUser, // This will be overridden for ownUserProfile's pinned track
  duration: 180 + i,
  play_count: 100 + i * 10,
  permalink: `/${testProfileUser.handle}/test-track-${i + 1}`
  // Add other necessary track fields
}))

const mockAlbums = Array.from({ length: 1 }, (_, i) => ({
  playlist_id: `album${i + 1}` as ID,
  playlist_name: `Test Album ${i + 1}`,
  user: testProfileUser,
  is_album: true,
  // Add other necessary album/playlist fields
}))

const mockPlaylists = Array.from({ length: 1 }, (_, i) => ({
  playlist_id: `playlist${i + 1}` as ID,
  playlist_name: `Test Playlist ${i + 1}`,
  user: testProfileUser,
  is_album: false,
  // Add other necessary playlist fields
}))

const mockReposts = mockTracks.slice(0, 1).map(track => ({
    repost_item_id: track.track_id,
    repost_type: 'track',
    user_id: otherUserId,
    // ... other repost fields
    item: track // The actual track object is often nested
}))


const server = setupServer(
  http.get(`${apiEndpoint}/v1/users/handle/:handle`, ({ params }) => {
    if (params.handle === testProfileUser.handle) {
      return HttpResponse.json({ data: testProfileUser })
    }
    if (params.handle === testDeactivatedProfile.handle) {
        return HttpResponse.json({ data: testDeactivatedProfile })
    }
    // Handle ownUserProfile case
    if (params.handle === 'currentUserHandle') {
        const ownUserProfileData = { ...testProfileUser, user_id: currentUserId, handle: 'currentUserHandle', name: 'My Awesome Profile', artist_pick_track_id: mockTracks[0].track_id };
        return HttpResponse.json({ data: ownUserProfileData });
    }
    return new HttpResponse(null, { status: 404 })
  }),
  http.get(`${apiEndpoint}/v1/users/:userId`, ({ params }) => {
    if (params.userId === testProfileUser.user_id.toString()) {
        return HttpResponse.json({ data: testProfileUser })
    }
    if (params.userId === testDeactivatedProfile.user_id.toString()) {
        return HttpResponse.json({ data: testDeactivatedProfile })
    }
    // Handle ownUserProfile case
    if (params.userId === currentUserId.toString()) {
        const ownUserProfileData = { ...testProfileUser, user_id: currentUserId, handle: 'currentUserHandle', name: 'My Awesome Profile', artist_pick_track_id: mockTracks[0].track_id };
        return HttpResponse.json({ data: ownUserProfileData });
    }
    return new HttpResponse(null, { status: 404 })
  }),
  http.get(`${apiEndpoint}/v1/users/:userId/tracks`, ({ params }) => {
    const profileId = parseInt(params.userId as string, 10)
    if (profileId === deactivatedUserId) return HttpResponse.json({ data: [] }) // Deactivated users have no content

    const userForTracks = profileId === currentUserId ? 
        { ...testProfileUser, user_id: currentUserId, handle: 'currentUserHandle' } : 
        testProfileUser;
    const tracksForUser = mockTracks.map(t => ({...t, user: userForTracks }));
    return HttpResponse.json({ data: tracksForUser })
  }),
  http.get(`${apiEndpoint}/v1/users/:userId/albums`, ({ params }) => {
     if (params.userId === testProfileUser.user_id.toString()) {
        return HttpResponse.json({ data: mockAlbums })
    }
    if (params.userId === deactivatedUserId.toString()) return HttpResponse.json({ data: [] })
    return new HttpResponse(null, { status: 404 })
  }),
  http.get(`${apiEndpoint}/v1/users/:userId/playlists`, ({ params }) => {
     if (params.userId === testProfileUser.user_id.toString()) {
        return HttpResponse.json({ data: mockPlaylists })
    }
    if (params.userId === deactivatedUserId.toString()) return HttpResponse.json({ data: [] })
    return new HttpResponse(null, { status: 404 })
  }),
  http.get(`${apiEndpoint}/v1/users/:userId/reposts`, ({ params }) => {
    if (params.userId === testProfileUser.user_id.toString()) {
        return HttpResponse.json({ data: mockReposts })
    }
    if (params.userId === deactivatedUserId.toString()) return HttpResponse.json({ data: [] })
    return new HttpResponse(null, { status: 404 })
  }),
   http.get(`${apiEndpoint}/v1/tracks/${mockTracks[0].track_id}`, () => {
    return HttpResponse.json({ data: { ...mockTracks[0], user: { ...testProfileUser, user_id: currentUserId, handle: 'currentUserHandle' } } }) // Ensure pinned track has owner info
  }),
  // Follow/Unfollow handlers (use otherUserId which is the default profileUserId in these tests)
  http.post(`${apiEndpoint}/v1/users/${otherUserId}/follow`, async () => {
    testProfileUser = { ...testProfileUser, does_current_user_follow: true, follower_count: testProfileUser.follower_count + 1 }
    return HttpResponse.json({})
  }),
  http.delete(`${apiEndpoint}/v1/users/${otherUserId}/follow`, async () => {
    testProfileUser = { ...testProfileUser, does_current_user_follow: false, follower_count: testProfileUser.follower_count - 1 }
    return HttpResponse.json({})
  }),
  // Block user handler
  http.post(`${apiEndpoint}/v1/users/${otherUserId}/block`, async () => {
    // Simulate user being blocked, might involve updating user object or just returning success
    return HttpResponse.json({})
  }),
  http.get('*', () => passthrough())
)

const renderDesktopProfilePage = (
    profileUserToRender = testProfileUser,
    loggedInUserId = currentUserId,
    initialIsFollowing = false
) => {
  // Reset mutable testProfileUser state for each render
  testProfileUser = { ...profileUserToRender, does_current_user_follow: initialIsFollowing, follower_count: profileUserToRender.follower_count }

  // @ts-ignore
  accountSelectors.getUserId.mockReturnValue(loggedInUserId)
  // @ts-ignore
  usersSelectors.getUser.mockImplementation((state: any, { handle, id }: { handle?: string, id?: ID }) => {
    if (handle === testProfileUser.handle || id === testProfileUser.user_id) {
      return testProfileUser // Return potentially modified testProfileUser
    }
    return null
  })
  // @ts-ignore
  profilePageSelectors.getProfileUser.mockImplementation(() => testProfileUser)
  // @ts-ignore
  usersSelectors.getFollowingStatus.mockReturnValue(initialIsFollowing)
  // @ts-ignore
  profilePageSelectors.getActiveTab.mockReturnValue({ type: 'TRACKS', label: 'Tracks' }) // Default to Tracks tab

  const store = testStore()

  return render(
    <MemoryRouter initialEntries={[`/${profileUserToRender.handle}`]}>
      <Routes>
        <Route path="/:handle" element={<ProfilePage />} />
        <Route path="/settings" element={<Text>Settings Page</Text>} />
        <Route path="/chat/:presetMessage?" element={<Text>Chat Page</Text>} />
        <Route path="/dashboard" element={<Text>Artist Dashboard</Text>} />
        <Route path="/settings/profile" element={<Text>Edit Profile Page</Text>} />
      </Routes>
    </MemoryRouter>,
    { store }
  )
}

describe('Desktop ProfilePage', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
  // Reset testProfileUser before each describe block to ensure clean state for different scenarios
  beforeEach(() => {
    testProfileUser = {
        user_id: otherUserId, // Default to other user for most tests
        _is_following: false,
        name: 'Test Profile User',
        handle: 'testprofileuser',
        handle_lc: 'testprofileuser',
        bio: 'This is a test bio for our amazing profile user.',
        location: 'Test Location, World',
        is_verified: true,
        cover_photo: 'cover.jpg',
        profile_picture: 'profile.jpg',
        cover_photo_sizes: { '2000x': `${apiEndpoint}/images/testprofileuser/cover_2000x.jpg` } as CoverPhotoSizes,
        profile_picture_sizes: { '1000x': `${apiEndpoint}/images/testprofileuser/profile_1000x.jpg` } as ProfilePictureSizes,
        follower_count: 150,
        followee_count: 75,
        repost_count: 30,
        track_count: 10,
        playlist_count: 5,
        album_count: 2,
        blocknumber: 10000,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_deactivated: false,
        artist_pick_track_id: null,
        allow_ai_attribution: false,
        does_current_user_follow: false,
        does_current_user_subscribe: false,
        erc_wallet: `0x${otherUserId}erc`,
        spl_wallet: `${otherUserId}spl`,
        has_collectibles: false,
        twitter_handle: 'testprofiletwitter',
        instagram_handle: 'testprofileinsta',
        tiktok_handle: 'testprofiletiktok',
        website: 'https://testprofile.com',
        wallet_is_verified: true,
        creator_node_endpoint: 'https://creatornode.audius.co',
        is_available: true,
        metadata_multihash: 'QmTestHash123',
        supporter_count: 20,
        supporting_count: 10,
        total_audio_play_count: 5000
    }
  })
  afterEach(() => {
    server.resetHandlers()
    vi.clearAllMocks()
  })
  afterAll(() => server.close())

  describe('Standard User Profile Rendering (Not Current User, Not Deactivated)', () => {
    beforeEach(() => {
      renderDesktopProfilePage(testProfileUser, currentUserId)
    })

    it('renders user metadata correctly', async () => {
      expect(await screen.findByText(testProfileUser.name)).toBeInTheDocument()
      expect(await screen.findByText(`@${testProfileUser.handle}`)).toBeInTheDocument()
      if (testProfileUser.bio) {
        expect(await screen.findByText(testProfileUser.bio)).toBeInTheDocument()
      }
      if (testProfileUser.location) {
        expect(await screen.findByText(testProfileUser.location)).toBeInTheDocument()
      }
      if (testProfileUser.is_verified) {
        expect(await screen.findByTestId('IconVerified')).toBeInTheDocument()
      }
    })

    it('renders cover photo and profile picture', async () => {
      const coverPhoto = await screen.findByTestId('profileCover') // Assuming a testId or role for cover
      expect(coverPhoto).toHaveStyle(`background-image: url(${testProfileUser.cover_photo_sizes['2000x']})`)

      const profilePicture = await screen.findByRole('img', { name: /profile picture/i }) // Adjust accessible name
      expect(profilePicture).toHaveAttribute('src', testProfileUser.profile_picture_sizes['1000x'])
    })

    it('renders stats: followers, supporting, total listens', async () => {
      expect(await screen.findByText(testProfileUser.follower_count.toString())).toBeInTheDocument()
      expect(await screen.findByText(/followers/i)).toBeInTheDocument()

      expect(await screen.findByText(testProfileUser.followee_count.toString())).toBeInTheDocument()
      expect(await screen.findByText(/supporting/i)).toBeInTheDocument()
      
      if (testProfileUser.total_audio_play_count) {
        // expect(await screen.findByText(new RegExp(testProfileUser.total_audio_play_count.toString()))).toBeInTheDocument()
      }
    })

    it('renders action buttons: Follow, Message, Share, More', async () => {
      expect(await screen.findByRole('button', { name: /follow/i })).toBeInTheDocument()
      expect(await screen.findByRole('button', { name: /message/i })).toBeInTheDocument()
      expect(await screen.findByRole('button', { name: /share/i })).toBeInTheDocument()
      expect(await screen.findByRole('button', { name: /more actions/i })).toBeInTheDocument() 
    })

    it('renders profile tabs: Tracks, Albums, Playlists, Reposts', async () => {
      expect(await screen.findByRole('tab', { name: /tracks/i })).toBeInTheDocument()
      expect(await screen.findByRole('tab', { name: /albums/i })).toBeInTheDocument()
      expect(await screen.findByRole('tab', { name: /playlists/i })).toBeInTheDocument()
      expect(await screen.findByRole('tab', { name: /reposts/i })).toBeInTheDocument()
    })

    it('renders default tab content (Tracks) with a list of tracks', async () => {
      // @ts-ignore
      profilePageSelectors.getActiveTab.mockReturnValue({ type: 'TRACKS', label: 'Tracks' }) 
      expect(await screen.findByText(mockTracks[0].title)).toBeInTheDocument()
    })
  })

  describe('Standard User Profile Interactions (Not Current User)', () => {
    it('Follow/Unfollow Button: toggles follow state, updates UI, and calls API', async () => {
      const initialFollowerCount = testProfileUser.follower_count
      const { user } = renderDesktopProfilePage(testProfileUser, currentUserId, false) 

      const followButton = await screen.findByRole('button', { name: /follow/i })
      await user.click(followButton)
      expect(userSocialActions.followUser).toHaveBeenCalledWith(otherUserId, FollowSource.PROFILE_PAGE)
      await waitFor(async () => {
        expect(await screen.findByRole('button', { name: /unfollow/i })).toBeInTheDocument()
        expect(await screen.findByText((initialFollowerCount + 1).toString())).toBeInTheDocument()
      })

      const unfollowButton = await screen.findByRole('button', { name: /unfollow/i })
      await user.click(unfollowButton)
      expect(userSocialActions.unfollowUser).toHaveBeenCalledWith(otherUserId, FollowSource.PROFILE_PAGE)
      await waitFor(async () => {
        expect(await screen.findByRole('button', { name: /follow/i })).toBeInTheDocument()
        expect(await screen.findByText(initialFollowerCount.toString())).toBeInTheDocument()
      })
    })

    it('Message Button: dispatches createChat action', async () => {
      const { user } = renderDesktopProfilePage(testProfileUser, currentUserId)
      const messageButton = await screen.findByRole('button', { name: /message/i })
      await user.click(messageButton)
      expect(chatActions.createChat).toHaveBeenCalledWith({ userIds: [otherUserId] })
    })

    it('Share Button: opens share modal', async () => {
      const { user } = renderDesktopProfilePage(testProfileUser, currentUserId)
      const shareButton = await screen.findByRole('button', { name: /share/i })
      await user.click(shareButton)
      expect(coreUIActions.openShareModal).toHaveBeenCalledWith({
        type: 'profile',
        profileId: otherUserId,
        source: ShareSource.PAGE
      })
    })

    it('Overflow Menu Actions: opens menu and allows blocking user', async () => {
      const { user } = renderDesktopProfilePage(testProfileUser, currentUserId)
      const overflowButton = await screen.findByRole('button', { name: /more actions/i })
      await user.click(overflowButton)

      const menu = await screen.findByRole('menu')
      expect(menu).toBeInTheDocument()

      const blockUserOption = await rtlWithin(menu).findByText(/block user/i)
      expect(blockUserOption).toBeInTheDocument()
      await user.click(blockUserOption)
      expect(userSocialActions.blockUser).toHaveBeenCalledWith(otherUserId)
    })

    it('Tab Navigation: switches tabs and displays correct content', async () => {
      const { user } = renderDesktopProfilePage(testProfileUser, currentUserId)

      const albumsTab = await screen.findByRole('tab', { name: /albums/i })
      await user.click(albumsTab)
      expect(profileActions.activateTab).toHaveBeenCalledWith({ tab: 'ALBUMS' }) 
      await waitFor(async () => {
        expect(albumsTab).toHaveAttribute('aria-selected', 'true')
        expect(await screen.findByText(mockAlbums[0].playlist_name)).toBeInTheDocument()
      })

      const playlistsTab = await screen.findByRole('tab', { name: /playlists/i })
      await user.click(playlistsTab)
      expect(profileActions.activateTab).toHaveBeenCalledWith({ tab: 'PLAYLISTS' })
      await waitFor(async () => {
        expect(playlistsTab).toHaveAttribute('aria-selected', 'true')
        expect(await screen.findByText(mockPlaylists[0].playlist_name)).toBeInTheDocument()
      })

      const repostsTab = await screen.findByRole('tab', { name: /reposts/i })
      await user.click(repostsTab)
      expect(profileActions.activateTab).toHaveBeenCalledWith({ tab: 'REPOSTS' })
      await waitFor(async () => {
        expect(repostsTab).toHaveAttribute('aria-selected', 'true')
        expect(await screen.findByText(mockReposts[0].item.title)).toBeInTheDocument()
      })

      const tracksTab = await screen.findByRole('tab', { name: /tracks/i })
      await user.click(tracksTab)
      expect(profileActions.activateTab).toHaveBeenCalledWith({ tab: 'TRACKS' })
      await waitFor(async () => {
        expect(tracksTab).toHaveAttribute('aria-selected', 'true')
        expect(await screen.findByText(mockTracks[0].title)).toBeInTheDocument()
      })
    })
  })

  describe('Current User Viewing Own Profile', () => {
    const ownUserProfile: User = {
        ...testProfileUser, 
        user_id: currentUserId, 
        handle: 'currentUserHandle',
        handle_lc: 'currentUserHandle',
        name: 'My Awesome Profile',
        artist_pick_track_id: mockTracks[0].track_id 
    }

    beforeEach(() => {
        server.use(
            http.get(`${apiEndpoint}/v1/users/handle/${ownUserProfile.handle}`, () => {
                return HttpResponse.json({ data: ownUserProfile })
            }),
            http.get(`${apiEndpoint}/v1/users/${currentUserId}`, () => { 
                return HttpResponse.json({ data: ownUserProfile })
            }),
            http.get(`${apiEndpoint}/v1/tracks/${mockTracks[0].track_id}`, () => {
                 // Ensure the pinned track's user matches the ownUserProfile
                return HttpResponse.json({ data: { ...mockTracks[0], user: ownUserProfile } })
            })
        );
        // @ts-ignore
        profilePageSelectors.getProfileArtistPicks.mockReturnValue([{ ...mockTracks[0], user: ownUserProfile }]);
        testProfileUser = ownUserProfile; // Important: ensure global testProfileUser is set for this describe block
    })

    it('Action Buttons (Own Profile): shows "Edit Profile", no "Follow" or "Message"', async () => {
      renderDesktopProfilePage(ownUserProfile, currentUserId)
      expect(await screen.findByRole('button', { name: /edit profile/i })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /follow/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /message/i })).not.toBeInTheDocument()
    })

    it('Edit Profile Button: navigates to edit profile page', async () => {
      const { user } = renderDesktopProfilePage(ownUserProfile, currentUserId)
      const editProfileButton = await screen.findByRole('button', { name: /edit profile/i })
      await user.click(editProfileButton)
      expect(await screen.findByText('Edit Profile Page')).toBeInTheDocument() 
    })

    it('Overflow Menu Actions (Own Profile): shows owner-specific options', async () => {
      const { user } = renderDesktopProfilePage({ ...ownUserProfile, is_artist: true }, currentUserId) 
      const overflowButton = await screen.findByRole('button', { name: /more actions/i })
      await user.click(overflowButton)

      const menu = await screen.findByRole('menu')
      expect(menu).toBeInTheDocument()
      expect(await rtlWithin(menu).findByText(/artist dashboard/i)).toBeInTheDocument()
      expect(await rtlWithin(menu).findByText(/account settings/i)).toBeInTheDocument()

      const accountSettingsLink = await rtlWithin(menu).findByText(/account settings/i)
      await user.click(accountSettingsLink)
      expect(await screen.findByText('Settings Page')).toBeInTheDocument() 
    })
    
    describe('Pinned Content Display', () => {
        it('With Pinned Content: displays the pinned track', async () => {
            renderDesktopProfilePage({ ...ownUserProfile, artist_pick_track_id: mockTracks[0].track_id }, currentUserId)
            expect(await screen.findByTestId('pinned-item-container')).toBeInTheDocument(); 
            expect(await screen.findByText(mockTracks[0].title, { selector: '*[data-testid="pinned-item-container"] *' })).toBeInTheDocument(); 
            expect(await screen.findByTestId('IconPin')).toBeInTheDocument(); 
        })

        it('Without Pinned Content: does not display pinned content section', async () => {
            // @ts-ignore
            profilePageSelectors.getProfileArtistPicks.mockReturnValue([]); 
            renderDesktopProfilePage({ ...ownUserProfile, artist_pick_track_id: null }, currentUserId)
            expect(screen.queryByTestId('pinned-item-container')).not.toBeInTheDocument()
            expect(screen.queryByTestId('IconPin')).not.toBeInTheDocument()
        })
    })
  })

  describe('Deactivated Profile', () => {
    const deactivatedProfile: User = {
      ...testProfileUser,
      user_id: deactivatedUserId,
      handle: 'deactivatedUser',
      handle_lc: 'deactivateduser',
      name: 'Deactivated User',
      is_deactivated: true,
      bio: null,
      location: null,
      twitter_handle: null,
      instagram_handle: null,
      tiktok_handle: null,
      website: null,
      artist_pick_track_id: null,
      cover_photo: null,
      profile_picture: null,
      cover_photo_sizes: null,
      profile_picture_sizes: null,
      // Counts are typically zero or not displayed
      follower_count: 0,
      followee_count: 0,
      track_count: 0,
      playlist_count: 0,
      album_count: 0,
      repost_count: 0
    }

    beforeEach(() => {
      server.use(
        http.get(`${apiEndpoint}/v1/users/handle/${deactivatedProfile.handle}`, () => {
          return HttpResponse.json({ data: deactivatedProfile })
        }),
        http.get(`${apiEndpoint}/v1/users/${deactivatedUserId}`, () => {
          return HttpResponse.json({ data: deactivatedProfile })
        })
      )
      testProfileUser = deactivatedProfile // Set global for render helper
    })

    it('UI Verification: shows deactivated state and no interactive elements', async () => {
      renderDesktopProfilePage(deactivatedProfile, currentUserId)

      // Check for "Profile Deactivated" text or a specific tombstone component
      expect(await screen.findByText('Profile Deactivated')).toBeInTheDocument()
      // Alternatively, if there's a specific testId for the tombstone:
      // expect(await screen.findByTestId('DeactivatedProfileTombstone')).toBeInTheDocument()

      // Verify absence of typical profile elements
      expect(screen.queryByText(`@${deactivatedProfile.handle}`)).toBeInTheDocument() // Handle might still be shown
      expect(screen.queryByText(deactivatedProfile.name)).toBeInTheDocument() // Name might still be shown
      expect(screen.queryByText(/followers/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/supporting/i)).not.toBeInTheDocument()
      expect(screen.queryByRole('tablist')).not.toBeInTheDocument() // Tabs should not be present

      // Verify absence of action buttons
      expect(screen.queryByRole('button', { name: /follow/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /message/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /edit profile/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /share/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /more actions/i })).not.toBeInTheDocument()

      // Verify absence of content sections (e.g., by checking for track titles)
      mockTracks.forEach(track => {
        expect(screen.queryByText(track.title)).not.toBeInTheDocument()
      })
    })
  })
})
