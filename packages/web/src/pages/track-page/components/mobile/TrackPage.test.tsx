import { SquareSizes, ID, FavoriteSource, RepostSource, ShareSource, PlaybackSource, Name, PremiumConditions, AccessConditions, User } from '@audius/common/models'
import { playerActions, tracksSocialActions, usersSocialActions, uiActions, accountSelectors, playerSelectors, playbackPositionActions, premiumContentActions, gatedContentSelectors, PurchaseableContentType, usersSelectors, chatActions, mobileOverflowMenuUIActions, relatedTracksActions } from '@audius/common/store'
import { Nullable, makeUid } from '@audius/common/utils'
import { Text, IconPlay, IconPause, IconHeart, IconRepost, IconShare, IconPencil, IconTrash, IconFollow, IconTip, IconKebabHorizontal, IconLock } from '@audius/harmony' // Added IconKebabHorizontal
import { developmentConfig } from '@audius/sdk'
import { fireEvent } from '@testing-library/react'
import { http, HttpResponse, passthrough, delay } from 'msw'
// Removed CollectibleDetailsPage as it's less likely to be directly rendered in mobile page test
// import { CollectibleDetailsPage } from 'pages/collectible-details-page/CollectibleDetailsPage'
import { setupServer } from 'msw/node'
import { MemoryRouter, Routes, Route, Link, useLocation } from 'react-router-dom-v5-compat'
import { describe, it, expect, vi, beforeAll, afterEach, afterAll, beforeEach } from 'vitest'

import { render, screen, testStore, waitFor, userEvent } from 'test/test-utils'

import { TrackPage as MobileTrackPage } from './TrackPage' // Assuming mobile TrackPage is in this path

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
    usersSocialActions: {
        ...actual.usersSocialActions,
        followUser: vi.fn(),
        unfollowUser: vi.fn()
    },
    usersSelectors: {
        ...actual.usersSelectors,
        getFollowingStatus: vi.fn().mockReturnValue(false)
    },
    uiActions: { // Desktop modals
      ...actual.uiActions,
      showModal: vi.fn(),
      hideModal: vi.fn(),
      setLoading: vi.fn(),
      openAddToPlaylistModal: vi.fn(), // This might be replaced by mobile specific action
      openEditTrackModal: vi.fn(),
      openShareModal: vi.fn(), // This might be replaced by mobile specific action
      openTipModal: vi.fn()
    },
    mobileOverflowMenuUIActions: { // Mobile specific actions
        ...actual.mobileOverflowMenuUIActions,
        requestOpen: vi.fn()
    },
    relatedTracksActions: { // For fetching related tracks
        ...actual.relatedTracksActions,
        fetchRelatedTracks: vi.fn()
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
      getPremiumTrackStatus: vi.fn()
    },
    chatActions: {
        ...actual.chatActions,
        createChat: vi.fn()
    }
  }
})

const { apiEndpoint } = developmentConfig.network
const currentUserId = 123 as ID
const otherUserId = 456 as ID
const artistIdForGating = 789 as ID

// Base Test Track (can be spread and overridden for variants)
let testTrack = {
  track_id: 'track001' as ID,
  owner_id: 'user001' as ID,
  title: 'Mobile Chillhop Beat',
  description: 'A super chill beat for mobile listening.',
  genre: 'Chillhop',
  mood: 'Relaxing',
  tags: 'lofi,chillhop,mobile,beats',
  duration: 185,
  release_date: '2023-01-15T12:00:00Z',
  permalink: '/test-artist/mobile-chillhop-beat',
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
  play_count: 1505,
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
  license: 'All Rights Reserved',
  release_id: null,
  field_visibility: { mood: true, tags: true, genre: true, share: true, play_count: true, remixes: true, description: true, comments: true },
  followee_reposts: [],
  followee_saves: [],
  remix_of: null,
  route_id: 'track001',
  stem_of: null,
  updated_at: '2023-01-16T12:00:00Z',
  user_id: 'user001' as ID,
  _co_sign: null,
  _cover_art_sizes: {
    [SquareSizes.SIZE_150_BY_150]: `${apiEndpoint}/artwork/track001/150x150.jpg`,
    [SquareSizes.SIZE_480_BY_480]: `${apiEndpoint}/artwork/track001/480x480.jpg`,
    [SquareSizes.SIZE_1000_BY_1000]: `${apiEndpoint}/artwork/track001/1000x1000.jpg`,
  },
  _artist_pick: false,
  _blocked: false
}

