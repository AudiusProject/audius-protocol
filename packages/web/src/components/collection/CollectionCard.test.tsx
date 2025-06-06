import { SquareSizes } from '@audius/common/models'
import { Text } from '@audius/harmony'
import { developmentConfig } from '@audius/sdk'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { Routes, Route } from 'react-router-dom-v5-compat'
import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'

import { render, screen } from 'test/test-utils'

import { CollectionCard } from './CollectionCard'

const { apiEndpoint } = developmentConfig.network

const testCollection = {
  id: '7eP5n',
  playlist_name: 'Test Collection',
  user_id: '7eP5n',
  permalink: '/test-user/test-collection',
  repost_count: 10,
  favorite_count: 5,
  total_play_count: 0,
  track_count: 0,
  blocknumber: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  is_album: false,
  is_image_autogenerated: false,
  is_delete: false,
  is_private: false,
  is_stream_gated: false,
  is_scheduled_release: false,
  has_current_user_reposted: false,
  has_current_user_saved: false,
  playlist_contents: [],
  added_timestamps: [],
  followee_reposts: [],
  followee_favorites: [],
  artwork: {
    [SquareSizes.SIZE_150_BY_150]: `${apiEndpoint}/image-collection-small.jpg`,
    [SquareSizes.SIZE_480_BY_480]: `${apiEndpoint}/image-collection-medium.jpg`,
    mirrors: [apiEndpoint]
  },
  access: { stream: true },
  user: {
    id: '7eP5n',
    handle: 'test-user',
    name: 'Test User'
  }
}

const server = setupServer()

const renderCollectionCard = (overrides = {}) => {
  const collection = { ...testCollection, ...overrides }

  server.use(
    http.get(`${apiEndpoint}/v1/full/playlists`, ({ request }) => {
      const url = new URL(request.url)
      const id = url.searchParams.get('id')
      if (id === '7eP5n') {
        return HttpResponse.json({ data: [collection] })
      }
      return new HttpResponse(null, { status: 404 })
    })
  )

  return render(
    <Routes>
      <Route path='/' element={<CollectionCard id={1} size='s' />} />
      <Route
        path='/test-user/test-collection'
        element={<Text variant='heading'>Test Collection Page</Text>}
      />
      <Route
        path='/test-user'
        element={<Text variant='heading'>Test User Page</Text>}
      />
    </Routes>
  )
}

describe('CollectionCard', () => {
  beforeAll(() => {
    server.listen()
  })

  afterEach(() => {
    server.resetHandlers()
  })

  afterAll(() => {
    server.close()
  })

  it('renders a button with the label comprising the collection and artist name, and favorites and reposts', async () => {
    renderCollectionCard()

    expect(
      await screen.findByRole('button', {
        name: /test collection test user reposts 10 favorites 5/i
      })
    ).toBeInTheDocument()
  })

  it('navigates to collection page when clicked', async () => {
    renderCollectionCard()

    const collectionCard = await screen.findByRole('button', {
      name: /test collection/i
    })

    collectionCard.click()

    expect(
      await screen.findByRole('heading', { name: /test collection page/i })
    ).toBeInTheDocument()
  })

  it('renders the cover image', async () => {
    renderCollectionCard()

    expect(await screen.findByTestId('cover-art-1')).toHaveAttribute(
      'src',
      `${apiEndpoint}/image-collection-medium.jpg`
    )
  })

  it('renders the collection owner link which navigates to user page', async () => {
    renderCollectionCard()

    const userLink = await screen.findByRole('link', {
      name: 'Test User'
    })
    userLink.click()

    expect(
      await screen.findByRole('heading', { name: /test user page/i })
    ).toBeInTheDocument()
  })

  it('hidden collections are show as hidden', async () => {
    renderCollectionCard({ is_private: true })

    expect(
      await screen.findByRole('button', {
        name: /test collection test user hidden/i
      })
    ).toBeInTheDocument()
  })

  it('premium locked collections are rendered correctly', async () => {
    renderCollectionCard({
      access: { stream: false, download: false },
      stream_conditions: {
        usdc_purchase: { price: 10, albumTrackPrice: 1, splits: {} }
      }
    })

    expect(
      await screen.findByRole('button', {
        name: /test collection test user reposts 10 favorites 5 available for purchase/i
      })
    ).toBeInTheDocument()
  })

  it('premium unlocked collections are rendered correctly', async () => {
    renderCollectionCard({
      access: { stream: true, download: true },
      stream_conditions: {
        usdc_purchase: { price: 10, albumTrackPrice: 1, splits: {} }
      }
    })

    expect(
      await screen.findByRole('button', {
        name: /test collection test user reposts 10 favorites 5 purchased/i
      })
    ).toBeInTheDocument()
  })

  it('premium collections owned by user are rendered correctly', async () => {
    renderCollectionCard({
      playlist_owner_id: 2 // Same as current user
    })

    expect(
      await screen.findByRole('button', {
        name: 'Test Collection Test User Reposts 10 Favorites 5'
      })
    ).toBeInTheDocument()
  })
})
