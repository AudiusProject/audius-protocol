import { useMemo } from 'react'

import {
  Chain,
  collectiblesSelectors,
  TrackAvailabilityType
} from '@audius/common'
import { IconArrow, IconCollectible } from '@audius/stems'
import cn from 'classnames'
import { useSelector } from 'react-redux'

import { ReactComponent as IconQuestionCircle } from 'assets/img/iconQuestionCircle.svg'
import DropdownInput from 'components/data-entry/DropdownInput'

import styles from './TrackAvailabilityModal.module.css'
import { TrackAvailabilitySelectionProps } from './types'

const { getVerifiedUserCollections } = collectiblesSelectors

const LEARN_MORE_URL =
  'https://blog.audius.co/article/introducing-nft-collectible-gated-content'

const messages = {
  collectibleGated: 'Collectible Gated',
  collectibleGatedSubtitle:
    'Users who own a digital collectible matching your selection will have access to your track. Collectible gated content does not appear on trending or in user feeds.',
  learnMore: 'Learn More',
  pickACollection: 'Pick a Collection',
  noCollectibles:
    'No Collectibles found. To enable this option, link a wallet containing a collectible.'
}

export const CollectibleGatedAvailability = ({
  selected,
  state,
  onStateUpdate,
  disabled = false
}: TrackAvailabilitySelectionProps) => {
  const { ethCollectionMap, solCollectionMap } = useSelector(
    getVerifiedUserCollections
  )
  const numEthCollectibles = Object.keys(ethCollectionMap).length
  const numSolCollectibles = Object.keys(solCollectionMap).length
  const hasNoCollectibles = numEthCollectibles + numSolCollectibles === 0

  const ethCollectibleItems = useMemo(() => {
    return Object.keys(ethCollectionMap)
      .sort((s1, s2) =>
        ethCollectionMap[s1].name.localeCompare(ethCollectionMap[s2].name)
      )
      .map((slug) => ({
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

  const solCollectibleItems = useMemo(() => {
    return Object.keys(solCollectionMap)
      .sort((m1, m2) =>
        solCollectionMap[m1].name.localeCompare(solCollectionMap[m2].name)
      )
      .map((mint) => ({
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
    <div>
      <div
        className={cn(styles.availabilityRowTitle, {
          [styles.selected]: selected,
          [styles.disabled]: disabled
        })}
      >
        <IconCollectible className={styles.availabilityRowIcon} />
        <span>{messages.collectibleGated}</span>
      </div>
      <div className={styles.availabilityRowDescription}>
        {messages.collectibleGatedSubtitle}
      </div>
      {hasNoCollectibles && (
        <div className={styles.noCollectibles}>
          <IconQuestionCircle className={styles.noCollectibleIcon} />
          <div className={styles.noCollectibleText}>
            {messages.noCollectibles}
          </div>
        </div>
      )}
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
            defaultValue={state.premium_conditions?.nft_collection?.name ?? ''}
            onSelect={(value: string) => {
              if (ethCollectionMap[value]) {
                onStateUpdate(
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
                  TrackAvailabilityType.COLLECTIBLE_GATED
                )
              } else if (solCollectionMap[value]) {
                onStateUpdate(
                  {
                    nft_collection: {
                      chain: Chain.Sol,
                      address: value,
                      name: solCollectionMap[value].name,
                      imageUrl: solCollectionMap[value].img,
                      externalLink: solCollectionMap[value].externalLink
                    }
                  },
                  TrackAvailabilityType.COLLECTIBLE_GATED
                )
              }
            }}
            size='large'
            dropdownStyle={styles.dropdown}
            dropdownInputStyle={styles.dropdownInput}
            disabled={disabled}
          />
        </div>
      )}
    </div>
  )
}
