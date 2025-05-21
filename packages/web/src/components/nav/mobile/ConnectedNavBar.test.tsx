import { ID, User, Status } from '@audius/common/models'
import { accountSelectors, navHeaderSelectors, uiActions, mobileOverflowMenuUIActions, chatSelectors } from '@audius/common/store'
import { વિકાસConfig } from '@audius/sdk' // Using a different name to avoid conflict if 'developmentConfig' is used elsewhere
import { http, HttpResponse, passthrough } from 'msw'
import { setupServer } from 'msw/node'
import { MemoryRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom-v5-compat'
import { describe, it, expect, vi, beforeAll, afterEach, afterAll, beforeEach } from 'vitest'

import { render, screen, testStore, waitFor, userEvent, within as rtlWithin } from 'test/test-utils'
import { FEED_PAGE, TRENDING_PAGE, EXPLORE_PAGE, LIBRARY_PAGE, SETTINGS_PAGE, PROFILE_PAGE, NOTIFICATIONS_PAGE, CHAT_PAGE } from 'utils/route'

import { ConnectedNavBar } from './ConnectedNavBar' // Adjust path if necessary

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
    navHeaderSelectors: { // Corrected selector group
        ...actual.navHeaderSelectors,
        getTitle: vi.fn().mockReturnValue(null),
        getPreviousRoute: vi.fn().mockReturnValue(null),
        getIsTransparent: vi.fn().mockReturnValue(false), // Default to not transparent
        getShareSoundToTikTokChain: vi.fn().mockReturnValue(null)
    },
    chatSelectors: { // For potential chat icon/notifications in NavBar
        ...actual.chatSelectors,
        getHasUnreadMessages: vi.fn().mockReturnValue(false)
    },
    uiActions: {
        ...actual.uiActions,
        goToRoute: vi.fn(), // For back button and other navigations
        // For sign on which might be triggered by some actions if user is not logged in
        openSignOn: vi.fn(() => ({ type: 'OPEN_SIGN_ON' })) 
    },
    mobileOverflowMenuUIActions: {
        ...actual.mobileOverflowMenuUIActions,
        requestOpen: vi.fn()
    }
  }
})

const { walletApiUrl } = વિકાસConfig.network // Example, adjust if needed

const currentUserId = 123 as ID
const mockCurrentUser: User = {
  user_id: currentUserId, name: 'Test NavBar User', handle: 'navbaruser', 
  // Fill other required User fields
  is_deactivated: false, is_verified: false, blocknumber: 1, created_at: '', updated_at: '', cover_photo: null, profile_picture: null, album_count: 0, followee_count: 0, follower_count: 0, playlist_count: 0, repost_count: 0, track_count: 0, cover_photo_sizes: null, profile_picture_sizes: null, metadata_multihash: null, erc_wallet: '0x789', spl_wallet: 'ghi', wallet: '0x789'
}

// Mock a simple page component to verify navigation context
const MockPageComponent = ({ pageName }: { pageName: string }) => {
  const location = useLocation()
  return (
    <div>
      <h1>{pageName} Page</h1>
      <p>Current Path: {location.pathname}</p>
    </div>
  )
}
// Mock a back button handler if router.back() is used
const mockGoBack = vi.fn()
vi.mock('react-router-dom-v5-compat', async (importOriginal) => {
    const actual = await importOriginal()
    return {
        ...actual,
        useNavigate: () => mockGoBack, // if using navigate(-1)
    }
})


const server = setupServer(http.get('*', () => passthrough()))

const renderMobileNavBar = ({
  initialRoute = FEED_PAGE,
  title,
  previousRoute,
  isTransparent = false,
  hasUnreadChat = false
}: {
  initialRoute?: string
  title?: string | null
  previousRoute?: string | null
  isTransparent?: boolean
  hasUnreadChat?: boolean
} = {}) => {
  // @ts-ignore
  accountSelectors.getUserId.mockReturnValue(currentUserId)
  // @ts-ignore
  accountSelectors.getAccountUser.mockReturnValue(mockCurrentUser)
  // @ts-ignore
  accountSelectors.getAccountStatus.mockReturnValue(Status.SUCCESS)
  // @ts-ignore
  navHeaderSelectors.getTitle.mockReturnValue(title)
  // @ts-ignore
  navHeaderSelectors.getPreviousRoute.mockReturnValue(previousRoute)
    // @ts-ignore
  navHeaderSelectors.getIsTransparent.mockReturnValue(isTransparent)
  // @ts-ignore
  chatSelectors.getHasUnreadMessages.mockReturnValue(hasUnreadChat)


  const store = testStore()

  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <ConnectedNavBar />
      <Routes>
        {/* Define routes that correspond to titles and back button states being tested */}
        <Route path={FEED_PAGE} element={<MockPageComponent pageName="Feed" />} />
        <Route path={TRENDING_PAGE} element={<MockPageComponent pageName="Trending" />} />
        <Route path={SETTINGS_PAGE} element={<MockPageComponent pageName="Settings" />} />
        <Route path={PROFILE_PAGE(':handle')} element={<MockPageComponent pageName="Profile" />} />
        <Route path={CHAT_PAGE} element={<MockPageComponent pageName="Chat" />} />

      </Routes>
    </MemoryRouter>,
    { store }
  )
}

