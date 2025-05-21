import { SquareSizes, ID, FavoriteSource, RepostSource, ShareSource, PlaybackSource, Name, PremiumConditions, AccessConditions, User } from '@audius/common/models'
import { playerActions, tracksSocialActions, usersSocialActions, uiActions, accountSelectors, playerSelectors, playbackPositionActions, premiumContentActions, gatedContentSelectors, PurchaseableContentType, usersSelectors, chatActions } from '@audius/common/store'
import { Nullable, makeUid } from '@audius/common/utils'
import { Text, IconPlay, IconPause, IconHeart, IconRepost, IconShare, IconAddToPlaylist, IconKebabHorizontal, IconLock, IconEdit, IconTrash, IconFollow, IconTip } from '@audius/harmony'
import { developmentConfig } from '@audius/sdk'
import { fireEvent } from '@testing-library/react'
import { http, HttpResponse, passthrough, delay } from 'msw'
import { CollectibleDetailsPage } from 'pages/collectible-details-page/CollectibleDetailsPage'
import { CollectibleDetailsPage } from 'pages/collectible-details-page/CollectibleDetailsPage'
import { setupServer } from 'msw/node'
import { MemoryRouter, Routes, Route, Link, useLocation } from 'react-router-dom-v5-compat'
import { describe, it, expect, vi, beforeAll, afterEach, afterAll, beforeEach } from 'vitest'

import { render, screen, testStore, waitFor, userEvent } from 'test/test-utils'

import { TrackPage } from './TrackPage' // Adjust path if necessary

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
    playerSelectors: {
      ...actual.playerSelectors,
      getPlaying: vi.fn().mockReturnValue(false),
      getCurrentTrack: vi.fn().mockReturnValue(null),
      getTrackId: vi.fn().mockReturnValue(null),
      getUid: vi.fn().mockReturnValue(null)
    },
    playerActions: {
      ...actual.playerActions,
      play: vi.fn(),
      pause: vi.fn(),
      stop: vi.fn(),
      reset: vi.fn(),
      seek: vi.fn(),
      setBuffering: vi.fn(),
      setPendingSeek: vi.fn(),
    },
    tracksSocialActions: {
      ...actual.tracksSocialActions,
      saveTrack: vi.fn(),
      unsaveTrack: vi.fn(),
      repostTrack: vi.fn(),
      undoRepostTrack: vi.fn(),
      shareTrack: vi.fn(),
      setTrackRepost: vi.fn(),
      deleteTrack: vi.fn()
    },
    usersSocialActions: { // For follow/unfollow
        ...actual.usersSocialActions,
        followUser: vi.fn(),
        unfollowUser: vi.fn()
    },
    usersSelectors: { // For checking follow status
        ...actual.usersSelectors,
        getFollowingStatus: vi.fn().mockReturnValue(false) // Default to not following
    },
    uiActions: {
      ...actual.uiActions,
      showModal: vi.fn(),
      hideModal: vi.fn(),
      setLoading: vi.fn(),
      openAddToPlaylistModal: vi.fn(),
      openEditTrackModal: vi.fn(),
      openShareModal: vi.fn(),
      openTipModal: vi.fn() // For tip-gated tracks
    },
    playbackPositionActions: {
        ...actual.playbackPositionActions,
        recordListen: vi.fn()
    },
    premiumContentActions: {
      ...actual.premiumContentActions,
      openPremiumContentPurchaseModal: vi.fn()
    },
    gatedContentSelectors: {
      ...actual.gatedContentSelectors,
      getGatedContentStatusMap: vi.fn().mockReturnValue({}),
      getPremiumTrackStatus: vi.fn() // For special access types
    },
    chatActions: { // If "Message Artist" is an option
        ...actual.chatActions,
        createChat: vi.fn()
    }
  }
})

const { apiEndpoint } = developmentConfig.network
const currentUserId = 123 as ID
const otherUserId = 456 as ID
const artistIdForGating = 789 as ID

