import { SquareSizes } from '@audius/common/models'
import { developmentConfig } from '@audius/sdk'
import { http, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router-dom-v5-compat'
import { describe, expect, it, beforeAll, afterEach, afterAll } from 'vitest'

import { RenderOptions, mswServer, render, screen } from 'test/test-utils'

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

function renderProfilePage(overrides = {}, options?: RenderOptions) {
  const user = { ...testUser, ...overrides }
  console.log('hello world')

  mswServer.events.on('request:start', ({ request }) => {
    console.log('Outgoing:', request.method, request.url)
  })
  mswServer.use(
    http.get(`${apiEndpoint}/v1/full/users/handle/${user.handle}`, () => {
      console.log('returning user')
      return HttpResponse.json({ data: [user] })
    })
  )

  return render(
    <Routes>
      <Route
        path='/'
        element={<ProfilePage containerRef={{ current: null }} />}
      />
    </Routes>,
    options
  )
}

describe('ProfilePage', () => {
  beforeAll(() => {
    mswServer.listen()
  })

  afterEach(() => {
    mswServer.resetHandlers()
  })

  afterAll(() => {
    mswServer.close()
  })

  it('should render the profile route', async () => {
    renderProfilePage()
    expect(await screen.findByText('Test User')).toBeInTheDocument()
  })
})
