import { describe, expect, it, vi } from 'vitest'

import { TracksApi } from '../generated/default/apis/TracksApi'
import { Configuration } from '../generated/default/runtime'

// Exercise the real HTTP request serialization, including explicit false to cancel scheduling.
describe('track scheduling over REST', () => {
  for (const operation of ['create', 'update'] as const) {
    it.each([true, false, undefined])(
      `${operation} preserves scheduling=%s and the exact release time`,
      async (isScheduledRelease) => {
        const fetchApi = vi.fn().mockResolvedValue(
          new Response(JSON.stringify({ data: {} }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          })
        )
        const api = new TracksApi(new Configuration({ fetchApi }))
        const metadata = {
          title: 'Scheduled track',
          genre: 'Electronic',
          trackCid: 'test-cid',
          isScheduledRelease,
          releaseDate: new Date('2026-10-20T00:00:00-07:00')
        }
        if (operation === 'create') {
          await api.createTrack({ userId: 'owner', metadata })
        } else {
          await api.updateTrack({ userId: 'owner', trackId: 'track', metadata })
        }
        const body = JSON.parse(fetchApi.mock.calls[0][1].body)
        expect(body.release_date).toBe('2026-10-20T07:00:00.000Z')
        if (isScheduledRelease === undefined) {
          expect(body).not.toHaveProperty('is_scheduled_release')
        } else {
          expect(body.is_scheduled_release).toBe(isScheduledRelease)
        }
      }
    )
  }
})