let testTrack = {
  track_id: 'track001' as ID,
  owner_id: 'user001' as ID,
  title: 'Epic Chillhop Beat',
  description: 'A super chill beat to relax and study to.',
  genre: 'Chillhop', // More specific genre
  mood: 'Relaxing', // More specific mood
  tags: 'lofi,chillhop,instrumental,study,beats', // More tags
  duration: 185, // Slightly different duration
  release_date: '2023-01-15T12:00:00Z',
  permalink: '/test-artist/epic-chillhop-beat',
  user: {
    id: 'user001' as ID,
    handle: 'test-artist',
    name: 'Test Artist',
    is_verified: true,
    artist_pick_track_id: null,
    bio: 'Bio of Test Artist',
    cover_photo: null,
    creator_node_endpoint: 'https://cn1.audius.com',
    current_user_followee_follow_count: 0,
    does_current_user_follow: false,
    followee_count: 10,
    follower_count: 20,
    handle_lc: 'test-artist',
    has_available_slot: false,
    is_deactivated: false,
    is_storage_v2: true,
    location: 'Test Location',
    name_lc: 'test artist',
    playlist_count: 2,
    profile_picture: null,
    repost_count: 3,
    track_count: 5,
    twitter_handle: null,
    instagram_handle: null,
    tiktok_handle: null,
    website: null,
    donation: null,
    blocknumber: 1000,
    wallet: '0x123',
    created_at: '2022-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
    cover_photo_sizes: null,
    profile_picture_sizes: null,
    metadata_multihash: 'Qm123',
    erc_wallet: '0x123',
    spl_wallet: 'abc',
    supported_user_id: 1,
    supporter_count: 5,
    supporting_count: 2
  },
  artwork: {
    [SquareSizes.SIZE_150_BY_150]: `${apiEndpoint}/artwork/track001/150x150.jpg`,
    [SquareSizes.SIZE_480_BY_480]: `${apiEndpoint}/artwork/track001/480x480.jpg`,
    [SquareSizes.SIZE_1000_BY_1000]: `${apiEndpoint}/artwork/track001/1000x1000.jpg`,
  },
  play_count: 1505, // Slightly different counts
  repost_count: 205,
  favorite_count: 105,
  comment_count: 18,
  is_unlisted: false,
  access: { stream: true, download: false },
  stream_conditions: null,
  comments_disabled: false,
  created_at: '2023-01-01T12:00:00Z',
  credits_splits: null,
  ddex_app: null,
  download: null,
  is_current: true,
  is_delete: false,
  is_invalid: false,
  is_premium: false,
  is_stream_gated: false,
  has_current_user_reposted: false,
  has_current_user_saved: false,
  license: 'All Rights Reserved', // Slightly different license
  release_id: null,
  field_visibility: {
    mood: true,
    tags: true,
    genre: true,
    share: true,
    play_count: true,
    remixes: true,
    description: true, // Added description visibility
    comments: true // Added comments visibility
  },
  followee_reposts: [],
  followee_saves: [],
  remix_of: null,
  route_id: 'track001', // Ensure this matches track_id for some internal logic
  stem_of: null,
  updated_at: '2023-01-16T12:00:00Z',
  user_id: 'user001' as ID,
  _co_sign: null,
  _cover_art_sizes: {
    [SquareSizes.SIZE_150_BY_150]: `${apiEndpoint}/artwork/track001/150x150.jpg`,
    [SquareSizes.SIZE_480_BY_480]: `${apiEndpoint}/artwork/track001/480x480.jpg`,
    [SquareSizes.SIZE_1000_BY_1000]: `${apiEndpoint}/artwork/track001/1000x1000.jpg`,
  },
  _artist_pick: false, // Added _artist_pick
  _blocked: false // Added _blocked
}

const testComments = [
  { comment_id: 'comment1', message: 'Great track!', user_id: 'user002' as ID, created_at: new Date().toISOString(), track_id: testTrack.track_id, user: { id: 'user002', name: 'Commenter1', handle: 'commenter1' } as any },
  { comment_id: 'comment2', message: 'Love this beat.', user_id: 'user003' as ID, created_at: new Date().toISOString(), track_id: testTrack.track_id, user: { id: 'user003', name: 'Commenter2', handle: 'commenter2' } as any }
]

