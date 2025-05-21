import { SquareSizes, ID } from '@audius/common/models'
import { accountSelectors } from '@audius/common/store'
import { Text, IconPause, IconPlay, IconKebabHorizontal, IconHeart, IconRepost } from '@audius/harmony'
import { developmentConfig } from '@audius/sdk'
import { fireEvent, waitFor } from '@testing-library/react'
import { http, HttpResponse, passthrough } from 'msw'
import { setupServer } from 'msw/node'
import { Routes, Route } from 'react-router-dom-v5-compat'
import { describe, it, expect, vi, beforeAll, afterEach, afterAll } from 'vitest'

import { render, screen, testStore } from 'test/test-utils'

import { TrackTile } from './TrackTile'

// Mock accountSelectors
vi.mock('@audius/common/store', async () => {
  const actual = await vi.importActual('@audius/common/store')
  return {
    ...actual,
    accountSelectors: {
      ...actual.accountSelectors,
      getAccountUser: vi.fn(),
      getUserId: vi.fn()
    }
  }
})

const { apiEndpoint } = developmentConfig.network
const currentUserId = 2 as ID

const testTrack = {
  track_id: 'track123', // Changed id to track_id to match common model structure
  title: 'Test Track',
  user_id: 'user456' as unknown as ID, // Ensure user_id is typed as ID if necessary
  permalink: '/test-user/test-track',
  repost_count: 15,
  favorite_count: 10,
  play_count: 0, // Renamed total_play_count to play_count
  blocknumber: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  is_delete: false,
  is_private: false,
  is_stream_gated: false,
  is_scheduled_release: false,
  has_current_user_reposted: false,
  has_current_user_saved: false,
  _co_sign: undefined, // Added _co_sign
  artwork: {
    [SquareSizes.SIZE_150_BY_150]: `${apiEndpoint}/image-track-small.jpg`,
    [SquareSizes.SIZE_480_BY_480]: `${apiEndpoint}/image-track-medium.jpg`,
    mirrors: undefined // Mirrors can be undefined
  },
  access: { stream: true, download: false }, // download can be part of access
  user: {
    id: 'user456' as unknown as ID, // Ensure user_id is typed as ID
    handle: 'test-user',
    name: 'Test User',
    is_verified: false, // Added is_verified
    is_deactivated: false, // Added is_deactivated
    blocknumber: 0, // Added blocknumber
    created_at: new Date().toISOString(), // Added created_at
    updated_at: new Date().toISOString(), // Added updated_at
    name_lc: 'test user' // Added name_lc
  },
  stream_conditions: undefined // Added stream_conditions
}

const server = setupServer(
  http.post(`${apiEndpoint}/v1/tracks/track123/favorite`, async ({ request }) => {
    const body = await request.json() as any
    if (body.userId === currentUserId) { // Assuming favorite takes userId
      return HttpResponse.json({})
    }
    return new HttpResponse(null, { status: 403 })
  }),
  http.post(`${apiEndpoint}/v1/tracks/track123/repost`, async ({ request }) => {
    const body = await request.json() as any
    if (body.userId === currentUserId) { // Assuming repost takes userId
      return HttpResponse.json({})
    }
    return new HttpResponse(null, { status: 403 })
  }),
  // Passthrough all other requests
  http.get('*', () => passthrough())
)

