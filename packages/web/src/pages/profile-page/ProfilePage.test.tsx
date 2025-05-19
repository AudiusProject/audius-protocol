import { useRef } from 'react'

import fs from 'fs'

import { SquareSizes } from '@audius/common/models'
import { developmentConfig } from '@audius/sdk'
import { http, HttpResponse } from 'msw'
import { Navigate, Route, Routes } from 'react-router-dom-v5-compat'
import {
  describe,
  expect,
  it,
  beforeAll,
  afterEach,
  afterAll,
  vi,
  beforeEach
} from 'vitest'

import {
  RenderOptions,
  mswServer,
  render,
  screen,
  within
} from 'test/test-utils'

import ProfilePage from './ProfilePage'

const { apiEndpoint } = developmentConfig.network

const testUser = {
  id: '7eP5n',
  handle: 'test-user',
  name: 'Test User',
  profilePicture: {
    [SquareSizes.SIZE_150_BY_150]: `${apiEndpoint}/image-profile-small.jpg`,
    [SquareSizes.SIZE_480_BY_480]: `${apiEndpoint}/image-profile-medium.jpg`,
    mirrors: [apiEndpoint]
  },
  followerCount: 1,
  followeeCount: 2,
  trackCount: 5,
  playlistCount: 3,
  repostCount: 4,
  albumCount: 2,
  bio: 'Test bio',
  coverPhoto: {
    [SquareSizes.SIZE_480_BY_480]: `${apiEndpoint}/image-cover.jpg`,
    mirrors: [apiEndpoint]
  },
  isVerified: false,
  isDeactivated: false,
  isAvailable: true,
  ercWallet: '0x123',
  splWallet: '0x456',
  wallet: '0x123',
  balance: '0',
  associatedWalletsBalance: '0',
  totalBalance: '0',
  waudioBalance: '0',
  associatedSolWalletsBalance: '0',
  blocknumber: 1,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  isStorageV2: true,
  handleLc: 'test-user',
  hasCollectibles: false,
  allowAiAttribution: false
}

const mockData = {
  connected_wallets: { data: { erc_wallets: [], spl_wallets: [] } },
  collectibles: { data: null },
  userByHandle: { data: [testUser] },
  supporting: { data: [] },
  supporters: { data: [] },
  related: { data: [] },
  events: { data: [] }
}

// Need to mock the main content scroll element - otherwise things break
const mockScrollElement = {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  getBoundingClientRect: vi.fn().mockReturnValue({ top: 0 }),
  scrollTop: 0,
  clientHeight: 1000,
  scrollHeight: 2000
}

const ProfilePageWithRef = () => {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  return (
    <div ref={scrollRef}>
      {/* @ts-expect-error - the type is incorrect here on ProfilePage */}
      <ProfilePage containerRef={scrollRef.current!} />
    </div>
  )
}

export function renderProfilePage(overrides = {}, options?: RenderOptions) {
  const user = { ...testUser, ...overrides }

  mswServer.use(
    http.get(`${apiEndpoint}/v1/full/users/handle/${user.handle}`, () => {
      return HttpResponse.json(mockData.userByHandle)
    }),
    http.get(`${apiEndpoint}/v1/users/${user.id}/connected_wallets`, () => {
      return HttpResponse.json(mockData.connected_wallets)
    }),
    http.get(`${apiEndpoint}/v1/users/${user.id}/collectibles`, () => {
      return HttpResponse.json(mockData.collectibles)
    }),
    http.get(`${apiEndpoint}/v1/full/users/${user.id}/supporting`, () => {
      return HttpResponse.json(mockData.supporting)
    }),
    http.get(`${apiEndpoint}/v1/full/users/${user.id}/supporters`, () => {
      return HttpResponse.json(mockData.supporters)
    }),
    http.get(`${apiEndpoint}/v1/full/users/${user.id}/related`, () => {
      return HttpResponse.json(mockData.related)
    }),
    http.get(`${apiEndpoint}/v1/events/entity`, () => {
      return HttpResponse.json(mockData.events)
    }),
    // ETH NFTs api
    http.get(
      'https://rinkeby-api.opensea.io/api/v2/chain/ethereum/account/0x123/nfts',
      () => {
        return HttpResponse.json({ data: [] })
      }
    )
  )

  return render(
    <Routes>
      <Route path='/' element={<Navigate to='/test-user' replace />} />
      <Route path='/:handle' element={<ProfilePageWithRef />} />
    </Routes>,
    options
  )
}

describe('ProfilePage', () => {
  beforeEach(() => {
    // Mock document.getElementById
    document.getElementById = vi.fn().mockImplementation((id) => {
      if (id === 'mainContent') {
        return mockScrollElement
      }
      return null
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })
  beforeAll(() => {
    mswServer.listen()
  })

  afterEach(() => {
    mswServer.resetHandlers()
  })

  afterAll(() => {
    mswServer.close()
  })

  it.only('should render the profile page for a non-artist', async () => {
    renderProfilePage()

    // User header
    expect(await screen.findByText(testUser.name)).toBeInTheDocument()
    expect(await screen.findByText(`@${testUser.handle}`)).toBeInTheDocument()

    // Profile and cover photos
    const profilePhoto = await screen.findByTestId('profile-picture')
    expect(profilePhoto).toBeInTheDocument()
    expect(profilePhoto).toHaveStyle({
      backgroundImage: `url(${testUser.profilePicture[SquareSizes.SIZE_150_BY_150]})`
    })

    const coverPhoto = await screen.findByTestId('cover-photo')
    expect(coverPhoto).toBeInTheDocument()
    expect(coverPhoto).toHaveStyle({
      backgroundImage: `url(${testUser.coverPhoto[SquareSizes.SIZE_480_BY_480]})`
    })

    // Stat banner
    const statBanner = await screen.findByTestId('stat-banner')
    expect(statBanner).toBeInTheDocument()
    expect(await within(statBanner).getByText(/playlists/i)).toBeInTheDocument()
    expect(within(statBanner).queryByText(/tracks/i)).not.toBeInTheDocument()
    expect(await within(statBanner).getByText(/followers/i)).toBeInTheDocument()
    expect(await within(statBanner).getByText(/following/i)).toBeInTheDocument()
    // render appropriate tabs with correct content

    // Tabs
    const navBanner = await screen.findByTestId('nav-banner')
    expect(await within(navBanner).getByText('Playlists')).toBeInTheDocument()
    expect(await within(navBanner).getByText('Reposts')).toBeInTheDocument()

    // TODO: test badge

    // TODO: test bio

    // TODO: test recent comments block

    // TODO: supporting block

    // TODO: supporters block

    // TODO: show share button
  })

  it.skip('should handle edit and buttons for profile page owner', async () => {
    renderProfilePage()
    // TODO
  })

  it.skip('should render the profile page for an artist with tracks', async () => {
    renderProfilePage()
    // TODO
    // TODO: test related artists
  })

  it.skip('shows deactivated state if user is deactivated', async () => {
    // TODO: set up this prop
    renderProfilePage({ isDeactivated: true })
    // TODO
  })

  it.skip('shows user with collectibles', async () => {
    renderProfilePage()
    // TODO
  })

  it.skip('shows user with active remix context', async () => {
    renderProfilePage()
    // TODO
  })
})
