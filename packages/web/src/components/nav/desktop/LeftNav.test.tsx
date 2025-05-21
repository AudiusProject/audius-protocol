import { ID, User, CoverPhotoSizes, ProfilePictureSizes, EnhancedTrack, EnhancedPlaylist, Status } from '@audius/common/models'
import { accountSelectors, notificationsSelectors, playlistLibrarySelectors, uiActions, playerSelectors } from '@audius/common/store'
import { route } from '@audius/common/utils'
import { AudiusLogo, Text } from '@audius/harmony'
import { developmentConfig } from '@audius/sdk'
import { http, HttpResponse, passthrough } from 'msw'
import { setupServer } from 'msw/node'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom-v5-compat'
import { describe, it, expect, vi, beforeAll, afterEach, afterAll, beforeEach } from 'vitest'

import { render, screen, testStore, waitFor, userEvent } from 'test/test-utils'
import { AUDIO_PAGE, EXPLORE_PAGE, FEED_PAGE, FAVORITES_PAGE, LIBRARY_PAGE, PROFILE_PAGE, TRENDING_PAGE, SETTINGS_PAGE, NOTIFICATIONS_PAGE, HOME_PAGE, UPLOAD_PAGE } from 'utils/route'

import { LeftNav } from './LeftNav'

const { HOME_PROFILE_PAGE } = route

// Mock common store selectors and actions
vi.mock('@audius/common/store', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    accountSelectors: {
      ...actual.accountSelectors,
      getAccountUser: vi.fn(),
      getUserId: vi.fn(),
      getAccountStatus: vi.fn(),
      getAccountHasTracks: vi.fn().mockReturnValue(false)
    },
    notificationsSelectors: {
        ...actual.notificationsSelectors,
        getNotificationUnreadCount: vi.fn().mockReturnValue(0)
    },
    playlistLibrarySelectors: {
        ...actual.playlistLibrarySelectors,
        getPlaylistLibrary: vi.fn().mockReturnValue(null) // Simulate empty library
    },
    playerSelectors: {
        ...actual.playerSelectors,
        getPlaying: vi.fn().mockReturnValue(false),
        getBuffering: vi.fn().mockReturnValue(false)
    },
    uiActions: {
        ...actual.uiActions,
        showModal: vi.fn(),
        hideModal: vi.fn(),
        goToRoute: vi.fn(),
        signOut: vi.fn()
    }
    // Mock other necessary actions/selectors as needed
  }
})

const { apiEndpoint } = developmentConfig.network
const currentUserId = 123 as ID

const mockCurrentUser: User = {
  user_id: currentUserId,
  name: 'Test User',
  handle: 'testuser',
  handle_lc: 'testuser',
  profile_picture_sizes: { '150x150': `${apiEndpoint}/img/profile_150x150.jpg` } as ProfilePictureSizes,
  // Fill other required User fields
  is_deactivated: false, is_verified: true, blocknumber: 1, created_at: '', updated_at: '', cover_photo: null, album_count: 0, followee_count: 0, follower_count: 0, playlist_count: 0, repost_count: 0, track_count: 0, cover_photo_sizes: null, metadata_multihash: null, erc_wallet: '0x123', spl_wallet: 'abc', wallet: '0x123'
}

const mockPlaylistLibrary = {
    id: 'mock-library-id',
    contents: [
        { playlist_id: 1, name: 'My Favs', user: { handle: 'testuser', name: 'Test User', id: currentUserId } },
        { playlist_id: 2, name: 'Chill Vibes', user: { handle: 'testuser', name: 'Test User', id: currentUserId } },
    ] as unknown as EnhancedPlaylist[],
    status: Status.SUCCESS,
    hasMore: false,
    total: 2
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
  // MSW handlers if LeftNav makes direct API calls (e.g., for badges or dynamic content)
  // For now, assuming most data comes via Redux selectors
  http.get('*', () => passthrough())
)