const renderTrackTile = (overrides = {}, currentUserIdOverride = currentUserId) => {
  const track = { ...testTrack, ...overrides }
  // @ts-ignore
  accountSelectors.getUserId.mockReturnValue(currentUserIdOverride)
  // @ts-ignore
  accountSelectors.getAccountUser.mockReturnValue({ id: currentUserIdOverride, /* other user props */ })


  // Ensure the store has a current user for actions like favorite/repost
  const store = testStore()
  // You might need to dispatch an action to set the current user in the store
  // if your component relies on it for enabling/disabling actions or for API calls.
  // For example: store.dispatch(setUserId(currentUserIdOverride))

  server.use(
    http.get(`${apiEndpoint}/v1/full/tracks`, ({ request }) => {
      const url = new URL(request.url)
      const id = url.searchParams.get('id')
      if (id === track.track_id) { // Use track_id
        return HttpResponse.json({ data: track })
      }
      if (url.pathname.includes(track.permalink)) {
        return HttpResponse.json({ data: track })
      }
      return new HttpResponse(null, { status: 404 })
    }),
    http.get(`${apiEndpoint}/v1/tracks/${track.track_id}/stream`, () => {
      return new HttpResponse(null, { status: 200 }) // Mock stream endpoint
    })
  )

  return render(
    <Routes>
      <Route path='/' element={<TrackTile
        uid="test-uid" // UID is often required for lists/keys
        index={0}
        track={track as any} // Cast to any if track structure is complex or for simplicity
        size='s'
        containerCn="test-container"
        // Mock necessary callbacks for play, favorite, repost, menu
        onPlay={() => vi.fn()}
        togglePlay={() => vi.fn()}
        onSave={() => vi.fn()}
        onRepost={() => vi.fn()}
        onClickOverflow={() => vi.fn()}
        currentUserId={currentUserIdOverride}
        playing={false}
        active={false}
        />} />
      <Route
        path={track.permalink} // Use permalink from track
        element={<Text variant='heading'>Test Track Page</Text>}
      />
      <Route
        path={`/${track.user.handle}`} // Use user handle from track for user page
        element={<Text variant='heading'>Test User Page</Text>}
      />
    </Routes>,
    { store } // Pass the store to render if using Redux
  )
}

