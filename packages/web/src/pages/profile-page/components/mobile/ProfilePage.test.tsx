import { SquareSizes, ID, User, CoverPhotoSizes, ProfilePictureSizes, ShareSource, FollowSource, Track } from '@audius/common/models'
import { accountSelectors, usersSelectors, profilePageSelectors, uiActions as coreUIActions, chatActions, usersSocialActions as userSocialActions, profileActions, collectionsSocialActions, tracksSocialActions, mobileOverflowMenuUIActions, shareModalUIActions } from '@audius/common/store'
import { Text, IconVerified, IconShare, IconMessage, IconFollow, IconUnfollow, IconBlockUser, IconEllipsis, IconPin, IconEdit } from '@audius/harmony' // Added IconEdit
import { developmentConfig } from '@audius/sdk'
import { within as rtlWithin } from '@testing-library/react'
import { http, HttpResponse, passthrough } from 'msw'
import { setupServer } from 'msw/node'
import { MemoryRouter, Routes, Route, Link } from 'react-router-dom-v5-compat'
import { describe, it, expect, vi, beforeAll, afterEach, afterAll, beforeEach } from 'vitest'

import { render, screen, testStore, waitFor, userEvent } from 'test/test-utils'

import { ProfilePage as MobileProfilePage } from './ProfilePage' // Assuming this is the path to Mobile ProfilePage

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
        getProfileArtistPicks: vi.fn().mockReturnValue([])
    },
    profileActions: {
        ...actual.profileActions,
        activateTab: vi.fn(),
        fetchProfile: vi.fn(),
        updateProfile: vi.fn(),
        setArtistPick: vi.fn(),
        unpinItem: vi.fn()
    },
    uiActions: { // For desktop modals, some might be reused or adapted
        ...actual.uiActions,
        showModal: vi.fn(),
        hideModal: vi.fn(),
        setLoading: vi.fn(),
        // openShareModal: vi.fn(), // Replaced by mobileShareModalUIActions
        setFollowersModal: vi.fn(), // Likely mobile specific or different interaction
        setFollowingModal: vi.fn(),
        setSupportersModal: vi.fn(),
        setSupportingModal: vi.fn(),
        goToRoute: vi.fn()
    },
    mobileOverflowMenuUIActions: { // Mobile specific actions
        ...actual.mobileOverflowMenuUIActions,
        requestOpen: vi.fn()
    },
    shareModalUIActions: { // Mobile share action
        ...actual.shareModalUIActions,
        requestOpen: vi.fn()
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
const otherUserId = 456 as ID
const deactivatedUserId = 789 as ID


let testProfileUser: User = {
  user_id: otherUserId,
  _is_following: false,
  name: 'Test Profile User',
  handle: 'testprofileuser',
  handle_lc: 'testprofileuser',
  bio: 'This is a test bio for our amazing profile user.',
  location: 'Test Location, World',
  is_verified: true,
  cover_photo_sizes: { '640x': `${apiEndpoint}/images/testprofileuser/cover_640x.jpg` } as CoverPhotoSizes, // Mobile specific size maybe
  profile_picture_sizes: { '480x': `${apiEndpoint}/images/testprofileuser/profile_480x.jpg` } as ProfilePictureSizes, // Mobile specific size maybe
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

const ownUserProfile: User = {
    ...testProfileUser,
    user_id: currentUserId,
    handle: 'currentUserHandle',
    handle_lc: 'currentUserHandle',
    name: 'My Awesome Mobile Profile',
    artist_pick_track_id: `profTrack1` as ID // Example pinned track
}

const testDeactivatedProfile: User = {
  ...testProfileUser,
  user_id: deactivatedUserId,
  name: 'Deactivated Mobile User',
  handle: 'deactivatedmobileuser',
  handle_lc: 'deactivatedmobileuser',
  is_deactivated: true,
  bio: null,
  location: null,
  is_verified: false,
  cover_photo_sizes: null,
  profile_picture_sizes: null,
  follower_count: 0,
  followee_count: 0,
  track_count: 0,
  playlist_count: 0,
  album_count: 0,
  repost_count: 0,
  artist_pick_track_id: null,
}


const mockTracks = Array.from({ length: 3 }, (_, i) => ({
  track_id: `profTrack${i + 1}` as ID,
  title: `Mobile Test Track ${i + 1}`,
  user: testProfileUser, // Will be overridden for own profile's pinned track
  duration: 180 + i,
  play_count: 100 + i * 10,
  permalink: `/${testProfileUser.handle}/mobile-test-track-${i + 1}`
}))

const mockAlbums = Array.from({ length: 1 }, (_, i) => ({
  playlist_id: `mobileAlbum${i + 1}` as ID,
  playlist_name: `Mobile Test Album ${i + 1}`,
  user: testProfileUser,
  is_album: true,
}))

const mockPlaylists = Array.from({ length: 1 }, (_, i) => ({
  playlist_id: `mobilePlaylist${i + 1}` as ID,
  playlist_name: `Mobile Test Playlist ${i + 1}`,
  user: testProfileUser,
  is_album: false,
}))

const mockReposts = mockTracks.slice(0, 1).map(track => ({
    repost_item_id: track.track_id,
    repost_type: 'track',
    user_id: otherUserId,
    item: track
}))


const server = setupServer(
  http.get(`${apiEndpoint}/v1/users/handle/:handle`, ({ params }) => {
    const handle = params.handle as string
    if (handle === ownUserProfile.handle) return HttpResponse.json({ data: ownUserProfile })
    if (handle === testDeactivatedProfile.handle) return HttpResponse.json({ data: testDeactivatedProfile })
    if (handle === testProfileUser.handle) return HttpResponse.json({ data: testProfileUser })
    return new HttpResponse(null, { status: 404 })
  }),
  http.get(`${apiEndpoint}/v1/users/:userId`, ({ params }) => {
    const userId = parseInt(params.userId as string, 10)
    if (userId === currentUserId) return HttpResponse.json({ data: ownUserProfile })
    if (userId === deactivatedUserId) return HttpResponse.json({ data: testDeactivatedProfile })
    if (userId === otherUserId) return HttpResponse.json({ data: testProfileUser })
    return new HttpResponse(null, { status: 404 })
  }),
  http.get(`${apiEndpoint}/v1/users/:userId/tracks`, ({ params }) => {
    const userId = parseInt(params.userId as string, 10)
    if (userId === deactivatedUserId) return HttpResponse.json({ data: [] })
    const userForTracks = userId === currentUserId ? ownUserProfile : testProfileUser;
    return HttpResponse.json({ data: mockTracks.map(t => ({...t, user: userForTracks})) })
  }),
  http.get(`${apiEndpoint}/v1/users/:userId/albums`, () => HttpResponse.json({ data: mockAlbums })),
  http.get(`${apiEndpoint}/v1/users/:userId/playlists`, () => HttpResponse.json({ data: mockPlaylists })),
  http.get(`${apiEndpoint}/v1/users/:userId/reposts`, () => HttpResponse.json({ data: mockReposts })),
  http.get(`${apiEndpoint}/v1/tracks/${mockTracks[0].track_id}`, () => HttpResponse.json({ data: { ...mockTracks[0], user: ownUserProfile } })),
  http.post(`${apiEndpoint}/v1/users/:userId/follow`, () => HttpResponse.json({})),
  http.delete(`${apiEndpoint}/v1/users/:userId/follow`, () => HttpResponse.json({})),
  http.post(`${apiEndpoint}/v1/users/:userId/block`, () => HttpResponse.json({})),
  http.get('*', () => passthrough())
)

const renderMobileProfilePage = (
    profileUserToRender = testProfileUser,
    loggedInUserId = currentUserId,
    initialIsFollowing = false
) => {
  testProfileUser = { ...profileUserToRender, does_current_user_follow: initialIsFollowing, follower_count: profileUserToRender.follower_count }

  // @ts-ignore
  accountSelectors.getUserId.mockReturnValue(loggedInUserId)
  // @ts-ignore
  usersSelectors.getUser.mockImplementation((state: any, { handle, id }: { handle?: string, id?: ID }) => {
    if (handle === testProfileUser.handle || id === testProfileUser.user_id) return testProfileUser
    return null
  })
  // @ts-ignore
  profilePageSelectors.getProfileUser.mockImplementation(() => testProfileUser)
  // @ts-ignore
  usersSelectors.getFollowingStatus.mockReturnValue(initialIsFollowing)
  // @ts-ignore
  profilePageSelectors.getActiveTab.mockReturnValue({ type: 'TRACKS', label: 'Tracks' })

  const store = testStore()

  return render(
    <MemoryRouter initialEntries={[`/${profileUserToRender.handle}`]}>
      <Routes>
        <Route path="/:handle" element={<MobileProfilePage />} />
        <Route path="/settings" element={<Text>Settings Page</Text>} />
        <Route path="/settings/profile" element={<Text>Edit Mobile Profile Page</Text>} />
        <Route path="/dashboard" element={<Text>Mobile Artist Dashboard</Text>} />
      </Routes>
    </MemoryRouter>,
    { store }
  )
}

describe('Mobile ProfilePage', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
  beforeEach(() => { // Reset base testProfileUser before each test
    testProfileUser = {
        user_id: otherUserId, _is_following: false, name: 'Test Profile User', handle: 'testprofileuser', handle_lc: 'testprofileuser', bio: 'This is a test bio for our amazing profile user.', location: 'Test Location, World', is_verified: true, cover_photo_sizes: { '640x': `${apiEndpoint}/images/testprofileuser/cover_640x.jpg` } as CoverPhotoSizes, profile_picture_sizes: { '480x': `${apiEndpoint}/images/testprofileuser/profile_480x.jpg` } as ProfilePictureSizes, follower_count: 150, followee_count: 75, repost_count: 30, track_count: 10, playlist_count: 5, album_count: 2, blocknumber: 10000, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), is_deactivated: false, artist_pick_track_id: null, allow_ai_attribution: false, does_current_user_follow: false, does_current_user_subscribe: false, erc_wallet: `0x${otherUserId}erc`, spl_wallet: `${otherUserId}spl`, has_collectibles: false, twitter_handle: 'testprofiletwitter', instagram_handle: 'testprofileinsta', tiktok_handle: 'testprofiletiktok', website: 'https://testprofile.com', wallet_is_verified: true, creator_node_endpoint: 'https://creatornode.audius.co', is_available: true, metadata_multihash: 'QmTestHash123', supporter_count: 20, supporting_count: 10, total_audio_play_count: 5000
    }
  })
  afterEach(() => { server.resetHandlers(); vi.clearAllMocks(); })
  afterAll(() => server.close())

  describe('Standard User Profile (Mobile - Viewed by another user)', () => {
    beforeEach(() => {
      renderMobileProfilePage(testProfileUser, currentUserId)
    })

    it('renders mobile user metadata and images', async () => {
      expect(await screen.findByText(testProfileUser.name)).toBeInTheDocument()
      expect(await screen.findByText(`@${testProfileUser.handle}`)).toBeInTheDocument()
      if (testProfileUser.bio) expect(await screen.findByText(testProfileUser.bio)).toBeInTheDocument()
      // Cover photo and profile picture assertions might need specific testIds or more robust selectors for mobile structure
      const images = screen.getAllByRole('img') // Generic check, refine if possible
      expect(images.some(img => img.getAttribute('src')?.includes('cover_640x.jpg'))).toBe(true)
      expect(images.some(img => img.getAttribute('src')?.includes('profile_1000x.jpg') || img.getAttribute('src')?.includes('profile_480x.jpg'))).toBe(true)


      expect(await screen.findByText(testProfileUser.follower_count.toString())).toBeInTheDocument()
      expect(await screen.findByText(/followers/i)).toBeInTheDocument()
      expect(await screen.findByText(testProfileUser.followee_count.toString())).toBeInTheDocument()
      expect(await screen.findByText(/following/i)).toBeInTheDocument() // Mobile often uses "Following" vs "Supporting"
    })

    it('renders mobile action buttons: Follow, Message, Share, More', async () => {
      expect(await screen.findByRole('button', { name: /follow/i })).toBeInTheDocument()
      // Message button might not be present or named differently in mobile UI
      // expect(await screen.findByRole('button', { name: /message/i })).toBeInTheDocument() 
      expect(await screen.findByRole('button', { name: /share/i })).toBeInTheDocument()
      expect(await screen.findByRole('button', { name: /more actions/i })).toBeInTheDocument()
    })
    
    it('renders mobile profile tabs and default content', async () => {
      expect(await screen.findByRole('tab', { name: /tracks/i })).toBeInTheDocument()
      expect(await screen.findByRole('tab', { name: /reposts/i })).toBeInTheDocument()
      // Albums and Playlists might be under a "Collections" tab or similar on mobile
      // For simplicity, assuming they are top-level for now or tested via Collections tab if that's the pattern
      expect(await screen.findByText(mockTracks[0].title)).toBeInTheDocument() // Check for default tab (tracks) content
    })

    it('Follow/Unfollow Button: toggles follow state and calls API', async () => {
      const { user } = renderMobileProfilePage(testProfileUser, currentUserId, false)
      const followButton = await screen.findByRole('button', { name: /follow/i })
      await user.click(followButton)
      expect(userSocialActions.followUser).toHaveBeenCalledWith(otherUserId, FollowSource.PROFILE_PAGE)
      // Simulate state update and re-render if necessary for UI change
    })

    it('Share Button: opens mobile share modal', async () => {
      const { user } = renderMobileProfilePage(testProfileUser, currentUserId)
      const shareButton = await screen.findByRole('button', { name: /share/i })
      await user.click(shareButton)
      expect(shareModalUIActions.requestOpen).toHaveBeenCalledWith({ type: 'profile', profileId: otherUserId, source: ShareSource.PAGE })
    })
    
    it('Overflow Menu: opens mobile overflow menu', async () => {
      const { user } = renderMobileProfilePage(testProfileUser, currentUserId)
      const overflowButton = await screen.findByRole('button', { name: /more actions/i })
      await user.click(overflowButton)
      expect(mobileOverflowMenuUIActions.requestOpen).toHaveBeenCalled()
    })
  })

  describe('Current User Viewing Own Profile (Mobile)', () => {
     beforeEach(() => {
        // Ensure MSW handlers are set up for ownUserProfile
        server.use(
            http.get(`${apiEndpoint}/v1/users/handle/${ownUserProfile.handle}`, () => HttpResponse.json({ data: ownUserProfile })),
            http.get(`${apiEndpoint}/v1/users/${currentUserId}`, () => HttpResponse.json({ data: ownUserProfile })),
            http.get(`${apiEndpoint}/v1/tracks/${mockTracks[0].track_id}`, () => HttpResponse.json({ data: { ...mockTracks[0], user: ownUserProfile } }))
        );
        // @ts-ignore
        profilePageSelectors.getProfileArtistPicks.mockReturnValue([{ ...mockTracks[0], user: ownUserProfile }]);
        testProfileUser = ownUserProfile; 
    })

    it('Action Buttons: shows "Edit Profile", no "Follow" or "Message"', async () => {
      renderMobileProfilePage(ownUserProfile, currentUserId)
      expect(await screen.findByRole('button', { name: /edit profile/i })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /follow/i })).not.toBeInTheDocument()
    })

    it('Edit Profile Button: navigates to edit profile page', async () => {
      const { user } = renderMobileProfilePage(ownUserProfile, currentUserId)
      const editProfileButton = await screen.findByRole('button', { name: /edit profile/i })
      await user.click(editProfileButton)
      expect(await screen.findByText('Edit Mobile Profile Page')).toBeInTheDocument()
    })
    
    it('Pinned Content: displays pinned track', async () => {
        renderMobileProfilePage({ ...ownUserProfile, artist_pick_track_id: mockTracks[0].track_id }, currentUserId);
        // Mobile might have a different structure for pinned content
        expect(await screen.findByText(mockTracks[0].title)).toBeInTheDocument(); 
        // Check for a pin icon or specific styling if available
        expect(await screen.findByTestId('IconPin')).toBeInTheDocument();
    })
  })

  describe('Deactivated Profile (Mobile)', () => {
     beforeEach(() => {
        server.use(
            http.get(`${apiEndpoint}/v1/users/handle/${testDeactivatedProfile.handle}`, () => HttpResponse.json({ data: testDeactivatedProfile })),
            http.get(`${apiEndpoint}/v1/users/${deactivatedUserId}`, () => HttpResponse.json({ data: testDeactivatedProfile }))
        )
        testProfileUser = testDeactivatedProfile;
    })
    it('UI Verification: shows deactivated state and minimal info', async () => {
      renderMobileProfilePage(testDeactivatedProfile, currentUserId)
      expect(await screen.findByText('Profile Deactivated')).toBeInTheDocument() 
      expect(screen.queryByText(`@${testDeactivatedProfile.handle}`)).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /follow/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('tablist')).not.toBeInTheDocument()
    })
  })
})

// Minimalistic helper for finding elements within a scope if needed for specific mobile menu structures
// const within = (element: HTMLElement) => ({ ... }); // Adapting from desktop might be complex for mobile menus
