import { ReactElement } from 'react'

import { useChallengeCooldownSchedule } from '@audius/common/hooks'
import {
  accountSelectors,
  chatSelectors,
  uploadSelectors
} from '@audius/common/store'
import { route } from '@audius/common/utils'
import { ThemeProvider } from '@audius/harmony'
import { renderHook } from '@testing-library/react'
import { useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { useNavConfig } from './useNavConfig'
import { useNavSourcePlayingStatus } from './useNavSourcePlayingStatus'

const { getHasAccount, getIsAccountComplete } = accountSelectors
const { getUnreadMessagesCount } = chatSelectors
const { getIsUploading } = uploadSelectors

vi.mock('react-redux', () => ({
  useSelector: vi.fn()
}))

vi.mock('react-router-dom', () => ({
  useLocation: vi.fn()
}))

vi.mock('@audius/common/hooks', () => ({
  useChallengeCooldownSchedule: vi.fn()
}))

vi.mock('./useNavSourcePlayingStatus', () => ({
  useNavSourcePlayingStatus: vi.fn()
}))

vi.mock('@audius/harmony', async () => {
  const actual = (await vi.importActual('@audius/harmony')) as any
  return {
    ...actual
  }
})

const mockUseSelector = vi.mocked(useSelector)
const mockUseLocation = vi.mocked(useLocation)
const mockUseChallengeCooldownSchedule = vi.mocked(useChallengeCooldownSchedule)
const mockUseNavSourcePlayingStatus = vi.mocked(useNavSourcePlayingStatus)

const {
  EXPLORE_PAGE,
  FEED_PAGE,
  LIBRARY_PAGE,
  TRENDING_PAGE,
  CHATS_PAGE,
  UPLOAD_PAGE,
  REWARDS_PAGE
} = route

type MockOverrides = {
  hasAccount?: boolean
  isAccountComplete?: boolean
  unreadMessagesCount?: number
  isUploading?: boolean
  claimableAmount?: number
  playingFromRoute?:
    | typeof FEED_PAGE
    | typeof EXPLORE_PAGE
    | typeof TRENDING_PAGE
    | typeof LIBRARY_PAGE
    | null
  pathname?: string
}

// Constants for test labels
const NAV_LABELS = {
  FEED: 'Feed',
  TRENDING: 'Trending',
  EXPLORE: 'Explore',
  LIBRARY: 'Library',
  MESSAGES: 'Messages',
  WALLETS: 'Wallets',
  REWARDS: 'Rewards',
  UPLOAD: 'Upload',
  PLAYLISTS: 'Playlists'
} as const

// Mock state fixtures
const createMockState = (overrides: MockOverrides = {}) => ({
  account: {
    hasAccount: overrides.hasAccount ?? true,
    isAccountComplete: overrides.isAccountComplete ?? true
  },
  pages: {
    chat: {
      unreadMessagesCount: overrides.unreadMessagesCount ?? 0,
      optimisticUnreadMessagesCount: null
    }
  },
  upload: {
    isUploading: overrides.isUploading ?? false
  }
})

// Mock selector map
const createSelectorMap = (overrides: MockOverrides = {}) => {
  const map: Record<string, any> = {}
  map[getHasAccount.toString()] = overrides.hasAccount ?? true
  map[getIsAccountComplete.toString()] = overrides.isAccountComplete ?? true
  map[getUnreadMessagesCount.toString()] = overrides.unreadMessagesCount ?? 0
  map[getIsUploading.toString()] = overrides.isUploading ?? false
  return map
}

// Mock challenge response
const createMockChallengeResponse = (overrides: MockOverrides = {}) => ({
  claimableChallenges: [],
  claimableAmount: overrides.claimableAmount ?? 0,
  cooldownChallenges: [],
  cooldownAmount: 0,
  summary: undefined,
  isEmpty: true
})

// Setup mocks helper
const setupMocks = (overrides: MockOverrides = {}) => {
  const selectorMap = createSelectorMap(overrides)
  mockUseSelector.mockImplementation((selector: any) => {
    const key = selector.toString()
    if (key in selectorMap) {
      return selectorMap[key]
    }
    return selector(createMockState(overrides))
  })

  mockUseChallengeCooldownSchedule.mockReturnValue(
    createMockChallengeResponse(overrides)
  )

  mockUseNavSourcePlayingStatus.mockReturnValue(
    overrides.playingFromRoute ?? null
  )

  mockUseLocation.mockReturnValue({
    pathname: overrides.pathname ?? route.FEED_PAGE,
    search: '',
    hash: '',
    state: null
  })
}

const renderUseNavConfig = (overrides: MockOverrides = {}) => {
  setupMocks(overrides)
  return renderHook(() => useNavConfig(), {
    wrapper: ({ children }) => (
      <ThemeProvider theme='day'>{children}</ThemeProvider>
    )
  })
}

describe('useNavConfig', () => {
  describe('Feed Item', () => {
    it('enables Feed navigation when user has an account', () => {
      const { result } = renderUseNavConfig()
      const feedItem = result.current.find(
        (item) => item.label === NAV_LABELS.FEED
      )
      expect(feedItem?.disabled).toBe(false)
      expect(feedItem?.to).toBe(FEED_PAGE)
    })

    it('disables Feed navigation when user has no account', () => {
      const { result } = renderUseNavConfig({ hasAccount: false })
      const feedItem = result.current.find(
        (item) => item.label === NAV_LABELS.FEED
      )
      expect(feedItem?.disabled).toBe(true)
    })

    it('indicates when content is playing from Feed page', () => {
      const { result } = renderUseNavConfig({ playingFromRoute: FEED_PAGE })
      const feedItem = result.current.find(
        (item) => item.label === NAV_LABELS.FEED
      )
      expect(feedItem?.rightIcon).toBeDefined()
    })
  })

  describe('Trending Item', () => {
    it('allows navigation without account restrictions', () => {
      const { result } = renderUseNavConfig()
      const trendingItem = result.current.find(
        (item) => item.label === NAV_LABELS.TRENDING
      )
      expect(trendingItem?.disabled).toBeUndefined()
      expect(trendingItem?.to).toBe(TRENDING_PAGE)
      expect(trendingItem?.restriction).toBe('none')
    })

    it('indicates when content is playing from Trending page', () => {
      const { result } = renderUseNavConfig({ playingFromRoute: TRENDING_PAGE })
      const trendingItem = result.current.find(
        (item) => item.label === NAV_LABELS.TRENDING
      )
      expect(trendingItem?.rightIcon).toBeDefined()
    })
  })

  describe('Explore Item', () => {
    it('allows navigation without account restrictions', () => {
      const { result } = renderUseNavConfig()
      const exploreItem = result.current.find(
        (item) => item.label === NAV_LABELS.EXPLORE
      )
      expect(exploreItem?.disabled).toBeUndefined()
      expect(exploreItem?.to).toBe(EXPLORE_PAGE)
      expect(exploreItem?.restriction).toBe('none')
    })

    it('indicates when content is playing from Explore page', () => {
      const { result } = renderUseNavConfig({ playingFromRoute: EXPLORE_PAGE })
      const exploreItem = result.current.find(
        (item) => item.label === NAV_LABELS.EXPLORE
      )
      expect(exploreItem?.rightIcon).toBeDefined()
    })
  })

  describe('Library Item', () => {
    it('enables Library navigation for guest users', () => {
      const { result } = renderUseNavConfig()
      const libraryItem = result.current.find(
        (item) => item.label === NAV_LABELS.LIBRARY
      )
      expect(libraryItem?.disabled).toBe(false)
      expect(libraryItem?.to).toBe(LIBRARY_PAGE)
      expect(libraryItem?.restriction).toBe('guest')
    })

    it('disables Library navigation when user has no account', () => {
      const { result } = renderUseNavConfig({ hasAccount: false })
      const libraryItem = result.current.find(
        (item) => item.label === NAV_LABELS.LIBRARY
      )
      expect(libraryItem?.disabled).toBe(true)
    })

    it('indicates when content is playing from Library page', () => {
      const { result } = renderUseNavConfig({ playingFromRoute: LIBRARY_PAGE })
      const libraryItem = result.current.find(
        (item) => item.label === NAV_LABELS.LIBRARY
      )
      expect(libraryItem?.rightIcon).toBeDefined()
    })
  })

  describe('Messages Item', () => {
    it('enables Messages navigation when user has an account', () => {
      const { result } = renderUseNavConfig()
      const messagesItem = result.current.find(
        (item) => item.label === NAV_LABELS.MESSAGES
      )
      expect(messagesItem?.disabled).toBe(false)
      expect(messagesItem?.to).toBe(CHATS_PAGE)
    })

    it('disables Messages navigation when user has no account', () => {
      const { result } = renderUseNavConfig({ hasAccount: false })
      const messagesItem = result.current.find(
        (item) => item.label === NAV_LABELS.MESSAGES
      )
      expect(messagesItem?.disabled).toBe(true)
    })

    it('displays unread message count', () => {
      const unreadCount = 5
      const { result } = renderUseNavConfig({
        unreadMessagesCount: unreadCount
      })
      const messagesItem = result.current.find(
        (item) => item.label === NAV_LABELS.MESSAGES
      )
      expect((messagesItem?.rightIcon as ReactElement)?.props.count).toBe(
        unreadCount
      )
    })

    it('highlights unread count when on Messages page', () => {
      const { result } = renderUseNavConfig({
        unreadMessagesCount: 1,
        pathname: CHATS_PAGE
      })
      const messagesItem = result.current.find(
        (item) => item.label === NAV_LABELS.MESSAGES
      )
      expect((messagesItem?.rightIcon as ReactElement)?.props.isSelected).toBe(
        true
      )
    })
  })

  describe('Wallets Item', () => {
    it('enables Wallets navigation when user has an account', () => {
      const { result } = renderUseNavConfig()
      const walletsItem = result.current.find(
        (item) => item.label === NAV_LABELS.WALLETS
      )
      expect(walletsItem?.disabled).toBe(false)
      expect(walletsItem?.isExpandable).toBe(true)
      expect(walletsItem?.restriction).toBe('account')
    })

    it('disables Wallets navigation when user has no account', () => {
      const { result } = renderUseNavConfig({ hasAccount: false })
      const walletsItem = result.current.find(
        (item) => item.label === NAV_LABELS.WALLETS
      )
      expect(walletsItem?.disabled).toBe(true)
    })

    it('prevents wallet menu expansion when account is incomplete', () => {
      const { result } = renderUseNavConfig({ isAccountComplete: false })
      const walletsItem = result.current.find(
        (item) => item.label === NAV_LABELS.WALLETS
      )
      expect(walletsItem?.canUnfurl).toBe(false)
    })
  })

  describe('Rewards Item', () => {
    it('enables Rewards navigation when user has an account', () => {
      const { result } = renderUseNavConfig()
      const rewardsItem = result.current.find(
        (item) => item.label === NAV_LABELS.REWARDS
      )
      expect(rewardsItem?.disabled).toBe(false)
      expect(rewardsItem?.to).toBe(REWARDS_PAGE)
      expect(rewardsItem?.restriction).toBe('account')
    })

    it('disables Rewards navigation when user has no account', () => {
      const { result } = renderUseNavConfig({ hasAccount: false })
      const rewardsItem = result.current.find(
        (item) => item.label === NAV_LABELS.REWARDS
      )
      expect(rewardsItem?.disabled).toBe(true)
    })

    it('displays claimable rewards count', () => {
      const claimableAmount = 3
      const { result } = renderUseNavConfig({ claimableAmount })
      const rewardsItem = result.current.find(
        (item) => item.label === NAV_LABELS.REWARDS
      )
      expect((rewardsItem?.rightIcon as ReactElement)?.props.count).toBe(
        claimableAmount
      )
    })

    it('highlights rewards count when on Rewards page', () => {
      const { result } = renderUseNavConfig({
        claimableAmount: 1,
        pathname: REWARDS_PAGE
      })
      const rewardsItem = result.current.find(
        (item) => item.label === NAV_LABELS.REWARDS
      )
      expect((rewardsItem?.rightIcon as ReactElement)?.props.isSelected).toBe(
        true
      )
    })
  })

  describe('Upload Item', () => {
    it('enables Upload navigation when user has an account', () => {
      const { result } = renderUseNavConfig()
      const uploadItem = result.current.find(
        (item) => item.label === NAV_LABELS.UPLOAD
      )
      expect(uploadItem?.disabled).toBe(false)
      expect(uploadItem?.to).toBe(UPLOAD_PAGE)
    })

    it('disables Upload navigation when user has no account', () => {
      const { result } = renderUseNavConfig({ hasAccount: false })
      const uploadItem = result.current.find(
        (item) => item.label === NAV_LABELS.UPLOAD
      )
      expect(uploadItem?.disabled).toBe(true)
    })

    it('shows upload progress indicator when uploading', () => {
      const { result } = renderUseNavConfig({ isUploading: true })
      const uploadItem = result.current.find(
        (item) => item.label === NAV_LABELS.UPLOAD
      )
      expect(uploadItem?.rightIcon).toBeDefined()
    })
  })

  describe('Playlists Item', () => {
    it('enables Playlists navigation when user has an account', () => {
      const { result } = renderUseNavConfig()
      const playlistsItem = result.current.find(
        (item) => item.label === NAV_LABELS.PLAYLISTS
      )
      expect(playlistsItem?.disabled).toBe(false)
      expect(playlistsItem?.isExpandable).toBe(true)
      expect(playlistsItem?.restriction).toBe('account')
    })

    it('disables Playlists navigation when user has no account', () => {
      const { result } = renderUseNavConfig({ hasAccount: false })
      const playlistsItem = result.current.find(
        (item) => item.label === NAV_LABELS.PLAYLISTS
      )
      expect(playlistsItem?.disabled).toBe(true)
    })

    it('prevents playlist menu expansion when account is incomplete', () => {
      const { result } = renderUseNavConfig({ isAccountComplete: false })
      const playlistsItem = result.current.find(
        (item) => item.label === NAV_LABELS.PLAYLISTS
      )
      expect(playlistsItem?.canUnfurl).toBe(false)
    })

    it('shows persistent create playlist button', () => {
      const { result } = renderUseNavConfig()
      const playlistsItem = result.current.find(
        (item) => item.label === NAV_LABELS.PLAYLISTS
      )
      expect(playlistsItem?.rightIcon).toBeDefined()
      expect(playlistsItem?.shouldPersistRightIcon).toBe(true)
    })
  })
})