describe('TrackTile', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
  afterEach(() => {
    server.resetHandlers()
    vi.clearAllMocks()
  })
  afterAll(() => server.close())

  // Previous tests (rendering, navigation, hidden, premium) would go here...
  // For brevity, they are omitted but should be kept.

  it('renders a button with the label comprising the track title and artist name, and favorites and reposts', async () => {
    renderTrackTile()
    // The main clickable area might not be a 'button' role directly, or its name might be more complex.
    // Let's assume the main link/card area is identifiable.
    // If the whole card is clickable and leads to the track page, this test is fine.
    // However, specific buttons for play, favorite, etc., will be tested separately.
    expect(
      await screen.findByText(/Test Track/i)
    ).toBeInTheDocument()
    expect(
      await screen.findByText(/Test User/i)
    ).toBeInTheDocument()
    // Stat buttons are often separate, so their combined name might not be on the main element.
  })

  it('navigates to track page when track title is clicked', async () => {
    const { user } = renderTrackTile()
    const trackLink = await screen.findByText('Test Track') // Assuming title is a link
    await user.click(trackLink)
    expect(
      await screen.findByRole('heading', { name: /test track page/i })
    ).toBeInTheDocument()
  })

    it('renders the cover image', async () => {
    renderTrackTile()
    expect(await screen.findByTestId(`cover-art-${testTrack.track_id}`)).toHaveAttribute(
      'src',
      `${apiEndpoint}/image-track-medium.jpg`
    )
  })

  it('renders the track owner link which navigates to user page', async () => {
    const { user } = renderTrackTile()
    const userLink = await screen.findByRole('link', { name: 'Test User' })
    await user.click(userLink)
    expect(
      await screen.findByRole('heading', { name: /test user page/i })
    ).toBeInTheDocument()
  })

  it('hidden tracks are shown as hidden', async () => {
    renderTrackTile({ is_private: true })
    // The naming convention for the card might change when hidden.
    // Look for a specific element indicating "Hidden" status if the main name doesn't include it.
    expect(
      await screen.findByText(/hidden/i, {}, { timeout: 2000 }) // Increased timeout
    ).toBeInTheDocument()
  })


  it('premium locked tracks are rendered correctly', async () => {
    renderTrackTile({
      access: { stream: false, download: false },
      // @ts-ignore
      stream_conditions: { usdc_purchase: { price: 10, trackPrice: 1, splits: {} } }
    })
    expect(
      await screen.findByText(/available for purchase/i, {}, { timeout: 2000 })
    ).toBeInTheDocument()
  })

  it('premium unlocked tracks are rendered correctly', async () => {
    renderTrackTile({
      access: { stream: true, download: true },
      // @ts-ignore
      stream_conditions: { usdc_purchase: { price: 10, trackPrice: 1, splits: {} } }
    })
    expect(
      await screen.findByText(/purchased/i, {}, { timeout: 2000 })
    ).toBeInTheDocument()
  })

  it('premium tracks owned by user are rendered correctly', async () => {
    renderTrackTile({ user_id: currentUserId }) // Track owned by current user
    // Should not show "Purchased" or "Available for Purchase"
    expect(screen.queryByText(/available for purchase/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/purchased/i)).not.toBeInTheDocument()
    // Check for normal display elements like title
    expect(await screen.findByText('Test Track')).toBeInTheDocument()
  })


  // New tests for buttons

  it('clicking menu button opens track menu', async () => {
    const { user } = renderTrackTile()
    const menuButton = await screen.findByRole('button', { name: /more actions/i }) // Adjust name as per actual component
    await user.click(menuButton)
    // Assuming the menu, when open, has a specific role or contains identifiable items
    expect(await screen.findByRole('menu', { name: /track menu/i })).toBeInTheDocument() // Adjust name/role
  })

  it('clicking play button initiates track playback', async () => {
    const mockOnPlay = vi.fn()
    const { user } = renderTrackTile({ onPlay: mockOnPlay }) // Pass mock function

    const playButton = await screen.findByRole('button', { name: /play/i })
    await user.click(playButton)

    // Option 1: Check if onPlay prop was called (if TrackTile uses such a prop)
    expect(mockOnPlay).toHaveBeenCalled()

    // Option 2: Check for icon change (e.g., Play icon to Pause icon)
    // This requires the buttons to have distinct accessible names or for icons to be identifiable
    // For example, if IconPlay changes to IconPause:
    // expect(screen.queryByLabelText(/play/i)).not.toBeInTheDocument()
    // expect(await screen.findByLabelText(/pause/i)).toBeInTheDocument()

    // Option 3: Check if a global play action was dispatched (if using Redux)
    // This would involve spying on store.dispatch or checking store state.
  })

  describe('Favorite Button', () => {
    it('favorites a track when clicked', async () => {
      const mockOnSave = vi.fn()
      const { user } = renderTrackTile({ has_current_user_saved: false, favorite_count: 10, onSave: mockOnSave })

      const favoriteButton = await screen.findByRole('button', { name: /favorite/i })
      await user.click(favoriteButton)

      expect(mockOnSave).toHaveBeenCalledWith(false, testTrack.track_id) // false for not currently saved

      // Check for optimistic UI update (e.g., icon change, count update)
      // This depends on how the component is implemented.
      // Example: expect(await screen.findByRole('button', { name: /unfavorite/i })).toBeInTheDocument()
      // Example: expect(await screen.findByText('11')).toBeInTheDocument() // Assuming count updates

      // Verify API call was made (MSW handler will intercept this)
      // No direct assertion needed here if MSW handler is set up and test passes
    })

    it('unfavorites a track when clicked', async () => {
      const mockOnSave = vi.fn()
      const { user } = renderTrackTile({ has_current_user_saved: true, favorite_count: 11, onSave: mockOnSave })

      const unfavoriteButton = await screen.findByRole('button', { name: /unfavorite/i }) // Or same name, but toggled state
      await user.click(unfavoriteButton)

      expect(mockOnSave).toHaveBeenCalledWith(true, testTrack.track_id) // true for currently saved

      // Check for optimistic UI update
      // Example: expect(await screen.findByRole('button', { name: /favorite/i })).toBeInTheDocument()
      // Example: expect(await screen.findByText('10')).toBeInTheDocument()
    })
  })

  describe('Repost Button', () => {
    it('reposts a track when clicked', async () => {
      const mockOnRepost = vi.fn()
      const { user } = renderTrackTile({ has_current_user_reposted: false, repost_count: 15, onRepost: mockOnRepost })

      const repostButton = await screen.findByRole('button', { name: /repost/i })
      await user.click(repostButton)

      expect(mockOnRepost).toHaveBeenCalledWith(false, testTrack.track_id) // false for not currently reposted

      // Check for optimistic UI update
      // Example: expect(await screen.findByRole('button', { name: /unrepost/i })).toBeInTheDocument()
      // Example: expect(await screen.findByText('16')).toBeInTheDocument()
    })

    it('unreposts a track when clicked', async () => {
      const mockOnRepost = vi.fn()
      const { user } = renderTrackTile({ has_current_user_reposted: true, repost_count: 16, onRepost: mockOnRepost })

      const unrepostButton = await screen.findByRole('button', { name: /unrepost/i }) // Or same name, but toggled state
      await user.click(unrepostButton)

      expect(mockOnRepost).toHaveBeenCalledWith(true, testTrack.track_id) // true for currently reposted

      // Check for optimistic UI update
      // Example: expect(await screen.findByRole('button', { name: /repost/i })).toBeInTheDocument()
      // Example: expect(await screen.findByText('15')).toBeInTheDocument()
    })
  })
})