const renderLeftNav = (initialRoute = HOME_PAGE, unreadNotifications = 0) => {
  // @ts-ignore
  accountSelectors.getUserId.mockReturnValue(currentUserId)
  // @ts-ignore
  accountSelectors.getAccountUser.mockReturnValue(mockCurrentUser)
  // @ts-ignore
  accountSelectors.getAccountStatus.mockReturnValue(Status.SUCCESS)
  // @ts-ignore
  notificationsSelectors.getNotificationUnreadCount.mockReturnValue(unreadNotifications)
  // @ts-ignore
  playlistLibrarySelectors.getPlaylistLibrary.mockReturnValue(mockPlaylistLibrary)

  const store = testStore()

  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <LeftNav />
      <Routes>
        <Route path={HOME_PAGE} element={<MockPageComponent pageName="Home" />} />
        <Route path={FEED_PAGE} element={<MockPageComponent pageName="Feed" />} />
        <Route path={TRENDING_PAGE} element={<MockPageComponent pageName="Trending" />} />
        <Route path={EXPLORE_PAGE} element={<MockPageComponent pageName="Explore" />} />
        <Route path={LIBRARY_PAGE} element={<MockPageComponent pageName="Library" />} />
        <Route path={FAVORITES_PAGE} element={<MockPageComponent pageName="Favorites" />} />
        <Route path={AUDIO_PAGE} element={<MockPageComponent pageName="Audio" />} />
        <Route path={SETTINGS_PAGE} element={<MockPageComponent pageName="Settings" />} />
        <Route path={NOTIFICATIONS_PAGE} element={<MockPageComponent pageName="Notifications" />} />
        <Route path={UPLOAD_PAGE} element={<MockPageComponent pageName="Upload" />} />
        <Route path={HOME_PROFILE_PAGE(':handle')} element={<MockPageComponent pageName="Profile" />} />
        <Route path={'/:handle'} element={<MockPageComponent pageName="Profile Fallback" />} /> {/* Fallback for general profile routes */}
      </Routes>
    </MemoryRouter>,
    { store }
  )
}