const relatedTracks = [
  { ...testTrack, track_id: 'related002' as ID, title: 'Another Chill Beat', permalink: '/test-artist/another-chill-beat', user: { ...testTrack.user, handle: 'test-artist', name: 'Test Artist'} },
  { ...testTrack, track_id: 'related003' as ID, title: 'More Vibes', permalink: '/test-artist/more-vibes', user: { ...testTrack.user, handle: 'test-artist', name: 'Test Artist'} }
]

const server = setupServer(
  http.get(`${apiEndpoint}/v1/tracks/:trackId`, ({ params }) => {
    if (params.trackId === testTrack.track_id) {
      return HttpResponse.json({ data: testTrack })
    }
    return new HttpResponse(null, { status: 404 })
  }),
  http.get(`${apiEndpoint}/v1/full/tracks`, ({ request }) => {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    const handle = url.searchParams.get('handle')
    const slug = url.searchParams.get('slug')
    if (id === testTrack.track_id || (handle === testTrack.user.handle && slug && testTrack.permalink.endsWith(slug))) {
      return HttpResponse.json({ data: testTrack })
    }
    return new HttpResponse(null, { status: 404 })
  }),
  http.get(`${apiEndpoint}/v1/tracks/${testTrack.track_id}/comments`, () => {
    return HttpResponse.json({ data: testComments, count: testComments.length, total: testComments.length })
  }),
  http.get(`${apiEndpoint}/v1/tracks/${testTrack.track_id}/related`, () => {
    return HttpResponse.json({ data: relatedTracks })
  }),
  http.get(`${apiEndpoint}/v1/users/:userId`, ({ params }) => {
    if (params.userId === testTrack.user.id) {
        return HttpResponse.json({ data: testTrack.user })
    }
    return new HttpResponse(null, { status: 404 })
  }),
  // Favorite/Unfavorite
  http.post(`${apiEndpoint}/v1/tracks/${testTrack.track_id}/favorite`, async ({request}) => {
    testTrack = { ...testTrack, has_current_user_saved: true, favorite_count: testTrack.favorite_count + 1 }
    return HttpResponse.json({})
  }),
  http.delete(`${apiEndpoint}/v1/tracks/${testTrack.track_id}/favorite`, async ({request}) => {
    testTrack = { ...testTrack, has_current_user_saved: false, favorite_count: testTrack.favorite_count - 1 }
    return HttpResponse.json({})
  }),
  // Repost/Unrepost
  http.post(`${apiEndpoint}/v1/tracks/${testTrack.track_id}/repost`, async ({request}) => {
    testTrack = { ...testTrack, has_current_user_reposted: true, repost_count: testTrack.repost_count + 1 }
    return HttpResponse.json({})
  }),
  http.delete(`${apiEndpoint}/v1/tracks/${testTrack.track_id}/repost`, async ({request}) => {
    testTrack = { ...testTrack, has_current_user_reposted: false, repost_count: testTrack.repost_count - 1 }
    return HttpResponse.json({})
  }),
  // Post Comment
  http.post(`${apiEndpoint}/v1/tracks/${testTrack.track_id}/comments`, async ({ request }) => {
    const body = await request.json() as any;
    const newComment = { comment_id: `comment${testComments.length + 1}`, message: body.message, user_id: currentUserId, created_at: new Date().toISOString(), track_id: testTrack.track_id, user: { id: currentUserId, name: 'Current User', handle: 'currentuser' } as any }
    testComments.push(newComment)
    return HttpResponse.json({ data: newComment })
  }),
  http.get('*', () => passthrough())
)

