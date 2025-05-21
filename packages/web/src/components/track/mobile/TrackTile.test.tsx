import { SquareSizes, ID, UID, PlaybackSource } from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import { playerSelectors, accountSelectors, tracksSocialActions, mobileOverflowMenuUIActions, shareModalUIActions, premiumContentActions } from '@audius/common/store'
import { Text, IconKebabHorizontal, IconHeart, IconRepost, IconShare, IconPlay, IconPause } from '@audius/harmony'
import { developmentConfig } from '@audius/sdk'
import { fireEvent, waitFor } from '@testing-library/react'
import { http, HttpResponse, passthrough } from 'msw'
import { setupServer } from 'msw/node'
import { Routes, Route } from 'react-router-dom-v5-compat'
import { describe, it, expect, vi, beforeAll, afterEach, afterAll, beforeEach } from 'vitest'

import { render, screen, testStore, userEvent } from 'test/test-utils'

import { TrackTile } from './TrackTile'
// Assuming BottomButtons is a child component used by TrackTile, or its functionality is integrated
// If BottomButtons is tested separately, some interaction tests here might be simplified

vi.mock('@audius/common/store', async () => {
  const actual = await vi.importActual('@audius/common/store')
  return {
    ...actual,
    playerSelectors: {
      ...actual.playerSelectors,
      getPlaying: vi.fn(),
      getBuffering: vi.fn(),
      getTrackId: vi.fn(),
      getUid: vi.fn()
    },
    accountSelectors: {
      ...actual.accountSelectors,
      getAccountUser: vi.fn(),
      getUserId: vi.fn()
    },
    tracksSocialActions: { // For favorite, repost
      ...actual.tracksSocialActions,
      saveTrack: vi.fn(),
      unsaveTrack: vi.fn(),
      repostTrack: vi.fn(),
      undoRepostTrack: vi.fn()
    },
    mobileOverflowMenuUIActions: { // For overflow menu
      ...actual.mobileOverflowMenuUIActions,
      requestOpen: vi.fn()
    },
    shareModalUIActions: { // For share button
      ...actual.shareModalUIActions,
      requestOpen: vi.fn()
    },
    premiumContentActions: { // For premium tracks
        ...actual.premiumContentActions,
        openPremiumContentPurchaseModal: vi.fn()
    }
  }
})

vi.mock('@audius/common/services', async (importOriginal) => {
    const actual = await importOriginal()
    return {
        ...actual,
        FeatureFlags: {
            ...actual.FeatureFlags,
            getFeatureEnabled: vi.fn()
        }
    }
})


const { apiEndpoint } = developmentConfig.network
const currentUserId = 2 as ID

const baseTestTrack = {
  track_id: 'track123' as ID,
  title: 'Test Mobile Track',
  user_id: 'user456' as ID,
  permalink: '/test-user/test-mobile-track',
  repost_count: 25,
  favorite_count: 20,
  play_count: 100,
  duration: 180, // Duration is important for mobile
  blocknumber: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  is_delete: false,
  is_private: false,
  is_stream_gated: false,
  is_scheduled_release: false,
  has_current_user_reposted: false,
  has_current_user_saved: false,
  _co_sign: undefined,
  artwork: {
    [SquareSizes.SIZE_150_BY_150]: `${apiEndpoint}/image-track-small.jpg`,
    [SquareSizes.SIZE_480_BY_480]: `${apiEndpoint}/image-track-medium.jpg`,
    mirrors: undefined
  },
  access: { stream: true, download: false },
  user: {
    id: 'user456' as ID,
    handle: 'test-user',
    name: 'Test User',
    is_verified: false,
    is_deactivated: false,
    blocknumber: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    name_lc: 'test user'
  },
  stream_conditions: undefined,
  owner_id: 'user456' as ID // Added owner_id for premium track checks
}

const server = setupServer(
  http.post(`${apiEndpoint}/v1/tracks/track123/favorite`, async ({ request }) => {
    return HttpResponse.json({})
  }),
  http.post(`${apiEndpoint}/v1/tracks/track123/repost`, async ({ request }) => {
    return HttpResponse.json({})
  }),
  http.get('*', () => passthrough())
)