describe('Desktop LeftNav', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
  afterEach(() => { server.resetHandlers(); vi.clearAllMocks(); })
  afterAll(() => server.close())

  describe('Rendering Tests', () => {
    beforeEach(() => {
      renderLeftNav()
    })

    it('renders core navigation links', async () => {
      expect(await screen.findByText('Home')).toBeInTheDocument()
      expect(await screen.findByText('Feed')).toBeInTheDocument()
      expect(await screen.findByText('Trending')).toBeInTheDocument()
      expect(await screen.findByText('Explore')).toBeInTheDocument()
      expect(await screen.findByText('Library')).toBeInTheDocument()
      expect(await screen.findByText('Saved')).toBeInTheDocument()
    })

    it('renders user info (name and profile picture)', async () => {
      expect(await screen.findByText(mockCurrentUser.name)).toBeInTheDocument()
      const profilePic = await screen.findByRole('img', { name: /profile picture/i })
      expect(profilePic).toBeInTheDocument()
      expect(profilePic).toHaveAttribute('src', mockCurrentUser.profile_picture_sizes['150x150'])
    })

    it('renders other key links ($AUDIO, Settings, Sign Out)', async () => {
      expect(await screen.findByText('$AUDIO')).toBeInTheDocument()
      expect(await screen.findByText('Settings')).toBeInTheDocument()
      expect(await screen.findByRole('button', { name: /sign out/i })).toBeInTheDocument()
    })
    
    it('renders Upload Track link', async () => {
        expect(await screen.findByText('Upload Track')).toBeInTheDocument();
    });


    it('renders playlist library section with header and playlists', async () => {
      expect(await screen.findByText('Playlists')).toBeInTheDocument()
      // Check for one of the mock playlists
      expect(await screen.findByText(mockPlaylistLibrary.contents[0].name)).toBeInTheDocument()
      expect(await screen.findByText(mockPlaylistLibrary.contents[1].name)).toBeInTheDocument()
      // Create playlist button might be part of this section or a separate component
      // expect(await screen.findByRole('button', { name: /create playlist/i })).toBeInTheDocument()
    })
  })

  describe('Navigation and Active State Tests', () => {
    const navLinks = [
      { name: 'Home', route: HOME_PAGE },
      { name: 'Feed', route: FEED_PAGE },
      { name: 'Trending', route: TRENDING_PAGE },
      { name: 'Explore', route: EXPLORE_PAGE },
      { name: 'Library', route: LIBRARY_PAGE },
      { name: 'Saved', route: FAVORITES_PAGE }
    ]

    navLinks.forEach(link => {
      it(`navigates to ${link.name} page and sets active state`, async () => {
        const { user } = renderLeftNav(HOME_PAGE === link.route ? EXPLORE_PAGE : HOME_PAGE) // Start on a different route
        const navLink = await screen.findByRole('link', { name: new RegExp(`^${link.name}$`, 'i') }) // Exact match for link name
        
        await user.click(navLink)
        
        expect(await screen.findByText(`${link.name} Page`)).toBeInTheDocument() // Check for mock page content
        expect(navLink).toHaveAttribute('aria-current', 'page') // Check for active state

        // Verify other links are not active
        navLinks.filter(other => other.name !== link.name).forEach(async otherLinkInfo => {
            const otherNavLink = await screen.findByRole('link', { name: new RegExp(`^${otherLinkInfo.name}$`, 'i') });
            expect(otherNavLink).not.toHaveAttribute('aria-current', 'page');
        });
      })
    })

    it('navigates to user profile when user info is clicked', async () => {
      const { user } = renderLeftNav()
      const userProfileLink = await screen.findByText(mockCurrentUser.name) // Click on user name
      await user.click(userProfileLink)
      expect(await screen.findByText('Profile Page')).toBeInTheDocument()
      expect(await screen.findByText(`Current Path: /${mockCurrentUser.handle}`)).toBeInTheDocument()
    })
    
    it('navigates to Upload Track page when Upload Track is clicked', async () => {
        const { user } = renderLeftNav();
        const uploadLink = await screen.findByText('Upload Track');
        await user.click(uploadLink);
        expect(await screen.findByText('Upload Page')).toBeInTheDocument();
        expect(uploadLink).toHaveAttribute('aria-current', 'page');
    });


    it('navigates to Settings page when Settings is clicked', async () => {
      const { user } = renderLeftNav()
      const settingsLink = await screen.findByText('Settings')
      await user.click(settingsLink)
      expect(await screen.findByText('Settings Page')).toBeInTheDocument()
      expect(settingsLink).toHaveAttribute('aria-current', 'page')
    })

    it('navigates to $AUDIO (Wallet) page when $AUDIO is clicked', async () => {
      const { user } = renderLeftNav()
      const audioLink = await screen.findByText('$AUDIO')
      await user.click(audioLink)
      expect(await screen.findByText('Audio Page')).toBeInTheDocument()
      expect(audioLink).toHaveAttribute('aria-current', 'page')
    })
    
    it('Sign Out button dispatches signOut action', async () => {
        const { user } = renderLeftNav();
        const signOutButton = await screen.findByRole('button', { name: /sign out/i });
        await user.click(signOutButton);
        expect(uiActions.signOut).toHaveBeenCalled();
    });
  })

  describe('Notifications Test', () => {
    it('shows notification badge when there are unread notifications', async () => {
      renderLeftNav(HOME_PAGE, 5) // 5 unread notifications
      // Assuming the notification link/button has a specific accessible name or contains "Notifications"
      const notificationLink = await screen.findByRole('link', { name: /notifications/i })
      // Check for a badge element, often a span with the count or a visual indicator
      // This selector might need adjustment based on actual implementation
      const badge = await within(notificationLink).findByText('5') 
      expect(badge).toBeInTheDocument()
    })

    it('does not show notification badge when there are no unread notifications', async () => {
      renderLeftNav(HOME_PAGE, 0) // 0 unread notifications
      const notificationLink = await screen.findByRole('link', { name: /notifications/i })
      // Badge should not be present or its text content should be empty/0
      expect(within(notificationLink).queryByText(/\d+/)).not.toBeInTheDocument() // Check no digit found
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
  queryByText: (textMatch: string | RegExp, options?: any) =>
    screen.queryByText((content, node) => {
        const hasText = (node: Element) => node.textContent === textMatch || (textMatch instanceof RegExp && textMatch.test(node.textContent || ''));
        const nodeHasText = hasText(node);
        const childrenDontHaveText = Array.from(node.children).every(
            (child) => !hasText(child)
        );
        return nodeHasText && childrenDontHaveText;
        }, { container: element, ...options }),
});