const renderDesktopTrackPage = (initialTrackState = testTrack) => {
  testTrack = { ...initialTrackState } // Reset track state for each render
  // @ts-ignore
  accountSelectors.getUserId.mockReturnValue(currentUserId)
  // @ts-ignore
  accountSelectors.getAccountUser.mockReturnValue({ id: currentUserId, name: 'Current User', handle: 'currentuser', /* other user props */ })
  // @ts-ignore
  accountSelectors.getAccountStatus.mockReturnValue('success')
  // @ts-ignore
  playerSelectors.getTrackId.mockReturnValue(testTrack.track_id) // Assume current track is loaded for play/pause tests
  // @ts-ignore
  playerSelectors.getUid.mockReturnValue(makeUid(PlaybackSource.TRACK_PAGE, testTrack.track_id))


  const store = testStore()
  // Example: store.dispatch(fetchTrackSucceeded({ trackData: initialTrackState }))

  return render(
    <MemoryRouter initialEntries={[initialTrackState.permalink]}>
      <Routes>
        <Route path="/:handle/:slug" element={<TrackPage />} />
        <Route path="/:handle" element={<Text>User Page for {initialTrackState.user.handle}</Text>} />
         {/* Mock ShareModal and AddToPlaylistModal routes if they are separate pages/components */}
        <Route path="/share/:type/:id" element={<Text>Share Modal</Text>} />
        <Route path="/addtoplaylist/:id" element={<Text>Add To Playlist Modal</Text>} />
      </Routes>
    </MemoryRouter>,
    { store }
  )
}

