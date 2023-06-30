import { TracksApi } from './TracksApi'
import { Auth } from '../../services/Auth/Auth'
import { beforeAll, expect, jest } from '@jest/globals'
import { Configuration } from '../generated/default'
import { EntityManager } from '../../services/EntityManager'
import type { UsersApi } from './UsersApi'

jest.mock('../../services/EntityManager')

jest
  .spyOn(EntityManager.prototype, 'manageEntity')
  .mockImplementation(async () => {
    return {
      txReceipt: {
        blockHash: 'a',
        blockNumber: 1
      }
    } as any
  })

describe('UsersApi', () => {
  let users: UsersApi

  const auth = new Auth()

  beforeAll(() => {
    users = new TracksApi(new Configuration(), new EntityManager(), auth)
    jest.spyOn(console, 'warn').mockImplementation(() => {})
    jest.spyOn(console, 'info').mockImplementation(() => {})
    jest.spyOn(console, 'debug').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  describe('followUser', () => {
    it('follows a user if valid metadata is provided', async () => {
      const result = await users.followUser({
        userId: '7eP5n',
        followeeUserId: 'x5pJ3Aj'
      })

      expect(result).toStrictEqual({
        blockHash: 'a',
        blockNumber: 1
      })
    })

    it('throws an error if invalid metadata is provided', async () => {
      await expect(async () => {
        await users.followUser({
          userId: '7eP5n',
          followeeUserId: 1 as any
        })
      }).rejects.toThrow()
    })
  })

  describe('unfollowUser', () => {
    it('unfollows a user if valid metadata is provided', async () => {
      const result = await users.unfollowUser({
        userId: '7eP5n',
        followeeUserId: 'x5pJ3Aj'
      })

      expect(result).toStrictEqual({
        blockHash: 'a',
        blockNumber: 1
      })
    })

    it('throws an error if invalid metadata is provided', async () => {
      await expect(async () => {
        await users.unfollowUser({
          userId: '7eP5n',
          followeeUserId: 1 as any
        })
      }).rejects.toThrow()
    })
  })
})
