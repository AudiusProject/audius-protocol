import { beforeEach, describe, it, expect, vi } from 'vitest'

import { ID } from '~/models'

import { createApi } from './createApi'

const mockContext = {
  dispatch: vi.fn()
}

describe('audius-query', () => {
  describe('request batcher', () => {
    const fetchBatchSpyImpl = async ({ ids }: { ids: ID[] }, _: any) => {
      return ids.map((id) => ({ track_id: id }))
    }

    const fetchBatchSpy = vi.fn(fetchBatchSpyImpl)

    const testApi = createApi({
      reducerPath: 'testApi',
      endpoints: {
        getById: {
          fetch: async ({ id }: { id: ID; myArg?: string }, _: any) => {
            return { id }
          },
          fetchBatch: fetchBatchSpy,
          options: {
            idArgKey: 'id',
            schemaKey: 'track'
          }
        }
      }
    })

    beforeEach(() => {
      fetchBatchSpy.mockClear()
      fetchBatchSpy.mockImplementation(fetchBatchSpyImpl)
    })

    it('batches requests when fetchBatch is specified', async () => {
      const item1 = testApi.fetch.getById({ id: 1, myArg: 'test' }, mockContext)
      const item2 = testApi.fetch.getById({ id: 2, myArg: 'test' }, mockContext)

      expect(await item1).toEqual({ track_id: 1 })
      expect(await item2).toEqual({ track_id: 2 })
      expect(fetchBatchSpy).toHaveBeenCalledTimes(1)
      expect(fetchBatchSpy).toHaveBeenCalledWith(
        { ids: [1, 2], myArg: 'test' },
        mockContext
      )
    })

    it('performs multiple batches when requests fall outside of the batch period', async () => {
      const item1 = testApi.fetch.getById({ id: 1 }, mockContext)
      await new Promise((resolve) => setTimeout(resolve, 100))
      const item2 = testApi.fetch.getById({ id: 2 }, mockContext)

      expect(await item1).toEqual({ track_id: 1 })
      expect(await item2).toEqual({ track_id: 2 })
      expect(fetchBatchSpy).toHaveBeenCalledTimes(2)
    })

    it('correctly handles requests that are enqueued during the fetch of the current batch', async () => {
      // Slow down the fetchBatch implementation
      const fetchBatchSpyImplSlow = async ({ ids }: { ids: ID[] }, _: any) => {
        return await new Promise<{ track_id: ID }[]>((resolve) =>
          setTimeout(() => resolve(ids.map((id) => ({ track_id: id }))), 1000)
        )
      }
      fetchBatchSpy.mockImplementation(fetchBatchSpyImplSlow)

      // Batch period is 10ms and fetch is 1000ms, so the first batch will be
      // in progress as the second batch is enqueued
      const item1 = testApi.fetch.getById({ id: 1 }, mockContext)
      await new Promise((resolve) => setTimeout(resolve, 100))
      const item2 = testApi.fetch.getById({ id: 2 }, mockContext)

      expect(await item1).toEqual({ track_id: 1 })
      expect(await item2).toEqual({ track_id: 2 })
      expect(fetchBatchSpy).toHaveBeenCalledTimes(2)
    })

    it("performs multiple batches when arguments don't match", async () => {
      const item1 = testApi.fetch.getById({ id: 1, myArg: 'test' }, mockContext)
      const item2 = testApi.fetch.getById({ id: 2 }, mockContext)

      expect(await item1).toEqual({ track_id: 1 })
      expect(await item2).toEqual({ track_id: 2 })
      expect(fetchBatchSpy).toHaveBeenCalledTimes(2)
    })

    it('performs multiple batches when there are more requests than the max batch size', async () => {
      const items = [...new Array(200)].map((_, i) => ({ id: i }))

      const requests = items.map((item) =>
        testApi.fetch.getById(item, mockContext)
      )
      const results = await Promise.all(requests)

      expect(results).toEqual(items.map((item) => ({ track_id: item.id })))

      expect(fetchBatchSpy).toHaveBeenCalledTimes(2)
    })
  })

  it('fetches data', async () => {
    const testApi = createApi({
      reducerPath: 'testApi',
      endpoints: {
        getById: {
          fetch: async ({ id }: { id: ID }, _: any) => {
            return { id }
          },
          options: {}
        }
      }
    })

    expect(await testApi.fetch.getById({ id: 1 }, mockContext)).toEqual({
      id: 1
    })
  })
})
