import { describe, it, expect, vi, beforeEach } from 'vitest'

import {
  AccessConditionsEthNFTCollection,
  Chain,
  Collectible,
  CollectibleGatedConditions,
  CollectibleMediaType,
  FollowGatedConditions,
  TipGatedConditions,
  USDCPurchaseConditions
} from '~/models'

import { useAccessAndRemixSettings } from './useAccessAndRemixSettings'

const { mockedUseSelector } = vi.hoisted(() => {
  return { mockedUseSelector: vi.fn() }
})

vi.mock('react-redux', () => {
  return {
    useSelector: mockedUseSelector
  }
})

const mockUseSelector = (mockedState: any) => (selectorFn: any) =>
  selectorFn(mockedState)

const mockEthCollectible: Collectible = {
  id: '123',
  tokenId: '123',
  name: 'dank nft',
  description: 'dank nft description',
  mediaType: CollectibleMediaType.IMAGE,
  frameUrl: 'danknft.com/eth/frameUrl',
  imageUrl: 'danknft.com/eth/imageUrl',
  gifUrl: 'danknft.com/eth/gifUrl',
  videoUrl: 'danknft.com/eth/videoUrl',
  threeDUrl: 'danknft.com/eth/threeDUrl',
  animationUrl: 'danknft.com/eth/animationUrl',
  hasAudio: false,
  isOwned: true,
  dateCreated: '01-01-2020',
  dateLastTransferred: '01-01-2020',
  chain: Chain.Eth,
  permaLink: 'danknft.com/eth/permaLink',
  wallet: 'pretendThisIsAWalletAddress',
  collectionName: 'dank nft',
  collectionSlug: 'dank-nft',
  collectionImageUrl: 'danknft.com/img',
  assetContractAddress: 'pretendThisIsAnAddress',
  externalLink: 'danknft.com/eth/pretendThisIsAnAddress',
  standard: 'ERC721'
}

const mockUSDCGateConditions: USDCPurchaseConditions = {
  usdc_purchase: {
    price: 100,
    splits: { 123: 100 }
  }
}

const mockFollowGateConditions: FollowGatedConditions = {
  follow_user_id: 123
}
const mockTipGateConditions: TipGatedConditions = {
  tip_user_id: 123
}

const mockCollectibleGateConditions: CollectibleGatedConditions = {
  nft_collection: {
    ...mockEthCollectible,
    address: 'someAddress',
    slug: 'slug'
  } as AccessConditionsEthNFTCollection
}

const reduxStateWithoutCollectibles = {
  account: {
    userId: 123
  },
  collectibles: {
    userCollectibles: { 123: { sol: [], eth: [] } },
    solCollections: {}
  }
}

const reduxStateWithCollectibles = {
  account: {
    userId: 123
  },
  collectibles: {
    userCollectibles: {
      123: { sol: [], eth: [mockEthCollectible] }
    },
    solCollections: {}
  }
}

