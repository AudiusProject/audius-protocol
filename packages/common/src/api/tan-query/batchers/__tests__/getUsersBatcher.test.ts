import { full, GetBulkUsersRequest, HashId, Id, OptionalId } from '@audius/sdk'
import { QueryClient } from '@tanstack/react-query'
import { describe, it, expect, beforeEach, vi } from 'vitest'

import { userMetadataFromSDK } from '~/adapters/user'

import { getUsersBatcher } from '../getUsersBatcher'
import type { BatchContext } from '../types'

describe('getUsersBatcher', () => {
  const createMockSdkUser = (id: number): full.UserFull => ({
    id: Id.parse(id),
    handle: `test-user-${id}`,
    name: `Test User ${id}`,
    profilePicture: {},
    profilePictureSizes: undefined,
    coverPhoto: {},
    coverPhotoSizes: undefined,
    bio: undefined,
    location: undefined,
    isVerified: false,
    creatorNodeEndpoint: undefined,
    isDeactivated: false,
    handleLc: `test-user-${id}`,
    followeeCount: 0,
    followerCount: 0,
    playlistCount: 0,
    albumCount: 0,
    trackCount: 0,
    repostCount: 0,
    doesFollowCurrentUser: false,
    doesCurrentUserFollow: false,
    currentUserFolloweeFollowCount: 0,
    hasCollectibles: false,
    ercWallet: '',
    supporterCount: 0,
    supportingCount: 0,
    coverPhotoLegacy: undefined,
    profilePictureLegacy: undefined,
    coverPhotoCids: undefined,
    profilePictureCids: undefined,
    verifiedWithTwitter: false,
    verifiedWithInstagram: false,
    verifiedWithTiktok: false,
    isAvailable: true,
    twitterHandle: undefined,
    instagramHandle: undefined,
    tiktokHandle: undefined,
    website: undefined,
    donation: undefined,
    createdAt: '',
    updatedAt: '',
    splWallet: '',
    totalAudioBalance: 0,
    wallet: '',
    balance: '0',
    associatedWalletsBalance: '0',
    totalBalance: '0',
    waudioBalance: '0',
    associatedSolWalletsBalance: '0',
    blocknumber: 0,
    isStorageV2: false,
    doesCurrentUserSubscribe: false,
    allowAiAttribution: false
  })

  const mockSdk = {
    full: {
      users: {
        getBulkUsers: vi
          .fn()
          .mockImplementation((params: GetBulkUsersRequest) => {
            const users = params.id?.map((userId) =>
              createMockSdkUser(HashId.parse(userId))
            )
            return Promise.resolve({ data: users })
          })
      }
    }
  } as unknown as BatchContext['sdk']

  const mockContext: BatchContext = {
    sdk: mockSdk,
    currentUserId: null,
    queryClient: new QueryClient(),
    dispatch: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches a single user correctly', async () => {
    const batcher = getUsersBatcher(mockContext)
    const id = 1
    const result = await batcher.fetch(id)

    expect(mockSdk.full.users.getBulkUsers).toHaveBeenCalledWith({
      id: [Id.parse(id)],
      userId: OptionalId.parse(null)
    })
    expect(result).toMatchObject(
      userMetadataFromSDK(createMockSdkUser(id)) ?? {}
    )
  })
})