const testComments = [
  { comment_id: 'comment1', message: 'Great mobile track!', user_id: 'user002' as ID, created_at: new Date().toISOString(), track_id: testTrack.track_id, user: { id: 'user002', name: 'Commenter1', handle: 'commenter1' } as any },
  { comment_id: 'comment2', message: 'Love this beat on the go.', user_id: 'user003' as ID, created_at: new Date().toISOString(), track_id: testTrack.track_id, user: { id: 'user003', name: 'Commenter2', handle: 'commenter2' } as any }
]

const relatedTracks = [
  { ...testTrack, track_id: 'relatedMobile002' as ID, title: 'Another Mobile Beat', permalink: '/test-artist/another-mobile-beat', user: { ...testTrack.user, handle: 'test-artist', name: 'Test Artist'} },
  { ...testTrack, track_id: 'relatedMobile003' as ID, title: 'More Mobile Vibes', permalink: '/test-artist/more-mobile-vibes', user: { ...testTrack.user, handle: 'test-artist', name: 'Test Artist'} }
]

// Premium Track Variants (adapted for mobile context if necessary, usually data is the same)
const testPremiumTrackLocked = { ...testTrack, track_id: 'premiumMobile001' as ID, owner_id: otherUserId, title: 'Locked Mobile Premium', permalink: '/other-artist/locked-mobile-premium', user: { ...testTrack.user, id: otherUserId, handle: 'other-artist', name: 'Other Artist' }, is_premium: true, premium_conditions: { usdc_purchase: { price: 100, splits: {} } } as unknown as PremiumConditions, access: { stream: false, download: false }, has_current_user_purchased: false, preview_cid: 'previewCIDMobile123', preview_start_seconds: 10 }
const testPremiumTrackUnlocked = { ...testPremiumTrackLocked, track_id: 'premiumMobile002' as ID, title: 'Unlocked Mobile Premium', permalink: '/other-artist/unlocked-mobile-premium', access: { stream: true, download: false }, has_current_user_purchased: true }
const testPremiumTrackOwned = { ...testTrack, track_id: 'premiumMobile003' as ID, owner_id: currentUserId, title: 'Owned Mobile Premium', permalink: `/${testTrack.user.handle}/owned-mobile-premium`, user: { ...testTrack.user, id: currentUserId }, is_premium: true, premium_conditions: { usdc_purchase: { price: 200, splits: {} } } as unknown as PremiumConditions, access: { stream: true, download: false }, has_current_user_purchased: false }

// Special Access Track Variants (adapted for mobile context)
const gatedArtist = { ...testTrack.user, id: artistIdForGating, handle: 'gated-artist', name: 'Gated Artist' } as User
const testFollowGatedTrack = { ...testTrack, track_id: 'followGatedMobile001' as ID, owner_id: artistIdForGating, title: 'Follow-Gated Mobile Track', permalink: '/gated-artist/follow-gated-mobile-track', user: gatedArtist, is_premium: false, premium_conditions: { follow_user_id: artistIdForGating } as unknown as PremiumConditions, access: { stream: false, download: false }, preview_cid: 'previewFollowCIDMobile', preview_start_seconds: 5 }
const testTipGatedTrack = { ...testTrack, track_id: 'tipGatedMobile001' as ID, owner_id: artistIdForGating, title: 'Tip-Gated Mobile Track', permalink: '/gated-artist/tip-gated-mobile-track', user: gatedArtist, is_premium: false, premium_conditions: { tip_user_id: artistIdForGating } as unknown as PremiumConditions, access: { stream: false, download: false }, preview_cid: 'previewTipCIDMobile' }
const testCollectibleGatedTrack = { ...testTrack, track_id: 'collectibleGatedMobile001' as ID, owner_id: artistIdForGating, title: 'Collectible-Gated Mobile Track', permalink: '/gated-artist/collectible-gated-mobile-track', user: gatedArtist, is_premium: false, premium_conditions: { nft_collection: { chain: 'eth', standard: 'ERC721', slug: 'test-collection-mobile', name: 'Test NFT Mobile Collection', imageUrl: 'img.url.mobile', externalLink: 'ext.link.mobile' } } as unknown as PremiumConditions, access: { stream: false, download: false } }


