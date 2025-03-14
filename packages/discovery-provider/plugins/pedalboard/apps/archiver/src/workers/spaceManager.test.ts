import { describe, it, expect, beforeEach } from 'vitest'
import {
  createSpaceManager,
  SpaceManagerErrorCode,
  SpaceManagerError
} from './spaceManager'
import pino from 'pino'

describe('SpaceManager', () => {
  const maxSpaceBytes = 1000
  let spaceManager: ReturnType<typeof createSpaceManager>
  const logger = pino()

  beforeEach(() => {
    spaceManager = createSpaceManager({ maxSpaceBytes, logger })
  })

  describe('claimSpace', () => {
    it('should successfully claim space when available', async () => {
      const claimed = await spaceManager.claimSpace({
        token: 'test1',
        bytes: 500
      })
      expect(claimed).toBe(true)

      const stats = await spaceManager.getStats()
      expect(stats.usedSpace).toBe(500)
      expect(stats.availableSpace).toBe(500)
      expect(stats.allocations).toEqual([['test1', 500]])
    })

    it('should reject when space is already allocated', async () => {
      await spaceManager.claimSpace({ token: 'test1', bytes: 500 })

      try {
        await spaceManager.claimSpace({ token: 'test1', bytes: 200 })
        throw new Error('Should have thrown ALREADY_ALLOCATED error')
      } catch (error) {
        expect((error as SpaceManagerError).code).toBe(
          SpaceManagerErrorCode.ALREADY_ALLOCATED
        )
      }
    })

    it('should reject when requested space exceeds maximum', async () => {
      try {
        await spaceManager.claimSpace({
          token: 'test1',
          bytes: maxSpaceBytes + 1
        })
        throw new Error('Should have thrown EXCEEDS_MAXIMUM error')
      } catch (error) {
        expect((error as SpaceManagerError).code).toBe(
          SpaceManagerErrorCode.EXCEEDS_MAXIMUM
        )
      }
    })

    it('should queue requests when space is not available', async () => {
      await spaceManager.claimSpace({ token: 'test1', bytes: 800 })
      const claimed = await spaceManager.claimSpace({
        token: 'test2',
        bytes: 300
      })

      expect(claimed).toBe(false)
      const stats = await spaceManager.getStats()
      expect(stats.queue).toContain('test2')
    })
  })

  describe('waitForSpace', () => {
    it('should wait and claim space when it becomes available', async () => {
      // First claim most of the space
      await spaceManager.claimSpace({ token: 'test1', bytes: 800 })

      // Start waiting for space in the background
      const waitPromise = spaceManager.waitForSpace({
        token: 'test2',
        bytes: 300,
        timeoutSeconds: 2
      })

      // Release space
      await spaceManager.releaseSpace('test1')

      // Wait should complete successfully
      await waitPromise

      const stats = await spaceManager.getStats()
      expect(stats.usedSpace).toBe(300)
      expect(stats.allocations).toEqual([['test2', 300]])
    })

    it('should timeout if space does not become available', async () => {
      await spaceManager.claimSpace({ token: 'test1', bytes: 800 })

      try {
        await spaceManager.waitForSpace({
          token: 'test2',
          bytes: 300,
          timeoutSeconds: 1
        })
        throw new Error('Should have thrown TIMEOUT error')
      } catch (error) {
        expect((error as SpaceManagerError).code).toBe(
          SpaceManagerErrorCode.TIMEOUT
        )
      }
    })

    it('should allow cancellation and remove token from queue', async () => {
      // First claim most of the space
      await spaceManager.claimSpace({ token: 'test1', bytes: 800 })

      // Create abort controller for cancellation
      const controller = new AbortController()

      // Start waiting for space
      const waitPromise = spaceManager.waitForSpace({
        token: 'test2',
        bytes: 300,
        timeoutSeconds: 5,
        signal: controller.signal
      })

      // Verify token is in queue
      let stats = await spaceManager.getStats()
      expect(stats.queue).toContain('test2')

      // Cancel the wait and expect it to reject with CANCELLED
      controller.abort()
      await expect(waitPromise).rejects.toThrow(
        new SpaceManagerError(
          'Space claim cancelled',
          SpaceManagerErrorCode.CANCELLED
        )
      )

      // Verify token was removed from queue
      stats = await spaceManager.getStats()
      expect(stats.queue).not.toContain('test2')
    })

    it('should handle cancellation after operation completes', async () => {
      // First claim most of the space
      await spaceManager.claimSpace({ token: 'test1', bytes: 800 })

      // Create abort controller for cancellation
      const controller = new AbortController()

      // Start waiting for space
      const waitPromise = spaceManager.waitForSpace({
        token: 'test2',
        bytes: 300,
        timeoutSeconds: 5,
        signal: controller.signal
      })

      // Release space to allow the wait to complete
      await spaceManager.releaseSpace('test1')

      // Wait for the operation to complete
      await waitPromise

      // Verify test2 got the space
      const stats = await spaceManager.getStats()
      expect(stats.allocations).toContainEqual(['test2', 300])

      // Cancel after completion should not affect the allocation
      controller.abort()
      const statsAfterCancel = await spaceManager.getStats()
      expect(statsAfterCancel.allocations).toContainEqual(['test2', 300])
    })

    it('should allow next in queue to proceed after cancellation', async () => {
      // First claim most of the space
      await spaceManager.claimSpace({ token: 'test1', bytes: 800 })

      // Create abort controller for cancellation
      const test2Controller = new AbortController()

      // Start waiting for space with test2
      const test2Promise = spaceManager.waitForSpace({
        token: 'test2',
        bytes: 300,
        timeoutSeconds: 5,
        signal: test2Controller.signal
      })

      // Queue test3 behind test2
      const test3Promise = spaceManager.waitForSpace({
        token: 'test3',
        bytes: 300,
        timeoutSeconds: 5
      })

      // Verify queue order
      let stats = await spaceManager.getStats()
      expect(stats.queue).toEqual(['test2', 'test3'])

      // Cancel test2's wait and expect it to reject
      test2Controller.abort()
      await expect(test2Promise).rejects.toThrow(
        new SpaceManagerError(
          'Space claim cancelled',
          SpaceManagerErrorCode.CANCELLED
        )
      )

      // Release space
      await spaceManager.releaseSpace('test1')

      // Wait for test3 to complete
      await test3Promise

      // Verify test3 got the space and test2 is gone
      stats = await spaceManager.getStats()
      expect(stats.allocations).toContainEqual(['test3', 300])
      expect(stats.queue).not.toContain('test2')
    })
  })

  describe('releaseSpace', () => {
    it('should successfully release allocated space', async () => {
      await spaceManager.claimSpace({ token: 'test1', bytes: 500 })
      const releasedBytes = await spaceManager.releaseSpace('test1')

      expect(releasedBytes).toBe(500)
      const stats = await spaceManager.getStats()
      expect(stats.usedSpace).toBe(0)
      expect(stats.allocations).toEqual([])
    })

    it('should handle releasing non-existent allocations', async () => {
      const releasedBytes = await spaceManager.releaseSpace('nonexistent')
      expect(releasedBytes).toBe(0)
    })
  })

  describe('removeFromQueue', () => {
    it('should remove token from queue', async () => {
      await spaceManager.claimSpace({ token: 'test1', bytes: 800 })
      await spaceManager.claimSpace({ token: 'test2', bytes: 300 })

      await spaceManager.removeFromQueue('test2')

      const stats = await spaceManager.getStats()
      expect(stats.queue).not.toContain('test2')
    })
  })

  describe('getStats', () => {
    it('should return correct statistics', async () => {
      await spaceManager.claimSpace({ token: 'test1', bytes: 300 })

      const stats = await spaceManager.getStats()
      expect(stats).toEqual({
        usedSpace: 300,
        availableSpace: 700,
        totalSpace: 1000,
        allocations: [['test1', 300]],
        queue: []
      })
    })
  })
})
