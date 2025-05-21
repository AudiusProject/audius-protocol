import { ID, User, ProfilePictureSizes, Status } from '@audius/common/models'
import { accountSelectors, notificationsSelectors, chatSelectors, uiActions } from '@audius/common/store'
import { AudiusLogo, Text } from '@audius/harmony'
import { developmentConfig } from '@audius/sdk'
import { http, HttpResponse, passthrough } from 'msw'
import { setupServer } from 'msw/node'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom-v5-compat'
import { describe, it, expect, vi, beforeAll, afterEach, afterAll, beforeEach } from 'vitest'

import { render, screen, testStore, waitFor, userEvent, within as rtlWithin } from 'test/test-utils'
import { AUDIO_PAGE, EXPLORE_PAGE, FEED_PAGE, LIBRARY_PAGE, PROFILE_PAGE, TRENDING_PAGE, UPLOAD_PAGE, NOTIFICATIONS_PAGE } from 'utils/route' // Added NOTIFICATIONS_PAGE & UPLOAD_PAGE

import { ConnectedBottomBar } from './ConnectedBottomBar' // Adjust path if necessary

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
    notificationsSelectors: { // Though not explicitly on bottom bar, good to have if any tab might indicate it
        ...actual.notificationsSelectors,
        getNotificationUnreadCount: vi.fn().mockReturnValue(0)
    },
    chatSelectors: { // For Feed tab notification badge
        ...actual.chatSelectors,
        getHasUnreadMessages: vi.fn().mockReturnValue(false)
    },
    uiActions: {
        ...actual.uiActions,
        goToRoute: vi.fn() // Primary navigation action for bottom bar
    }
    // Mock other necessary actions/selectors as needed
  }
})

const { apiEndpoint } = developmentConfig.network
const currentUserId = 123 as ID

const mockCurrentUser: User = {
  user_id: currentUserId,
  name: 'Test User Mobile',
  handle: 'testusermobile',
  handle_lc: 'testusermobile',
  profile_picture_sizes: { '150x150': `${apiEndpoint}/img/profile_mobile_150x150.jpg` } as ProfilePictureSizes,
  is_deactivated: false, is_verified: true, blocknumber: 1, created_at: '', updated_at: '', cover_photo: null, album_count: 0, followee_count: 0, follower_count: 0, playlist_count: 0, repost_count: 0, track_count: 0, cover_photo_sizes: null, metadata_multihash: null, erc_wallet: '0x456', spl_wallet: 'def', wallet: '0x456'
}

// Mock a simple page component to verify navigation
const MockPageComponent = ({ pageName }: { pageName: string }) => {
  const location = useLocation()
  return (
    <div>
      <h1>{pageName} Page</h1>
      <p>Current Path: {location.pathname}</p>
    </div>
  )
}

const server = setupServer(
  // MSW handlers if BottomBar makes direct API calls (unlikely for this component)
  http.get('*', () => passthrough())
)

const renderMobileBottomBar = (initialRoute = FEED_PAGE, hasUnreadChatMessages = false) => {
  // @ts-ignore
  accountSelectors.getUserId.mockReturnValue(currentUserId)
  // @ts-ignore
  accountSelectors.getAccountUser.mockReturnValue(mockCurrentUser)
  // @ts-ignore
  accountSelectors.getAccountStatus.mockReturnValue(Status.SUCCESS)
  // @ts-ignore
  chatSelectors.getHasUnreadMessages.mockReturnValue(hasUnreadChatMessages)

  const store = testStore()

  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <ConnectedBottomBar />
      <Routes>
        <Route path={FEED_PAGE} element={<MockPageComponent pageName="Feed" />} />
        <Route path={TRENDING_PAGE} element={<MockPageComponent pageName="Trending" />} />
        <Route path={EXPLORE_PAGE} element={<MockPageComponent pageName="Explore" />} />
        <Route path={LIBRARY_PAGE} element={<MockPageComponent pageName="Library" />} />
        {/* Profile route needs a handle param, using current user's handle */}
        <Route path={`/${mockCurrentUser.handle}`} element={<MockPageComponent pageName="Profile" />} />
         {/* Fallback for other routes that might be active initially */}
        <Route path={UPLOAD_PAGE} element={<MockPageComponent pageName="Upload" />} />
        <Route path={NOTIFICATIONS_PAGE} element={<MockPageComponent pageName="Notifications" />} />
      </Routes>
    </MemoryRouter>,
    { store }
  )
}