const server = setupServer(
  // Generic handler for all track fetches - ensures variants are returned
  http.get(`${apiEndpoint}/v1/full/tracks`, ({ request }) => {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    const handle = url.searchParams.get('handle')
    const slug = url.searchParams.get('slug')

    const tracks = [testTrack, testPremiumTrackLocked, testPremiumTrackUnlocked, testPremiumTrackOwned, testFollowGatedTrack, testTipGatedTrack, testCollectibleGatedTrack]
    const foundTrack = tracks.find(t => t.track_id.toString() === id || (t.user.handle === handle && slug && t.permalink.endsWith(slug)))

    if (foundTrack) return HttpResponse.json({ data: foundTrack })
    return new HttpResponse(null, { status: 404 })
  }),
  // Simplified comments and related tracks for mobile tests - can expand if needed
  http.get(`${apiEndpoint}/v1/tracks/:trackId/comments`, () => {
    return HttpResponse.json({ data: testComments, count: testComments.length, total: testComments.length })
  }),
  http.get(`${apiEndpoint}/v1/tracks/:trackId/related`, () => {
    return HttpResponse.json({ data: relatedTracks }) // Assuming related tracks are similar for mobile
  }),
  http.get(`${apiEndpoint}/v1/users/:userId`, ({ params }) => {
    const users = [testTrack.user, otherUserId, gatedArtist, currentUserId] // Add all relevant users
    const foundUser = users.find(u => typeof u === 'object' ? u.id.toString() === params.userId : u.toString() === params.userId)
    if (foundUser && typeof foundUser === 'object') return HttpResponse.json({ data: foundUser })
    if (params.userId === currentUserId.toString()) return HttpResponse.json({ data: {id: currentUserId, handle: 'currentUser', name: 'Current User'} }) // Fallback for current user
    return new HttpResponse(null, { status: 404 })
  }),
  // Social actions (favorite, repost, comment, delete, follow) - these are largely the same as desktop
  http.post(`${apiEndpoint}/v1/tracks/:trackId/favorite`, () => HttpResponse.json({})),
  http.delete(`${apiEndpoint}/v1/tracks/:trackId/favorite`, () => HttpResponse.json({})),
  http.post(`${apiEndpoint}/v1/tracks/:trackId/repost`, () => HttpResponse.json({})),
  http.delete(`${apiEndpoint}/v1/tracks/:trackId/repost`, () => HttpResponse.json({})),
  http.post(`${apiEndpoint}/v1/tracks/:trackId/comments`, async ({ request }) => {
    const body = await request.json() as any;
    const newComment = { comment_id: `comment${testComments.length + 1}`, message: body.message, user_id: currentUserId, created_at: new Date().toISOString(), track_id: body.track_id, user: { id: currentUserId, name: 'Current User', handle: 'currentuser' } as any }
    testComments.push(newComment)
    return HttpResponse.json({ data: newComment })
  }),
  http.delete(`${apiEndpoint}/v1/tracks/:trackId`, () => HttpResponse.json({})),
  http.post(`${apiEndpoint}/v1/users/:userId/follow`, () => HttpResponse.json({})),
  http.delete(`${apiEndpoint}/v1/users/:userId/follow`, () => HttpResponse.json({})),
  http.get('*', () => passthrough())
)