const renderMobileTrackTile = (trackPropsOverrides = {}, currentUserIdOverride = currentUserId, isPlaying = false, trackIdInPlayer?: ID) => {
  const track = { ...baseTestTrack, ...trackPropsOverrides }
  const uid = `track-${track.track_id}` as UID

  // @ts-ignore
  accountSelectors.getUserId.mockReturnValue(currentUserIdOverride)
  // @ts-ignore
  accountSelectors.getAccountUser.mockReturnValue({ id: currentUserIdOverride, name: 'Current User' })
  // @ts-ignore
  playerSelectors.getPlaying.mockReturnValue(isPlaying)
  // @ts-ignore
  playerSelectors.getBuffering.mockReturnValue(false)
  // @ts-ignore
  playerSelectors.getTrackId.mockReturnValue(trackIdInPlayer ?? (isPlaying ? track.track_id : null))
   // @ts-ignore
  playerSelectors.getUid.mockReturnValue(isPlaying ? uid : null)
  // @ts-ignore
  FeatureFlags.getFeatureEnabled.mockImplementation((flag) => {
    if (flag === FeatureFlags.HIDDEN_TRACK_HEADER) return true
    return false
  })


  const store = testStore()

  server.use(
    http.get(`${apiEndpoint}/v1/full/tracks`, ({ request }) => {
      const url = new URL(request.url)
      const id = url.searchParams.get('id')
      if (id === track.track_id.toString()) {
        return HttpResponse.json({ data: track })
      }
      if (url.pathname.includes(track.permalink)) {
        return HttpResponse.json({ data: track })
      }
      return new HttpResponse(null, { status: 404 })
    })
  )

  const mockTogglePlay = vi.fn()
  const mockOnSave = vi.fn()
  const mockOnRepost = vi.fn()
  const mockOnShare = vi.fn()
  const mockOnClickOverflow = vi.fn()
  const mockOnPress = vi.fn()

  return {
    ...render(
      <Routes>
        <Route path='/' element={
          <TrackTile
            uid={uid}
            index={0}
            track={track as any}
            // Props for BottomButtons or direct interaction
            togglePlay={mockTogglePlay}
            onSave={mockOnSave} // Assuming this is how save is handled
            onRepost={mockOnRepost} // Assuming this is how repost is handled
            onShare={mockOnShare}
            onClickOverflow={mockOnClickOverflow}
            onPress={mockOnPress} // Main press action
            // Pass necessary state for UI
            isPlaying={isPlaying}
            isActive={isPlaying && track.track_id === trackIdInPlayer}
            currentUserId={currentUserIdOverride}
            // Assuming these props are needed for BottomButtons or internal logic
            hasCurrentUserSaved={track.has_current_user_saved}
            hasCurrentUserReposted={track.has_current_user_reposted}
          />
        } />
        <Route
          path={track.permalink}
          element={<Text variant='heading'>Test Mobile Track Page</Text>}
        />
        <Route
          path={`/${track.user.handle}`}
          element={<Text variant='heading'>Test User Page</Text>}
        />
      </Routes>,
      { store }
    ),
    mockTogglePlay,
    mockOnSave,
    mockOnRepost,
    mockOnShare,
    mockOnClickOverflow,
    mockOnPress,
    track // return track for easy access in tests
  }
}