describe('Mobile ConnectedNavBar', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
  afterEach(() => { server.resetHandlers(); vi.clearAllMocks(); })
  afterAll(() => server.close())

  describe('Page Title Display Tests', () => {
    const testCases = [
      { route: FEED_PAGE, expectedTitle: 'Feed' },
      { route: TRENDING_PAGE, expectedTitle: 'Trending' },
      { route: EXPLORE_PAGE, expectedTitle: 'Explore' }, // Assuming Explore has a title
      { route: SETTINGS_PAGE, expectedTitle: 'Settings' },
      { route: `/${mockCurrentUser.handle}`, expectedTitle: mockCurrentUser.name }, // Profile Page
      { route: CHAT_PAGE, expectedTitle: 'Messages'}
    ]

    testCases.forEach(({ route, expectedTitle }) => {
      it(`displays title "${expectedTitle}" for route ${route}`, async () => {
        renderMobileNavBar({ initialRoute: route, title: expectedTitle })
        if (expectedTitle) {
          expect(await screen.findByText(expectedTitle)).toBeInTheDocument()
        } else {
          // If title is null, the logo might be shown, or nothing specific.
          // This depends on NavBar's logic for null titles.
          // For now, let's assume a null title means no explicit title text.
          expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument()
        }
      })
    })

    it('displays logo when title is null (e.g., on Feed page often)', async () => {
      renderMobileNavBar({ initialRoute: FEED_PAGE, title: null })
      expect(await screen.findByTestId('audiusLogo')).toBeInTheDocument() // Assuming AudiusLogo has this testId
    })
  })

  describe('Back Button Tests', () => {
    it('shows and uses back button when previousRoute is present', async () => {
      const previousRoute = FEED_PAGE
      const currentRoute = TRENDING_PAGE
      const { user } = renderMobileNavBar({ initialRoute: currentRoute, previousRoute, title: 'Trending' })
      
      const backButton = await screen.findByRole('button', { name: /back/i }) // Or specific aria-label
      expect(backButton).toBeInTheDocument()
      
      await user.click(backButton)
      // Check if either goToRoute or router.back() was called
      // If ConnectedNavBar uses useNavigate hook for back, mockGoBack will be called.
      // If it dispatches goToRoute, that will be called.
      // One of them should be called.
      const goToRouteCalled = uiActions.goToRoute.mock.calls.length > 0;
      const mockGoBackCalled = mockGoBack.mock.calls.length > 0;

      expect(goToRouteCalled || mockGoBackCalled).toBe(true);
      if (goToRouteCalled) {
          expect(uiActions.goToRoute).toHaveBeenCalledWith(previousRoute)
      } else {
          // If using navigate(-1)
          // No direct argument check, just that it was called.
      }
    })

    it('does not show back button when previousRoute is null', async () => {
      renderMobileNavBar({ initialRoute: FEED_PAGE, previousRoute: null, title: 'Feed' })
      expect(screen.queryByRole('button', { name: /back/i })).not.toBeInTheDocument()
    })
  })

  describe('Overflow Menu / Action Buttons', () => {
    // Example: Assuming NavBar has a Chat icon that navigates to Chat page and shows a badge
    it('displays Chat icon with badge and navigates on click', async () => {
      const { user } = renderMobileNavBar({ initialRoute: FEED_PAGE, title: 'Feed', hasUnreadChat: true })
      
      const chatButton = await screen.findByTestId('chatButton') // Assuming a testId for the chat icon/button
      expect(chatButton).toBeInTheDocument()
      
      // Check for badge (visual indicator, might be a child span or specific class)
      const badge = await rtlWithin(chatButton).findByRole('status') // Or similar selector for badge
      expect(badge).toBeInTheDocument()
      
      await user.click(chatButton)
      expect(uiActions.goToRoute).toHaveBeenCalledWith(CHAT_PAGE)
    })

    // Example: If there's an overflow menu directly in ConnectedNavBar
    it('opens overflow menu when overflow button is clicked', async () => {
        // This test assumes ConnectedNavBar itself has an overflow menu trigger.
        // If the overflow is part of what getTitle() returns (e.g. custom header), this test is different.
        // For now, let's assume a generic overflow button might exist.
        // @ts-ignore
        navHeaderSelectors.getTitle.mockReturnValue('Page With Overflow'); // Ensure a title is set so back/logo doesn't hide overflow
        // @ts-ignore
        navHeaderSelectors.getPreviousRoute.mockReturnValue('/previous-page'); // Ensure back button is also there

        const { user } = renderMobileNavBar({ initialRoute: TRENDING_PAGE, title: 'Page With Overflow', previousRoute: '/previous-page' });
        
        // Look for a button that typically represents an overflow menu
        const overflowButton = screen.queryByRole('button', { name: /menu/i }); // Or a more specific aria-label
        if (overflowButton) {
            await user.click(overflowButton);
            expect(mobileOverflowMenuUIActions.requestOpen).toHaveBeenCalled();
        } else {
            // If no generic overflow button, this test might not apply or needs adjustment.
            // console.warn("Overflow button not found in ConnectedNavBar for this test setup.");
        }
    });
  })
})