const renderMobileTrackPage = (
    trackToRender = testTrack,
    currentLoggedInUserId = currentUserId,
    purchasedContentMap = {},
    isFollowingArtist = false,
    gatedTrackStatusOverrides = {}
) => {
  // @ts-ignore
  accountSelectors.getUserId.mockReturnValue(currentLoggedInUserId)
  // @ts-ignore
  accountSelectors.getAccountUser.mockReturnValue({ id: currentLoggedInUserId, name: 'Current User', handle: 'currentuser' })
  // @ts-ignore
  accountSelectors.getAccountStatus.mockReturnValue('success')
  // @ts-ignore
  playerSelectors.getTrackId.mockReturnValue(trackToRender.track_id)
  // @ts-ignore
  playerSelectors.getUid.mockReturnValue(makeUid(PlaybackSource.TRACK_PAGE, trackToRender.track_id))
  // @ts-ignore
  gatedContentSelectors.getGatedContentStatusMap.mockReturnValue(purchasedContentMap)
  // @ts-ignore
  usersSelectors.getFollowingStatus.mockImplementation((state: any, userId: ID) => userId === artistIdForGating ? isFollowingArtist : false)
  // @ts-ignore
  gatedContentSelectors.getPremiumTrackStatus.mockImplementation((state: any, trackId: ID) => gatedTrackStatusOverrides[trackId] ?? null)

  const store = testStore()
  const MockEditPage = () => <Text>Edit Page for Mobile</Text>
  const MockCollectiblePage = () => <Text>Mobile Collectible Details Page</Text>

  return render(
    <MemoryRouter initialEntries={[trackToRender.permalink]}>
      <Routes>
        <Route path="/:handle/:slug" element={<MobileTrackPage />} />
        <Route path="/:handle" element={<Text>User Page for {trackToRender.user.handle}</Text>} />
        <Route path="/users/:handle/nft-collections/:collectibleId" element={<MockCollectiblePage />} />
        <Route path="/tracks/:trackId/edit" element={<MockEditPage />} />
        {/* Mobile might use different routes/modals for share, add to playlist */}
      </Routes>
    </MemoryRouter>,
    { store }
  )
}

