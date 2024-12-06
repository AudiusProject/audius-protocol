import { describe, it, beforeAll, expect, vitest } from 'vitest'

import { DefaultAuth } from '../../services/Auth/DefaultAuth'
import { DiscoveryNodeSelector } from '../../services/DiscoveryNodeSelector'
import { EntityManager } from '../../services/EntityManager'
import { Configuration } from '../generated/default'

import { NotificationsApi } from './NotificationsApi'

vitest.mock('../../services/EntityManager')
vitest.mock('../../services/DiscoveryNodeSelector')
vitest.mock('../../services/StorageNodeSelector')
vitest.mock('../../services/Storage')
vitest.mock('./TrackUploadHelper')

vitest
  .spyOn(EntityManager.prototype, 'manageEntity')
  .mockImplementation(async () => {
    return {
      blockHash: 'a',
      blockNumber: 1
    } as any
  })

describe('NotificationsApi', () => {
  let notifications: NotificationsApi

  const auth = new DefaultAuth()

  beforeAll(() => {
    notifications = new NotificationsApi(
      new Configuration(),
      new EntityManager({ discoveryNodeSelector: new DiscoveryNodeSelector() }),
      auth
    )
    vitest.spyOn(console, 'warn').mockImplementation(() => {})
    vitest.spyOn(console, 'info').mockImplementation(() => {})
    vitest.spyOn(console, 'debug').mockImplementation(() => {})
    vitest.spyOn(console, 'error').mockImplementation(() => {})
  })

  describe('markAllNotificationsAsViewed', () => {
    it('marks all notifications as viewed if valid metadata is provided', async () => {
      const result = await notifications.markAllNotificationsAsViewed({
        userId: '7eP5n'
      })

      expect(result).toStrictEqual({
        blockHash: 'a',
        blockNumber: 1
      })
    })

    it('throws an error if invalid metadata is provided', async () => {
      await expect(async () => {
        await notifications.markAllNotificationsAsViewed({
          userId: 5 as any
        })
      }).rejects.toThrow()
    })
  })

  describe('updatePlaylistLastViewedAt', () => {
    it('updates the playlist last viewed at if valid metadata is provided', async () => {
      const result = await notifications.updatePlaylistLastViewedAt({
        userId: '7eP5n',
        playlistId: 'x5pJ3Aj'
      })

      expect(result).toStrictEqual({
        blockHash: 'a',
        blockNumber: 1
      })
    })

    it('throws an error if invalid metadata is provided', async () => {
      await expect(async () => {
        await notifications.updatePlaylistLastViewedAt({
          userId: '7eP5n',
          playlistId: 1 as any
        })
      }).rejects.toThrow()
    })
  })
})