describe('useAccessAndRemixSettings', () => {
  beforeEach(() => {
    mockedUseSelector.mockImplementation(
      mockUseSelector(reduxStateWithoutCollectibles)
    )
  })
  describe('track upload', () => {
    it('should support all options when the user has collectibles', () => {
      mockedUseSelector.mockImplementation(
        mockUseSelector(reduxStateWithCollectibles)
      )
      const actual = useAccessAndRemixSettings({
        isEditableAccessEnabled: true,
        isUpload: true,
        isRemix: false,
        isAlbum: undefined,
        initialStreamConditions: null,
        isInitiallyUnlisted: false,
        isScheduledRelease: false
      })
      const expected = {
        disableUsdcGate: false,
        disableSpecialAccessGate: false,
        disableSpecialAccessGateFields: false,
        disableCollectibleGate: false,
        disableCollectibleGateFields: false,
        disableHidden: false
      }
      expect(actual).toEqual(expected)
    })
    it('should disable collectibles if the user has none', () => {
      const actual = useAccessAndRemixSettings({
        isEditableAccessEnabled: true,
        isUpload: true,
        isRemix: false,
        isAlbum: undefined,
        initialStreamConditions: null,
        isInitiallyUnlisted: false,
        isScheduledRelease: false
      })
      const expected = {
        disableUsdcGate: false,
        disableSpecialAccessGate: false,
        disableSpecialAccessGateFields: false,
        disableCollectibleGate: true,
        disableCollectibleGateFields: true,
        disableHidden: false
      }
      expect(actual).toEqual(expected)
    })
    it('should disable all except hidden for track remixes', () => {
      const actual = useAccessAndRemixSettings({
        isEditableAccessEnabled: true,
        isUpload: true,
        isRemix: true,
        isAlbum: undefined,
        initialStreamConditions: null,
        isInitiallyUnlisted: false,
        isScheduledRelease: false
      })
      const expected = {
        disableUsdcGate: true,
        disableSpecialAccessGate: true,
        disableSpecialAccessGateFields: true,
        disableCollectibleGate: true,
        disableCollectibleGateFields: true,
        disableHidden: false
      }
      expect(actual).toEqual(expected)
    })
  })
  describe('track edit', () => {
    describe('editable access disabled', () => {
      it('public track - should disable all options', () => {
        const actual = useAccessAndRemixSettings({
          isEditableAccessEnabled: false,
          isUpload: false,
          isRemix: false,
          isAlbum: undefined,
          initialStreamConditions: null,
          isInitiallyUnlisted: false,
          isScheduledRelease: false
        })
        const expected = {
          disableUsdcGate: true,
          disableSpecialAccessGate: true,
          disableSpecialAccessGateFields: true,
          disableCollectibleGate: true,
          disableCollectibleGateFields: true,
          disableHidden: true
        }
        expect(actual).toEqual(expected)
      })
      it('scheduled release - should enable everything except hidden', () => {
        mockedUseSelector.mockImplementation(
          mockUseSelector(reduxStateWithCollectibles)
        )
        const actual = useAccessAndRemixSettings({
          isEditableAccessEnabled: false,
          isUpload: false,
          isRemix: false,
          isAlbum: undefined,
          initialStreamConditions: null,
          isInitiallyUnlisted: true,
          isScheduledRelease: true
        })
        const expected = {
          disableUsdcGate: false,
          disableSpecialAccessGate: false,
          disableSpecialAccessGateFields: false,
          disableCollectibleGate: false,
          disableCollectibleGateFields: false,
          disableHidden: true
        }
        expect(actual).toEqual(expected)
      })
      it('follow gated - should disable everything except original parent option & hidden', () => {
        const actual = useAccessAndRemixSettings({
          isEditableAccessEnabled: false,
          isUpload: false,
          isRemix: false,
          isAlbum: undefined,
          initialStreamConditions: mockFollowGateConditions,
          isInitiallyUnlisted: false,
          isScheduledRelease: false
        })
        const expected = {
          disableUsdcGate: true,
          disableSpecialAccessGate: false,
          disableSpecialAccessGateFields: true,
          disableCollectibleGate: true,
          disableCollectibleGateFields: true,
          disableHidden: true
        }
        expect(actual).toEqual(expected)
      })
      it('follow gated - should disable everything except original parent option & hidden', () => {
        const actual = useAccessAndRemixSettings({
          isEditableAccessEnabled: false,
          isUpload: false,
          isRemix: false,
          isAlbum: undefined,
          initialStreamConditions: mockTipGateConditions,
          isInitiallyUnlisted: false,
          isScheduledRelease: false
        })
        const expected = {
          disableUsdcGate: true,
          disableSpecialAccessGate: false,
          disableSpecialAccessGateFields: true,
          disableCollectibleGate: true,
          disableCollectibleGateFields: true,
          disableHidden: true
        }
        expect(actual).toEqual(expected)
      })
      it('collectible gated - should disable everything except original parent option & hidden', () => {
        mockedUseSelector.mockImplementation(
          mockUseSelector(reduxStateWithCollectibles)
        )
        const actual = useAccessAndRemixSettings({
          isEditableAccessEnabled: false,
          isUpload: false,
          isRemix: false,
          isAlbum: undefined,
          initialStreamConditions: mockCollectibleGateConditions,
          isInitiallyUnlisted: false,
          isScheduledRelease: false
        })
        const expected = {
          disableUsdcGate: true,
          disableSpecialAccessGate: true,
          disableSpecialAccessGateFields: true,
          disableCollectibleGate: false,
          disableCollectibleGateFields: true,
          disableHidden: true
        }
        expect(actual).toEqual(expected)
      })
      it('usdc gated - should disable everything except original parent option & hidden', () => {
        mockedUseSelector.mockImplementation(
          mockUseSelector(reduxStateWithCollectibles)
        )
        const actual = useAccessAndRemixSettings({
          isEditableAccessEnabled: false,
          isUpload: false,
          isRemix: false,
          isAlbum: undefined,
          initialStreamConditions: mockUSDCGateConditions,
          isInitiallyUnlisted: false,
          isScheduledRelease: false
        })
        const expected = {
          disableUsdcGate: false,
          disableSpecialAccessGate: true,
          disableSpecialAccessGateFields: true,
          disableCollectibleGate: true,
          disableCollectibleGateFields: true,
          disableHidden: true
        }
        expect(actual).toEqual(expected)
      })
      it('initially hidden - should enable everything', () => {
        mockedUseSelector.mockImplementation(
          mockUseSelector(reduxStateWithCollectibles)
        )
        const actual = useAccessAndRemixSettings({
          isEditableAccessEnabled: false,
          isUpload: false,
          isRemix: false,
          isAlbum: undefined,
          initialStreamConditions: null,
          isInitiallyUnlisted: true,
          isScheduledRelease: false
        })
        const expected = {
          disableUsdcGate: false,
          disableSpecialAccessGate: false,
          disableSpecialAccessGateFields: false,
          disableCollectibleGate: false,
          disableCollectibleGateFields: false,
          disableHidden: false
        }
        expect(actual).toEqual(expected)
      })
    })
    describe('editable access enabled', () => {
      it('public track - should enable all options', () => {
        mockedUseSelector.mockImplementation(
          mockUseSelector(reduxStateWithCollectibles)
        )
        const actual = useAccessAndRemixSettings({
          isEditableAccessEnabled: true,
          isUpload: false,
          isRemix: false,
          isAlbum: undefined,
          initialStreamConditions: null,
          isInitiallyUnlisted: false,
          isScheduledRelease: false
        })
        const expected = {
          disableUsdcGate: false,
          disableSpecialAccessGate: false,
          disableSpecialAccessGateFields: false,
          disableCollectibleGate: false,
          disableCollectibleGateFields: false,
          disableHidden: false
        }
        expect(actual).toEqual(expected)
      })
      it('scheduled release - should enable everything except hidden', () => {
        mockedUseSelector.mockImplementation(
          mockUseSelector(reduxStateWithCollectibles)
        )
        const actual = useAccessAndRemixSettings({
          isEditableAccessEnabled: true,
          isUpload: false,
          isRemix: false,
          isAlbum: undefined,
          initialStreamConditions: null,
          isInitiallyUnlisted: true,
          isScheduledRelease: true
        })
        const expected = {
          disableUsdcGate: false,
          disableSpecialAccessGate: false,
          disableSpecialAccessGateFields: false,
          disableCollectibleGate: false,
          disableCollectibleGateFields: false,
          disableHidden: true
        }
        expect(actual).toEqual(expected)
      })
      it('follow gated - should enable everything', () => {
        mockedUseSelector.mockImplementation(
          mockUseSelector(reduxStateWithCollectibles)
        )
        const actual = useAccessAndRemixSettings({
          isEditableAccessEnabled: true,
          isUpload: false,
          isRemix: false,
          isAlbum: undefined,
          initialStreamConditions: mockFollowGateConditions,
          isInitiallyUnlisted: false,
          isScheduledRelease: false
        })
        const expected = {
          disableUsdcGate: false,
          disableSpecialAccessGate: false,
          disableSpecialAccessGateFields: false,
          disableCollectibleGate: false,
          disableCollectibleGateFields: false,
          disableHidden: false
        }
        expect(actual).toEqual(expected)
      })
      it('tip gated - should enable everything', () => {
        mockedUseSelector.mockImplementation(
          mockUseSelector(reduxStateWithCollectibles)
        )
        const actual = useAccessAndRemixSettings({
          isEditableAccessEnabled: true,
          isUpload: false,
          isRemix: false,
          isAlbum: undefined,
          initialStreamConditions: mockTipGateConditions,
          isInitiallyUnlisted: false,
          isScheduledRelease: false
        })
        const expected = {
          disableUsdcGate: false,
          disableSpecialAccessGate: false,
          disableSpecialAccessGateFields: false,
          disableCollectibleGate: false,
          disableCollectibleGateFields: false,
          disableHidden: false
        }
        expect(actual).toEqual(expected)
      })
      it('collectible gated - should enable everything', () => {
        mockedUseSelector.mockImplementation(
          mockUseSelector(reduxStateWithCollectibles)
        )
        const actual = useAccessAndRemixSettings({
          isEditableAccessEnabled: true,
          isUpload: false,
          isRemix: false,
          isAlbum: undefined,
          initialStreamConditions: mockCollectibleGateConditions,
          isInitiallyUnlisted: false,
          isScheduledRelease: false
        })
        const expected = {
          disableUsdcGate: false,
          disableSpecialAccessGate: false,
          disableSpecialAccessGateFields: false,
          disableCollectibleGate: false,
          disableCollectibleGateFields: false,
          disableHidden: false
        }
        expect(actual).toEqual(expected)
      })
      it('usdc gated - should enable everything', () => {
        mockedUseSelector.mockImplementation(
          mockUseSelector(reduxStateWithCollectibles)
        )
        const actual = useAccessAndRemixSettings({
          isEditableAccessEnabled: true,
          isUpload: false,
          isRemix: false,
          isAlbum: undefined,
          initialStreamConditions: mockUSDCGateConditions,
          isInitiallyUnlisted: false,
          isScheduledRelease: false
        })
        const expected = {
          disableUsdcGate: false,
          disableSpecialAccessGate: false,
          disableSpecialAccessGateFields: false,
          disableCollectibleGate: false,
          disableCollectibleGateFields: false,
          disableHidden: false
        }
        expect(actual).toEqual(expected)
      })
      it('initially hidden - should enablqe everything', () => {
        mockedUseSelector.mockImplementation(
          mockUseSelector(reduxStateWithCollectibles)
        )
        const actual = useAccessAndRemixSettings({
          isEditableAccessEnabled: true,
          isUpload: false,
          isRemix: false,
          isAlbum: undefined,
          initialStreamConditions: null,
          isInitiallyUnlisted: true,
          isScheduledRelease: false
        })
        const expected = {
          disableUsdcGate: false,
          disableSpecialAccessGate: false,
          disableSpecialAccessGateFields: false,
          disableCollectibleGate: false,
          disableCollectibleGateFields: false,
          disableHidden: false
        }
        expect(actual).toEqual(expected)
      })
      it('no collectibles - should enable all options except collectible gated', () => {
        const actual = useAccessAndRemixSettings({
          isEditableAccessEnabled: true,
          isUpload: false,
          isRemix: false,
          isAlbum: undefined,
          initialStreamConditions: null,
          isInitiallyUnlisted: false,
          isScheduledRelease: false
        })
        const expected = {
          disableUsdcGate: false,
          disableSpecialAccessGate: false,
          disableSpecialAccessGateFields: false,
          disableCollectibleGate: true,
          disableCollectibleGateFields: true,
          disableHidden: false
        }
        expect(actual).toEqual(expected)
      })
    })
  })
  describe('album upload', () => {
    it('should allow usdc & hidden for album uploads', () => {
      const actual = useAccessAndRemixSettings({
        isEditableAccessEnabled: true,
        isUpload: true,
        isRemix: false,
        isAlbum: true,
        initialStreamConditions: null,
        isInitiallyUnlisted: false,
        isScheduledRelease: false
      })
      const expected = {
        disableUsdcGate: false,
        disableSpecialAccessGate: true,
        disableSpecialAccessGateFields: true,
        disableCollectibleGate: true,
        disableCollectibleGateFields: true,
        disableHidden: true
      }
      expect(actual).toEqual(expected)
    })
  })
  describe('album edit', () => {
    describe('editable access disabled', () => {
      it('public track - should disable all other options', () => {
        const actual = useAccessAndRemixSettings({
          isEditableAccessEnabled: false,
          isUpload: false,
          isRemix: false,
          isAlbum: true,
          initialStreamConditions: null,
          isInitiallyUnlisted: false,
          isScheduledRelease: false
        })
        const expected = {
          disableUsdcGate: true,
          disableSpecialAccessGate: true,
          disableSpecialAccessGateFields: true,
          disableCollectibleGate: true,
          disableCollectibleGateFields: true,
          disableHidden: true
        }
        expect(actual).toEqual(expected)
      })
      it('usdc gated - should only allow usdc + public', () => {
        mockedUseSelector.mockImplementation(
          mockUseSelector(reduxStateWithCollectibles)
        )
        const actual = useAccessAndRemixSettings({
          isEditableAccessEnabled: false,
          isUpload: false,
          isRemix: false,
          isAlbum: true,
          initialStreamConditions: mockUSDCGateConditions,
          isInitiallyUnlisted: false,
          isScheduledRelease: false
        })
        const expected = {
          disableUsdcGate: false,
          disableSpecialAccessGate: true,
          disableSpecialAccessGateFields: true,
          disableCollectibleGate: true,
          disableCollectibleGateFields: true,
          disableHidden: true
        }
        expect(actual).toEqual(expected)
      })
      it('initially hidden - should enable everything', () => {
        mockedUseSelector.mockImplementation(
          mockUseSelector(reduxStateWithCollectibles)
        )
        const actual = useAccessAndRemixSettings({
          isEditableAccessEnabled: false,
          isUpload: false,
          isRemix: false,
          isAlbum: true,
          initialStreamConditions: null,
          isInitiallyUnlisted: true,
          isScheduledRelease: false
        })
        const expected = {
          disableUsdcGate: false,
          disableSpecialAccessGate: true,
          disableSpecialAccessGateFields: true,
          disableCollectibleGate: true,
          disableCollectibleGateFields: true,
          disableHidden: true
        }
        expect(actual).toEqual(expected)
      })
    })
    describe('editable access enabled', () => {
      it('public track - should enable usdc + public', () => {
        mockedUseSelector.mockImplementation(
          mockUseSelector(reduxStateWithCollectibles)
        )
        const actual = useAccessAndRemixSettings({
          isEditableAccessEnabled: true,
          isUpload: false,
          isRemix: false,
          isAlbum: true,
          initialStreamConditions: null,
          isInitiallyUnlisted: false,
          isScheduledRelease: false
        })
        const expected = {
          disableUsdcGate: false,
          disableSpecialAccessGate: true,
          disableSpecialAccessGateFields: true,
          disableCollectibleGate: true,
          disableCollectibleGateFields: true,
          disableHidden: true
        }
        expect(actual).toEqual(expected)
      })
      it('usdc gated - should enable usdc + public', () => {
        const actual = useAccessAndRemixSettings({
          isEditableAccessEnabled: true,
          isUpload: false,
          isRemix: false,
          isAlbum: true,
          initialStreamConditions: mockUSDCGateConditions,
          isInitiallyUnlisted: false,
          isScheduledRelease: false
        })
        const expected = {
          disableUsdcGate: false,
          disableSpecialAccessGate: true,
          disableSpecialAccessGateFields: true,
          disableCollectibleGate: true,
          disableCollectibleGateFields: true,
          disableHidden: true
        }
        expect(actual).toEqual(expected)
      })
      it('initially hidden - should enable usdc + public', () => {
        mockedUseSelector.mockImplementation(
          mockUseSelector(reduxStateWithCollectibles)
        )
        const actual = useAccessAndRemixSettings({
          isEditableAccessEnabled: true,
          isUpload: false,
          isRemix: false,
          isAlbum: true,
          initialStreamConditions: null,
          isInitiallyUnlisted: true,
          isScheduledRelease: false
        })
        const expected = {
          disableUsdcGate: false,
          disableSpecialAccessGate: true,
          disableSpecialAccessGateFields: true,
          disableCollectibleGate: true,
          disableCollectibleGateFields: true,
          disableHidden: true
        }
        expect(actual).toEqual(expected)
      })
    })
  })
})
