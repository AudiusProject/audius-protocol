import { developmentConfig, Id } from '@audius/sdk'
import { http, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router-dom-v5-compat'
import { describe, expect, it, beforeAll, afterEach, afterAll } from 'vitest'

import { mswServer, render, screen } from 'test/test-utils'

import { TrackTileSize } from '../types'

import { TrackTile } from './TrackTile'

const { apiEndpoint } = developmentConfig.network

const testUser = {
  id: Id.parse(2),
  handle: 'test-user',
  name: 'Test User',
  is_verified: false,
  is_deactivated: false,
  artist_pick_track_id: null
}

const testTrack = {
  id: Id.parse(1),
  track_id: Id.parse(1),
  user_id: Id.parse(2),
  genre: 'Electronic',
  title: 'Test Track',
  user: testUser,
  duration: 180,
  repost_count: 5,
  favorite_count: 10,
  comment_count: 15,
  permalink: '/test-user/test-track',
  is_delete: false,
  is_stream_gated: false,
  is_unlisted: false,
  has_current_user_reposted: false,
  has_current_user_saved: false,
  preview_cid: 'QmTestPreviewCid',
  _co_sign: null,
  is_owned_by_user: false,
  is_scheduled_release: false,
  is_available: true,
  is_downloadable: true,
  play_count: 1,
  artwork: null,
  followee_reposts: [],
  followee_favorites: [],
  track_segments: [],
  field_visibility: {}
  // Add any other required fields with default values
}

function renderTrackTile(overrides = {}) {
  mswServer.use(
    http.get(`${apiEndpoint}/v1/full/tracks`, ({ request }) => {
      const url = new URL(request.url)
      const id = url.searchParams.get('id')
      if (id === Id.parse(1)) {
        return HttpResponse.json({ data: [{ ...testTrack, ...overrides }] })
      }
      return new HttpResponse(null, { status: 404 })
    }),
    http.get(`${apiEndpoint}/v1/events/entity`, () => {
      return HttpResponse.json({ data: [] })
    })
  )

  return render(
    <Routes>
      <Route
        path='/'
        element={
          <TrackTile
            uid='test-uid'
            id={1}
            index={0}
            size={TrackTileSize.SMALL}
            statSize='small'
            ordered={false}
            togglePlay={() => {}}
            isLoading={false}
            hasLoaded={() => {}}
            isTrending={false}
            isFeed={false}
          />
        }
      />
      <Route path='/test-user/test-track' element={<h1>Mock Track Page</h1>} />
      <Route path='/test-user' element={<h1>Mock User Page</h1>} />
    </Routes>
  )
}

describe('TrackTile', () => {
  beforeAll(() => {
    mswServer.listen()
  })

  afterEach(() => {
    mswServer.resetHandlers()
  })

  afterAll(() => {
    mswServer.close()
  })

  it('Renders non-owner track tile with title and user', async () => {
    renderTrackTile()
    expect(await screen.findByText('Test Track')).toBeInTheDocument()
    expect(await screen.findByText('Test User')).toBeInTheDocument()
    expect(await screen.findByText('1 Plays')).toBeInTheDocument()
    expect(
      await screen.findByRole('button', { name: /reposts 5/i })
    ).toBeInTheDocument()
    expect(
      await screen.findByRole('button', { name: /favorites 10/i })
    ).toBeInTheDocument()
    expect(
      await screen.findByRole('button', { name: /comments 15/i })
    ).toBeInTheDocument()
    expect(await screen.findByText('3:00')).toBeInTheDocument()
  })

  const premiumConditions = { usdc_purchase: { price: 100 } }

  const matrix = [
    {
      name: 'Public Free (non-owner)',
      overrides: {},
      assert: async () => {
        expect(
          await screen.findByRole('link', { name: 'Test Track' })
        ).toBeInTheDocument()
        expect(
          await screen.findByRole('link', { name: 'Test User' })
        ).toBeInTheDocument()
        expect(screen.queryByText('Premium')).not.toBeInTheDocument()
      }
    },
    {
      name: 'Public Premium (non-owner)',
      overrides: {
        is_stream_gated: true,
        stream_conditions: premiumConditions
      },
      assert: async () => {
        expect(await screen.findByText('Premium')).toBeInTheDocument()
        expect(
          screen.getByRole('img', { name: /available for purchase/i })
        ).toBeInTheDocument()
        expect(
          screen.getByRole('button', { name: '$1.00' })
        ).toBeInTheDocument()
      }
    }
  ]

  it.each(matrix)('$name', async ({ overrides, assert }) => {
    renderTrackTile(overrides)
    await assert()
  })
})