describe('Mobile TrackPage', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
  afterEach(() => {
    server.resetHandlers()
    vi.clearAllMocks()
    // Reset base testTrack to its original state for safety, though specific tests should use their own variants
    testTrack = { ...testTrack, owner_id: 'user001', user: { ...testTrack.user, id: 'user001' } } // Simplified reset
  })
  afterAll(() => server.close())

  describe('Standard Free Public Track (Mobile)', () => {
    beforeEach(() => {
      renderMobileTrackPage(testTrack)
    })

    it('renders mobile track header with title, artist, and artwork', async () => {
      // TrackHeader typically contains title, artist, and artwork image
      expect(await screen.findByText(testTrack.title)).toBeInTheDocument()
      expect(await screen.findByText(testTrack.user.name)).toBeInTheDocument()
      // Artwork might be identifiable by testId or alt text if TrackHeader is structured that way
      const artworkImages = screen.getAllByRole('img') // Mobile might have multiple images (e.g. user avatar + track art)
      expect(artworkImages.some(img => img.getAttribute('src')?.includes('artwork/track001'))).toBe(true)
    })

    it('renders description', async () => {
      expect(await screen.findByText(testTrack.description)).toBeInTheDocument()
    })

    it('renders action button row (Favorite, Repost, Share, Overflow)', async () => {
      // These buttons are typically in ActionButtonRow or similar mobile component
      expect(await screen.findByRole('button', { name: /favorite/i })).toBeInTheDocument()
      expect(await screen.findByRole('button', { name: /repost/i })).toBeInTheDocument()
      expect(await screen.findByRole('button', { name: /share/i })).toBeInTheDocument()
      expect(await screen.findByRole('button', { name: /more actions/i })).toBeInTheDocument() // Or IconKebabHorizontal
      // Add to Playlist might be in Overflow menu on mobile
    })
    
    it('renders stats button row (Plays, Favorites, Reposts)', async () => {
        // StatsButtonRow or similar component
        expect(await screen.findByText(testTrack.play_count.toString())).toBeInTheDocument()
        // Favorite/Repost counts are often displayed next to their respective buttons in ActionButtonRow
        // or separately in a StatsButtonRow. Adjust based on actual mobile layout.
        // Example for separate StatsButtonRow:
        // expect(await screen.findByText(testTrack.favorite_count.toString(), { selector: 'button *' })).toBeInTheDocument()
        // expect(await screen.findByText(testTrack.repost_count.toString(), { selector: 'button *' })).toBeInTheDocument()
    })


    it('Play/Pause Button: toggles playback', async () => {
      const { user } = renderMobileTrackPage(testTrack)
      // @ts-ignore
      playerSelectors.getPlaying.mockReturnValue(false)
      const playButton = await screen.findByRole('button', { name: /play/i }) // Mobile might have a central play button
      await user.click(playButton)
      expect(playerActions.play).toHaveBeenCalled()
      // @ts-ignore
      playerSelectors.getPlaying.mockReturnValue(true)
      // Re-render or wait for UI update if button changes
      const pauseButton = await screen.findByRole('button', { name: /pause/i })
      await user.click(pauseButton)
      expect(playerActions.pause).toHaveBeenCalled()
    })
    
    it('Overflow Menu: opens mobile overflow menu with relevant options', async () => {
        const { user } = renderMobileTrackPage(testTrack, currentUserId)
        const overflowButton = await screen.findByRole('button', { name: /more actions/i })
        await user.click(overflowButton)
        // Mobile overflow menu is often a Redux action opening a bottom sheet/modal
        expect(mobileOverflowMenuUIActions.requestOpen).toHaveBeenCalledWith(
            expect.objectContaining({ id: testTrack.track_id })
        )
    })


    it('renders comments and related tracks sections', async () => {
      expect(await screen.findByText(/comments/i)).toBeInTheDocument() // Or a specific comment
      expect(await screen.findByText(testComments[0].message)).toBeInTheDocument()
      expect(await screen.findByText(/related tracks/i)).toBeInTheDocument() // Or a related track title
      expect(await screen.findByText(relatedTracks[0].title)).toBeInTheDocument()
    })
  })

  // Premium Track Variant Tests (Mobile) - Adapting desktop tests
  describe('Premium Track Variants (Mobile)', () => {
    describe('Locked Premium Track (Not Purchased, Not Owned)', () => {
      it('UI: shows premium badge, lock icon, and purchase button', async () => {
        renderMobileTrackPage(testPremiumTrackLocked, currentUserId, {})
        expect(await screen.findByText(/premium/i)).toBeInTheDocument()
        // Mobile specific CTA might be different, e.g. a banner or button in ActionButtonRow
        expect(await screen.findByRole('button', { name: /unlock track/i })).toBeInTheDocument()
      })
      it('Playback: restricted to preview', async () => {
        const { user } = renderMobileTrackPage(testPremiumTrackLocked, currentUserId, {})
        const previewButton = await screen.findByRole('button', { name: /preview/i })
        await user.click(previewButton)
        expect(playerActions.play).toHaveBeenCalledWith(expect.objectContaining({ trackId: testPremiumTrackLocked.track_id, preview: true }))
      })
      it('Purchase Action: opens purchase modal', async () => {
        const { user } = renderMobileTrackPage(testPremiumTrackLocked, currentUserId, {})
        const purchaseButton = await screen.findByRole('button', { name: /unlock track/i })
        await user.click(purchaseButton)
        expect(premiumContentActions.openPremiumContentPurchaseModal).toHaveBeenCalledWith(expect.objectContaining({ contentId: testPremiumTrackLocked.track_id }))
      })
    })

    describe('Unlocked Premium Track (Purchased, Not Owned)', () => {
        beforeEach(() => {
            const purchasedMap = { [testPremiumTrackUnlocked.track_id]: { is_gated: true, access: AccessConditions.STREAM } }
            renderMobileTrackPage(testPremiumTrackUnlocked, currentUserId, purchasedMap)
        })
        it('UI: shows purchased state, no unlock CTA', async () => {
            expect(await screen.findByText(/purchased/i)).toBeInTheDocument()
            expect(screen.queryByRole('button', { name: /unlock track/i })).not.toBeInTheDocument()
        })
        it('Playback: allows full playback', async () => {
            const { user } = renderMobileTrackPage(testPremiumTrackUnlocked, currentUserId, { [testPremiumTrackUnlocked.track_id]: { is_gated: true, access: AccessConditions.STREAM } })
            const playButton = await screen.findByRole('button', { name: /play/i })
            await user.click(playButton)
            expect(playerActions.play).toHaveBeenCalledWith(expect.objectContaining({ trackId: testPremiumTrackUnlocked.track_id, preview: undefined }))
        })
    })
    
    describe('Owned Premium Track (Owned by Current User)', () => {
        beforeEach(() => {
            renderMobileTrackPage(testPremiumTrackOwned, currentUserId)
        })
        it('UI: no premium/locked/purchased badges for owner', () => {
            expect(screen.queryByText(/premium/i)).not.toBeInTheDocument()
            expect(screen.queryByText(/purchased/i)).not.toBeInTheDocument()
            expect(screen.queryByRole('button', { name: /unlock track/i })).not.toBeInTheDocument()
        })
        it('Owner Actions: Edit/Delete in overflow menu', async () => {
            const { user } = renderMobileTrackPage(testPremiumTrackOwned, currentUserId)
            const overflowButton = await screen.findByRole('button', { name: /more actions/i })
            await user.click(overflowButton)
            // Check for overflow menu action being called, then inspect menu items if possible (depends on impl)
            expect(mobileOverflowMenuUIActions.requestOpen).toHaveBeenCalled()
            // Actual menu items would be checked in the overflow menu component's tests or by inspecting payload to requestOpen
        })
    })
  })

  // Special Access Track Variant Tests (Mobile) - Adapting desktop tests
  describe('Special Access Track Variants (Mobile)', () => {
    describe('Follow-Gated Track', () => {
        describe('Locked State (Not Following Artist)', () => {
            beforeEach(() => {
                renderMobileTrackPage(testFollowGatedTrack, currentUserId, {}, false)
            })
            it('UI: shows "Follow to Unlock" CTA and preview', async () => {
                expect(await screen.findByRole('button', { name: /follow to unlock/i })).toBeInTheDocument()
                expect(await screen.findByRole('button', { name: /preview/i })).toBeInTheDocument()
            })
            it('Action: "Follow to Unlock" dispatches follow action', async () => {
                const { user } = renderMobileTrackPage(testFollowGatedTrack, currentUserId, {}, false)
                const followButton = await screen.findByRole('button', { name: /follow to unlock/i })
                await user.click(followButton)
                expect(usersSocialActions.followUser).toHaveBeenCalledWith(artistIdForGating, expect.any(String))
            })
        })
        describe('Unlocked State (Following)', () => {
            beforeEach(() => {
                renderMobileTrackPage({ ...testFollowGatedTrack, access: { stream: true } }, currentUserId, {}, true)
            })
            it('UI: no follow gate CTA, full play button', async () => {
                expect(screen.queryByRole('button', { name: /follow to unlock/i })).not.toBeInTheDocument()
                expect(await screen.findByRole('button', { name: /play/i })).toBeInTheDocument()
            })
        })
    })
    describe('Tip-Gated Track', () => {
        describe('Locked State (Not Tipped)', () => {
            beforeEach(() => {
                renderMobileTrackPage(testTipGatedTrack, currentUserId, {}, false)
            })
            it('UI: shows "Tip to Unlock" CTA and preview', async () => {
                expect(await screen.findByRole('button', { name: /tip artist to unlock/i })).toBeInTheDocument()
                expect(await screen.findByRole('button', { name: /preview/i })).toBeInTheDocument()
            })
            it('Action: "Tip to Unlock" opens tip modal', async () => {
                const { user } = renderMobileTrackPage(testTipGatedTrack, currentUserId, {}, false)
                const tipButton = await screen.findByRole('button', { name: /tip artist to unlock/i })
                await user.click(tipButton)
                expect(uiActions.openTipModal).toHaveBeenCalledWith(expect.objectContaining({ userId: artistIdForGating, trackId: testTipGatedTrack.track_id }))
            })
        })
    })
    describe('Collectible-Gated Track', () => {
        describe('Locked State (No Collectible)', () => {
            beforeEach(() => {
                renderMobileTrackPage(testCollectibleGatedTrack, currentUserId, {}, false)
            })
            it('UI: shows "Collectible Gated" message and "View Collectible" button', async () => {
                expect(await screen.findByText(/collectible gated/i)).toBeInTheDocument()
                expect(await screen.findByRole('button', { name: /view collectible/i })).toBeInTheDocument()
            })
             it('Action: clicking "View Collectible" navigates to collectible details page', async () => {
                const { user } = renderMobileTrackPage(testCollectibleGatedTrack, currentUserId, {}, false)
                const viewCollectibleButton = await screen.findByRole('button', { name: /view collectible/i })
                await user.click(viewCollectibleButton)
                expect(await screen.findByText('Mobile Collectible Details Page')).toBeInTheDocument()
            })
        })
    })
  })
})

// Helper to get elements within a specific scope, useful for menus (might not be needed if mobile overflow is modal-based)
// const within = (element: HTMLElement) => ({ ... });