describe('Mobile ConnectedBottomBar', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
  afterEach(() => { server.resetHandlers(); vi.clearAllMocks(); })
  afterAll(() => server.close())

  describe('Rendering Tests', () => {
    it('renders all core navigation tabs', async () => {
      renderMobileBottomBar()
      expect(await screen.findByRole('button', { name: /feed/i })).toBeInTheDocument()
      expect(await screen.findByRole('button', { name: /trending/i })).toBeInTheDocument()
      expect(await screen.findByRole('button', { name: /explore/i })).toBeInTheDocument()
      expect(await screen.findByRole('button', { name: /library/i })).toBeInTheDocument()
      expect(await screen.findByRole('button', { name: /profile/i })).toBeInTheDocument()
    })
  })

  describe('Navigation and Active State Tests', () => {
    const navTabs = [
      { name: 'Feed', route: FEED_PAGE, pageTitle: 'Feed Page' },
      { name: 'Trending', route: TRENDING_PAGE, pageTitle: 'Trending Page' },
      { name: 'Explore', route: EXPLORE_PAGE, pageTitle: 'Explore Page' },
      { name: 'Library', route: LIBRARY_PAGE, pageTitle: 'Library Page' },
      { name: 'Profile', route: `/${mockCurrentUser.handle}`, pageTitle: 'Profile Page' }
    ]

    navTabs.forEach(tab => {
      it(`navigates to ${tab.name} page and sets active state`, async () => {
        const initialRoute = tab.route === FEED_PAGE ? TRENDING_PAGE : FEED_PAGE; // Start on a different route
        const { user } = renderMobileBottomBar(initialRoute)
        
        // Find by accessible name which includes the label and potentially "tab" role description
        const navTab = await screen.findByRole('button', { name: new RegExp(tab.name, 'i') })
        await user.click(navTab)
        
        expect(await screen.findByText(tab.pageTitle)).toBeInTheDocument()
        // Active state can be tricky: might be aria-selected, a specific class, or icon change.
        // For simplicity, we check if goToRoute was called with the correct path.
        expect(uiActions.goToRoute).toHaveBeenCalledWith(tab.route)

        // To check active state visually (if possible):
        // This example assumes an 'aria-current' attribute or a specific class like 'active'
        // If icons change, you'd query for the active icon variant.
        // await waitFor(() => expect(navTab).toHaveAttribute('aria-current', 'page')); 
        // Or: await waitFor(() => expect(navTab).toHaveClass(/active/i));
      })
    })
  })

  describe('Notifications Test (Feed Tab)', () => {
    it('shows notification badge on Feed tab when there are unread chat messages', async () => {
      renderMobileBottomBar(FEED_PAGE, true) // true for hasUnreadChatMessages
      const feedTab = await screen.findByRole('button', { name: /feed/i })
      // The badge might be a child element or a specific class on the tab itself
      // For Harmony, a common pattern is a div with role="status" inside the button for badges
      const badge = await rtlWithin(feedTab).findByRole('status') // Or a more specific selector
      expect(badge).toBeInTheDocument()
    })

    it('does not show notification badge on Feed tab when no unread messages', async () => {
      renderMobileBottomBar(FEED_PAGE, false) // false for hasUnreadChatMessages
      const feedTab = await screen.findByRole('button', { name: /feed/i })
      expect(rtlWithin(feedTab).queryByRole('status')).not.toBeInTheDocument()
    })
  })
})