describe('Desktop TrackPage', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' })) // Changed to error to catch unhandled requests
  afterEach(() => {
    server.resetHandlers()
    vi.clearAllMocks()
    // Reset track data to its original state before each test if modified by interactions
    testTrack = {
      track_id: 'track001' as ID,
      owner_id: 'user001' as ID,
      title: 'Epic Chillhop Beat',
      description: 'A super chill beat to relax and study to.',
      genre: 'Chillhop',
      mood: 'Relaxing',
      tags: 'lofi,chillhop,instrumental,study,beats',
      duration: 185,
      release_date: '2023-01-15T12:00:00Z',
      permalink: '/test-artist/epic-chillhop-beat',
      user: { /* ... full user object from above ... */
        id: 'user001' as ID, handle: 'test-artist', name: 'Test Artist', is_verified: true, artist_pick_track_id: null, bio: 'Bio of Test Artist', cover_photo: null, creator_node_endpoint: 'https://cn1.audius.com', current_user_followee_follow_count: 0, does_current_user_follow: false, followee_count: 10, follower_count: 20, handle_lc: 'test-artist', has_available_slot: false, is_deactivated: false, is_storage_v2: true, location: 'Test Location', name_lc: 'test artist', playlist_count: 2, profile_picture: null, repost_count: 3, track_count: 5, twitter_handle: null, instagram_handle: null, tiktok_handle: null, website: null, donation: null, blocknumber: 1000, wallet: '0x123', created_at: '2022-01-01T00:00:00Z', updated_at: '2023-01-01T00:00:00Z', cover_photo_sizes: null, profile_picture_sizes: null, metadata_multihash: 'Qm123', erc_wallet: '0x123', spl_wallet: 'abc', supported_user_id: 1, supporter_count: 5, supporting_count: 2
      },
      artwork: { /* ... artwork object ... */
        [SquareSizes.SIZE_150_BY_150]: `${apiEndpoint}/artwork/track001/150x150.jpg`, [SquareSizes.SIZE_480_BY_480]: `${apiEndpoint}/artwork/track001/480x480.jpg`, [SquareSizes.SIZE_1000_BY_1000]: `${apiEndpoint}/artwork/track001/1000x1000.jpg`,
      },
      play_count: 1505, repost_count: 205, favorite_count: 105, comment_count: 18, is_unlisted: false, access: { stream: true, download: false }, stream_conditions: null, comments_disabled: false, created_at: '2023-01-01T12:00:00Z', credits_splits: null, ddex_app: null, download: null, is_current: true, is_delete: false, is_invalid: false, is_premium: false, is_stream_gated: false, has_current_user_reposted: false, has_current_user_saved: false, license: 'All Rights Reserved', release_id: null, field_visibility: { mood: true, tags: true, genre: true, share: true, play_count: true, remixes: true, description: true, comments: true }, followee_reposts: [], followee_saves: [], remix_of: null, route_id: 'track001', stem_of: null, updated_at: '2023-01-16T12:00:00Z', user_id: 'user001' as ID, _co_sign: null, _cover_art_sizes: { /* ... cover art sizes ... */ [SquareSizes.SIZE_150_BY_150]: `${apiEndpoint}/artwork/track001/150x150.jpg`, [SquareSizes.SIZE_480_BY_480]: `${apiEndpoint}/artwork/track001/480x480.jpg`, [SquareSizes.SIZE_1000_BY_1000]: `${apiEndpoint}/artwork/track001/1000x1000.jpg`,}, _artist_pick: false, _blocked: false
    }
  })
  afterAll(() => server.close())

  // Rendering tests from previous step (assumed to be here and passing)
  // describe('Standard Free Public Track Rendering', () => { ... })

  describe('Standard Free Public Track Interactions', () => {
    it('Play/Pause Button: toggles playback state and dispatches actions', async () => {
      const { user } = renderDesktopTrackPage()
      // @ts-ignore
      playerSelectors.getPlaying.mockReturnValue(false) // Start as not playing

      const playButton = await screen.findByRole('button', { name: /play track/i })
      await user.click(playButton)

      expect(playerActions.play).toHaveBeenCalledWith({ uid: makeUid(PlaybackSource.TRACK_PAGE, testTrack.track_id, expect.any(String)), trackId: testTrack.track_id, onEnd: expect.any(Function) })
      // @ts-ignore
      playerSelectors.getPlaying.mockReturnValue(true) // Simulate player state change
      // Re-render or update component state if necessary for UI to change to Pause
      // For this test, we assume the button label/icon changes based on playerSelectors.getPlaying()

      const pauseButton = await screen.findByRole('button', { name: /pause track/i }) // Or check for IconPause
      await user.click(pauseButton)
      expect(playerActions.pause).toHaveBeenCalled()
      // @ts-ignore
      playerSelectors.getPlaying.mockReturnValue(false) // Simulate player state change back
    })

    it('Favorite/Unfavorite Button: toggles favorite state, updates UI, and calls API', async () => {
      const { user } = renderDesktopTrackPage({ ...testTrack, has_current_user_saved: false, favorite_count: 105 })
      const initialFavoriteCount = testTrack.favorite_count // 105

      const favoriteButton = await screen.findByRole('button', { name: /favorite track/i }) // Or specific icon aria-label
      await user.click(favoriteButton)

      expect(tracksSocialActions.saveTrack).toHaveBeenCalledWith(testTrack.track_id, FavoriteSource.TRACK_PAGE)
      // Wait for MSW to update track state and UI to reflect change (optimistic or after API)
      await waitFor(async () => {
        expect(await screen.findByRole('button', { name: /unfavorite track/i })).toBeInTheDocument() // Icon change
        expect(await screen.findByText((initialFavoriteCount + 1).toString())).toBeInTheDocument() // Count update
      })

      const unfavoriteButton = await screen.findByRole('button', { name: /unfavorite track/i })
      await user.click(unfavoriteButton)

      expect(tracksSocialActions.unsaveTrack).toHaveBeenCalledWith(testTrack.track_id, FavoriteSource.TRACK_PAGE)
      await waitFor(async () => {
        expect(await screen.findByRole('button', { name: /favorite track/i })).toBeInTheDocument()
        expect(await screen.findByText(initialFavoriteCount.toString())).toBeInTheDocument()
      })
    })

    it('Repost/Unrepost Button: toggles repost state, updates UI, and calls API', async () => {
        const { user } = renderDesktopTrackPage({ ...testTrack, has_current_user_reposted: false, repost_count: 205 })
        const initialRepostCount = testTrack.repost_count // 205

        const repostButton = await screen.findByRole('button', { name: /repost track/i })
        await user.click(repostButton)

        expect(tracksSocialActions.repostTrack).toHaveBeenCalledWith(testTrack.track_id, RepostSource.TRACK_PAGE)
        await waitFor(async () => {
            expect(await screen.findByRole('button', { name: /unrepost track/i })).toBeInTheDocument()
            expect(await screen.findByText((initialRepostCount + 1).toString())).toBeInTheDocument()
        })

        const unrepostButton = await screen.findByRole('button', { name: /unrepost track/i })
        await user.click(unrepostButton)

        expect(tracksSocialActions.undoRepostTrack).toHaveBeenCalledWith(testTrack.track_id, RepostSource.TRACK_PAGE)
        await waitFor(async () => {
            expect(await screen.findByRole('button', { name: /repost track/i })).toBeInTheDocument()
            expect(await screen.findByText(initialRepostCount.toString())).toBeInTheDocument()
        })
    })

    it('Share Button: opens share modal', async () => {
      const { user } = renderDesktopTrackPage()
      const shareButton = await screen.findByRole('button', { name: /share track/i })
      await user.click(shareButton)
      expect(uiActions.openShareModal).toHaveBeenCalledWith({ type: 'track', trackId: testTrack.track_id, source: ShareSource.PAGE })
      // Optional: Check for modal appearance if not routing to a new page
      // expect(await screen.findByRole('dialog', { name: /share modal/i })).toBeInTheDocument()
    })

    it('Add to Playlist Button: opens add to playlist modal', async () => {
      const { user } = renderDesktopTrackPage()
      const addToPlaylistButton = await screen.findByRole('button', { name: /add to playlist/i })
      await user.click(addToPlaylistButton)
      expect(uiActions.openAddToPlaylistModal).toHaveBeenCalledWith(testTrack.track_id, expect.any(String)) // Source might be TRACK_PAGE or similar
      // Optional: Check for modal appearance
      // expect(await screen.findByRole('dialog', { name: /add to playlist/i })).toBeInTheDocument()
    })

    it('Overflow Menu Button: opens overflow menu with relevant options', async () => {
      const { user } = renderDesktopTrackPage() // Assuming current user is NOT the track owner
      const overflowButton = await screen.findByRole('button', { name: /more actions/i }) // Or just "More"
      await user.click(overflowButton)

      // Check for menu appearance
      const menu = await screen.findByRole('menu') // Or a more specific accessible name
      expect(menu).toBeInTheDocument()

      // Check for common options for non-owner
      // Note: "Add to Playlist" might be here if not a top-level button, adjust as per actual UI
      // expect(await within(menu).findByText(/add to playlist/i)).toBeInTheDocument()
      expect(await within(menu).findByText(/view artist page/i)).toBeInTheDocument()
      // Add more checks as per actual menu items (e.g., report, etc.)
    })

    it('Comment Interaction: posts a comment and calls API', async () => {
      const { user } = renderDesktopTrackPage()
      const commentText = 'This is a test comment!'
      const commentInput = await screen.findByPlaceholderText(/write a comment/i) // Adjust placeholder as needed
      const submitButton = await screen.findByRole('button', { name: /post comment/i }) // Or an icon button

      await user.type(commentInput, commentText)
      await user.click(submitButton)

      // Check that the API was called with the correct data
      // The MSW handler for POST comments is already set up.
      // We can verify by checking if the new comment appears in the list (if UI updates optimistically or refetches)
      // Or by directly checking if the POST handler was called (more complex with MSW, easier with spies on fetch if not using MSW)
      await waitFor(async () => {
        expect(await screen.findByText(commentText)).toBeInTheDocument() // Assuming optimistic update or refetch
      })
      // Verify the recordListen action was not called for just commenting
      expect(playbackPositionActions.recordListen).not.toHaveBeenCalled()
    })
  })
})

// Helper to get elements within a specific scope, useful for menus
const within = (element: HTMLElement) => ({
  findByText: (textMatch: string | RegExp, options?: any) =>
    screen.findByText((content, node) => {
      const hasText = (node: Element) => node.textContent === textMatch || (textMatch instanceof RegExp && textMatch.test(node.textContent || ''));
      const nodeHasText = hasText(node);
      const childrenDontHaveText = Array.from(node.children).every(
        (child) => !hasText(child)
      );
      return nodeHasText && childrenDontHaveText;
    }, { container: element, ...options }),
});