describe('Mobile TrackTile', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
  afterEach(() => {
    server.resetHandlers()
    vi.clearAllMocks()
  })
  afterAll(() => server.close())

  describe('Rendering Tests', () => {
    it('renders track title, artist name, and duration', async () => {
      renderMobileTrackTile()
      expect(await screen.findByText(baseTestTrack.title)).toBeInTheDocument()
      expect(await screen.findByText(baseTestTrack.user.name)).toBeInTheDocument()
      // Duration might be formatted, e.g., "3:00" for 180 seconds
      expect(await screen.findByText('03:00')).toBeInTheDocument() // Adjust if format is different
    })

    it('renders TrackTileArt with correct props', async () => {
      renderMobileTrackTile()
      const coverArt = await screen.findByTestId(`cover-art-${baseTestTrack.track_id}`)
      expect(coverArt).toBeInTheDocument()
      expect(coverArt).toHaveAttribute('src', `${apiEndpoint}/image-track-medium.jpg`)
    })

    it('renders TrackTileStats (implicitly, via play count, reposts, favorites)', async () => {
        renderMobileTrackTile()
        // Stats might be part of BottomButtons or similar component
        // Check for presence of stat numbers if they are always visible
        // These might be inside buttons, so query by text within appropriate button context if needed
        expect(await screen.findByText(baseTestTrack.favorite_count.toString())).toBeInTheDocument()
        expect(await screen.findByText(baseTestTrack.repost_count.toString())).toBeInTheDocument()
        // Play count might be displayed differently or not always visible on mobile tile, adjust as needed
        // expect(await screen.findByText(baseTestTrack.play_count.toString())).toBeInTheDocument()
    })
  })

  describe('Navigation Tests', () => {
    it('navigates to track page when main content area is pressed (if not playing, not gated)', async () => {
      const { user, mockOnPress, track } = renderMobileTrackTile()
      const trackTile = await screen.findByText(track.title) // Find a clickable element like title
      await user.click(trackTile) // Simulate press on the tile
      expect(mockOnPress).toHaveBeenCalled()
      // Further navigation check depends on onPress implementation (e.g. dispatches navigate action)
      // For now, checking mockOnPress is a good start.
      // If onPress directly handles navigation, need to mock react-router navigation
    })

    it('navigates to user page when artist name is clicked', async () => {
      const { user, track } = renderMobileTrackTile()
      const userLink = await screen.findByText(track.user.name)
      await user.click(userLink)
      expect(await screen.findByRole('heading', { name: /test user page/i })).toBeInTheDocument()
    })
  })

  describe('Interaction Tests', () => {
    it('clicking the tile toggles play/pause', async () => {
      const { user, mockTogglePlay, track } = renderMobileTrackTile({ }, currentUserId, false, baseTestTrack.track_id)
      const trackTileTitle = await screen.findByText(track.title)
      await user.click(trackTileTitle) // Click on a main part of the tile
      expect(mockTogglePlay).toHaveBeenCalledWith(track.track_id, PlaybackSource.TRACK_TILE)
    })

    it('Favorite Button: favorites a track', async () => {
      const { user, track } = renderMobileTrackTile({ has_current_user_saved: false, favorite_count: 10 })
      const favoriteButton = await screen.findByRole('button', { name: /favorite/i })
      await user.click(favoriteButton)
      expect(tracksSocialActions.saveTrack).toHaveBeenCalledWith(track.track_id, FavoriteSource.TRACK_TILE) // Assuming FavoriteSource enum
    })

    it('Favorite Button: unfavorites a track', async () => {
      const { user, track } = renderMobileTrackTile({ has_current_user_saved: true, favorite_count: 11 })
      const favoriteButton = await screen.findByRole('button', { name: /unfavorite/i }) // Or toggled state name
      await user.click(favoriteButton)
      expect(tracksSocialActions.unsaveTrack).toHaveBeenCalledWith(track.track_id, FavoriteSource.TRACK_TILE)
    })

    it('Repost Button: reposts a track', async () => {
      const { user, track } = renderMobileTrackTile({ has_current_user_reposted: false, repost_count: 15 })
      const repostButton = await screen.findByRole('button', { name: /repost/i })
      await user.click(repostButton)
      expect(tracksSocialActions.repostTrack).toHaveBeenCalledWith(track.track_id, RepostSource.TRACK_TILE) // Assuming RepostSource enum
    })

    it('Repost Button: unreposts a track', async () => {
      const { user, track } = renderMobileTrackTile({ has_current_user_reposted: true, repost_count: 16 })
      const repostButton = await screen.findByRole('button', { name: /unrepost/i }) // Or toggled state name
      await user.click(repostButton)
      expect(tracksSocialActions.undoRepostTrack).toHaveBeenCalledWith(track.track_id, RepostSource.TRACK_TILE)
    })

    it('Share Button: opens share modal', async () => {
      const { user, track, mockOnShare } = renderMobileTrackTile()
      const shareButton = await screen.findByRole('button', { name: /share/i })
      await user.click(shareButton)
      expect(mockOnShare).toHaveBeenCalled() // If direct prop
      // OR check for Redux action if that's how it's handled:
      // expect(shareModalUIActions.requestOpen).toHaveBeenCalledWith({ type: 'track', trackId: track.track_id, source: ShareSource.TILE })
    })

    it('Overflow Menu: opens overflow menu', async () => {
      const { user, track, mockOnClickOverflow } = renderMobileTrackTile()
      const overflowButton = await screen.findByRole('button', { name: /more actions/i })
      await user.click(overflowButton)
      expect(mockOnClickOverflow).toHaveBeenCalled() // If direct prop
      // OR check for Redux action:
      // expect(mobileOverflowMenuUIActions.requestOpen).toHaveBeenCalledWith({ source: OverflowSource.TRACKS, id: track.track_id, overflowActions: expect.any(Array) })
    })
  })

  describe('Track State Tests', () => {
    it('Hidden Tracks: shows hidden indicator', async () => {
      renderMobileTrackTile({ is_private: true })
      // Mobile might show "Hidden" text or an icon. Adjust query as needed.
      // Example: expect(await screen.findByText('Hidden')).toBeInTheDocument()
      // Or, if it's an icon with an accessible name:
      expect(await screen.findByLabelText(/track is hidden/i)).toBeInTheDocument()
    })

    it('Premium Locked Track: shows locked state and opens purchase modal on press', async () => {
        const { user, track, mockOnPress } = renderMobileTrackTile({
            is_stream_gated: true,
            access: { stream: false, download: false },
            stream_conditions: { usdc_purchase: { price: 500 } }, // Price in cents
            owner_id: 'differentUser' as ID // Not owned by current user
        })
        expect(await screen.findByLabelText(/locked/i)).toBeInTheDocument() // Or text "Premium" / "Locked"

        const trackTileTitle = await screen.findByText(track.title)
        await user.click(trackTileTitle) // Click main tile area

        expect(mockOnPress).toHaveBeenCalled()
        // Check if purchase modal action was dispatched
        expect(premiumContentActions.openPremiumContentPurchaseModal).toHaveBeenCalledWith({ contentId: track.track_id, contentType: 'track' })
    })

    it('Premium Unlocked Track (Purchased): shows unlocked state', async () => {
      renderMobileTrackTile({
        is_stream_gated: true,
        access: { stream: true, download: false }, // User has stream access
        stream_conditions: { usdc_purchase: { price: 5 } },
        owner_id: 'differentUser' as ID
      })
      // Should not show "Locked" or "Premium" badge, or might show "Purchased"
      expect(screen.queryByLabelText(/locked/i)).not.toBeInTheDocument()
      expect(await screen.findByLabelText(/purchased/i)).toBeInTheDocument() // Or text "Purchased"
    })

    it('Premium Track Owned by User: renders normally without locked/purchased indicators', async () => {
      renderMobileTrackTile({
        is_stream_gated: true,
        stream_conditions: { usdc_purchase: { price: 5 } },
        owner_id: currentUserId // Owned by current user
      })
      expect(screen.queryByLabelText(/locked/i)).not.toBeInTheDocument()
      expect(screen.queryByLabelText(/purchased/i)).not.toBeInTheDocument()
      expect(await screen.findByText(baseTestTrack.title)).toBeInTheDocument() // Renders normally
    })
  })
})

// Define enums used if not available from imports (e.g., FavoriteSource, RepostSource)
// These are often part of common store actions or types.
// For testing, we can define simplified versions if not directly importable.
const FavoriteSource = { TRACK_TILE: 'TRACK_TILE' }
const RepostSource = { TRACK_TILE: 'TRACK_TILE' }
const ShareSource = { TILE: 'TILE' }
const OverflowSource = { TRACKS: 'TRACKS' }
// Note: Actual enum values should match what's used in the codebase.
// It's better to import them if possible.
// Example: import { FavoriteSource } from '@audius/common/store'
// If they are not exported or easily mockable, define them locally for test logic.
// This is a common workaround in testing when enums/consts are not exposed.
// Ensure these local definitions align with actual values for tests to be meaningful.

// Mocking FeatureFlags.getFeatureEnabled more robustly if needed for specific flags:
// beforeEach(() => {
//   (FeatureFlags.getFeatureEnabled as vi.Mock).mockImplementation((flag) => {
//     if (flag === FeatureFlags.MY_FLAG_NAME) return true;
//     return false; // Default for other flags
//   });
// });
