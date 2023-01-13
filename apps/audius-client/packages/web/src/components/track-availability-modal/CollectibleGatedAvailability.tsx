import { useMemo } from 'react'

import {
  Chain,
  TokenStandard,
  accountSelectors,
  collectiblesSelectors,
  CommonState,
  Collectible,
  Nullable
} from '@audius/common'
import { IconArrow, IconCollectible } from '@audius/stems'
import cn from 'classnames'
import { useSelector } from 'react-redux'

import DropdownInput from 'components/data-entry/DropdownInput'

import styles from './TrackAvailabilityModal.module.css'
import { AvailabilityType, TrackAvailabilitySelectionProps } from './types'

const { getUserId } = accountSelectors
const { getUserCollectibles, getSolCollections } = collectiblesSelectors

const LEARN_MORE_URL = ''

const defaultCollectibles = { [Chain.Eth]: [], [Chain.Sol]: [] }

const messages = {
  collectibleGated: 'Collectible Gated',
  collectibleGatedSubtitle:
    'Collectible gated content can only be accessed by users with linked wallets containing a collectible from the specified collection. These tracks do not appear on trending or in user feeds.',
  learnMore: 'Learn More',
  pickACollection: 'Pick a Collection'
}

type EthCollectionMap = {
  [slug: string]: {
    name: string
    address: string
    standard: TokenStandard
    img: Nullable<string>
    externalLink: Nullable<string>
  }
}

type SolCollectionMap = {
  [mint: string]: {
    name: string
    img: Nullable<string>
    externalLink: Nullable<string>
  }
}

export const CollectibleGatedAvailability = ({
  selected,
  metadataState,
  updatePremiumContentFields
}: TrackAvailabilitySelectionProps) => {
  const accountUserId = useSelector(getUserId)
  const collectibles =
    useSelector((state: CommonState) => {
      if (!accountUserId) return defaultCollectibles
      return getUserCollectibles(state, { id: accountUserId })
    }) ?? defaultCollectibles
  const solCollections = useSelector(getSolCollections)

  // Ethereum collections
  const ethCollectionMap: EthCollectionMap = useMemo(() => {
    const map: EthCollectionMap = {}

    collectibles[Chain.Eth].forEach((collectible) => {
      const {
        collectionSlug,
        collectionName,
        collectionImageUrl,
        assetContractAddress,
        standard,
        externalLink
      } = collectible
      if (
        !collectionName ||
        !collectionSlug ||
        !assetContractAddress ||
        !standard ||
        map[collectionSlug]
      ) {
        return
      }
      map[collectionSlug] = {
        name: collectionName,
        img: collectionImageUrl,
        address: assetContractAddress,
        standard,
        externalLink
      }
    })

    return map
  }, [collectibles])

  const ethCollectibleItems = useMemo(() => {
    return Object.keys(ethCollectionMap).map((slug) => ({
      text: ethCollectionMap[slug].name,
      el: (
        <div className={styles.dropdownRow}>
          {!!ethCollectionMap[slug].img && (
            <img
              src={ethCollectionMap[slug].img!}
              alt={ethCollectionMap[slug].name}
            />
          )}
          <span>{ethCollectionMap[slug].name}</span>
        </div>
      ),
      value: slug
    }))
  }, [ethCollectionMap])

  // Solana collections
  const solCollectionMap: SolCollectionMap = useMemo(() => {
    const map: SolCollectionMap = {}

    const validSolCollectionMints = [
      ...new Set(
        (collectibles[Chain.Sol] ?? [])
          .filter(
            (collectible: Collectible) =>
              !!collectible.solanaChainMetadata?.collection?.verified
          )
          .map((collectible: Collectible) => {
            const key = collectible.solanaChainMetadata!.collection!.key
            return typeof key === 'string' ? key : key.toBase58()
          })
      )
    ]
    validSolCollectionMints.forEach((mint) => {
      const { data, imageUrl } = solCollections[mint] ?? {}
      if (!data?.name || map[data.name]) return
      map[mint] = {
        name: data.name.replaceAll('\x00', ''),
        img: imageUrl ?? null,
        externalLink: null
      }
    })

    return map
  }, [collectibles, solCollections])

  const solCollectibleItems = useMemo(() => {
    return Object.keys(solCollectionMap).map((mint) => ({
      text: solCollectionMap[mint].name,
      el: (
        <div className={styles.dropdownRow}>
          {!!solCollectionMap[mint].img && (
            <img
              src={solCollectionMap[mint].img!}
              alt={solCollectionMap[mint].name}
            />
          )}
          <span>{solCollectionMap[mint].name}</span>
        </div>
      ),
      value: mint
    }))
  }, [solCollectionMap])

  const menuItems = useMemo(
    () => [...ethCollectibleItems, ...solCollectibleItems],
    [ethCollectibleItems, solCollectibleItems]
  )

  return (
    <div className={cn(styles.radioItem, { [styles.selected]: selected })}>
      <div
        className={styles.availabilityRowContent}
        onClick={() => {
          if (updatePremiumContentFields) {
            updatePremiumContentFields(null, AvailabilityType.COLLECTIBLE_GATED)
          }
        }}
      >
        <div className={styles.availabilityRowTitle}>
          <IconCollectible className={styles.availabilityRowIcon} />
          <span>{messages.collectibleGated}</span>
        </div>
        <div className={styles.availabilityRowDescription}>
          {messages.collectibleGatedSubtitle}
        </div>
        <div
          className={styles.learnMore}
          onClick={() => window.open(LEARN_MORE_URL, '_blank')}
        >
          <span>{messages.learnMore}</span>
          <IconArrow className={styles.learnMoreArrow} />
        </div>
        {selected && (
          <div
            className={cn(
              styles.availabilityRowSelection,
              styles.collectibleGated
            )}
          >
            <DropdownInput
              aria-label={messages.pickACollection}
              placeholder={messages.pickACollection}
              mount='parent'
              menu={{ items: menuItems }}
              defaultValue={
                metadataState.premium_conditions?.nft_collection?.name ?? ''
              }
              onSelect={(value: string) => {
                if (!updatePremiumContentFields) return

                if (ethCollectionMap[value]) {
                  updatePremiumContentFields(
                    {
                      nft_collection: {
                        chain: Chain.Eth,
                        standard: ethCollectionMap[value].standard,
                        address: ethCollectionMap[value].address,
                        name: ethCollectionMap[value].name,
                        imageUrl: ethCollectionMap[value].img,
                        externalLink: ethCollectionMap[value].externalLink,
                        slug: value
                      }
                    },
                    AvailabilityType.COLLECTIBLE_GATED
                  )
                } else if (solCollectionMap[value]) {
                  updatePremiumContentFields(
                    {
                      nft_collection: {
                        chain: Chain.Sol,
                        address: value,
                        name: solCollectionMap[value].name,
                        imageUrl: solCollectionMap[value].img,
                        externalLink: solCollectionMap[value].externalLink
                      }
                    },
                    AvailabilityType.COLLECTIBLE_GATED
                  )
                }
              }}
              size='large'
              dropdownStyle={styles.dropdown}
              dropdownInputStyle={styles.dropdownInput}
            />
          </div>
        )}
      </div>
    </div>
  )
}
