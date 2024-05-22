import { beforeEach, describe, it, expect, vi } from 'vitest'

import { ID } from '~/models'

import { createApi } from './createApi'

const mockContext = {
  dispatch: vi.fn()
}

describe('audius-query', function () {
  describe('request batcher', function () {
    const fetchBatchSpy = vi.fn(async ({ ids }: { ids: ID[] }, _: any) => {
      return ids.map((id) => ({ track_id: id }))
    })

    const testApi = createApi({
      reducerPath: 'testApi',
      endpoints: {
        getById: {
          fetch: async ({ id, myArg }: { id: ID; myArg?: string }, _: any) => {
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
    })

    it('batches requests when fetchBatch is specified', async function () {
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

    it('performs multiple batches when requests fall outside of the batch period', async function () {
      const item1 = testApi.fetch.getById({ id: 1 }, mockContext)
      await new Promise((resolve) => setTimeout(resolve, 100))
      const item2 = testApi.fetch.getById({ id: 2 }, mockContext)

      expect(await item1).toEqual({ track_id: 1 })
      expect(await item2).toEqual({ track_id: 2 })
      expect(fetchBatchSpy).toHaveBeenCalledTimes(2)
    })

    it("performs multiple batches when arguments don't match", async function () {
      const item1 = testApi.fetch.getById({ id: 1, myArg: 'test' }, mockContext)
      const item2 = testApi.fetch.getById({ id: 2 }, mockContext)

      expect(await item1).toEqual({ track_id: 1 })
      expect(await item2).toEqual({ track_id: 2 })
      expect(fetchBatchSpy).toHaveBeenCalledTimes(2)
    })
  })

  it('fetches data', async function () {
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
