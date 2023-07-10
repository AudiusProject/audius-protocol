import { useCallback, useMemo } from 'react'

import {
  Chain,
  collectiblesSelectors,
  TrackAvailabilityType
} from '@audius/common'
import { useField } from 'formik'
import { useSelector } from 'react-redux'

import DropdownInput from 'components/data-entry/DropdownInput'
import { HelpCallout } from 'components/help-callout/HelpCallout'

import {
  AVAILABILITY_TYPE,
  PREMIUM_CONDITIONS,
  TrackAvailabilityFormValues
} from '../../../forms/TrackAvailabilityModalForm'

import styles from './CollectibleGatedFields.module.css'

const { getSupportedUserCollections, getHasUnsupportedCollection } =
  collectiblesSelectors

const messages = {
  pickACollection: 'Pick a Collection',
  compatibilityTitle: "Not seeing what you're looking for?",
  compatibilitySubtitle:
    'Unverified Solana NFT Collections are not compatible at this time.'
}

type CollectibleGatedFieldsProps = {
  disabled: boolean
}

export const CollectibleGatedFields = ({
  disabled
}: CollectibleGatedFieldsProps) => {
  const [, , { setValue: setAvailabilityValue }] = useField({
    name: AVAILABILITY_TYPE
  })
  const [
    { value: premiumConditionsValue },
    ,
    { setValue: setPremiumConditionsValue }
  ] =
    useField<TrackAvailabilityFormValues[typeof PREMIUM_CONDITIONS]>(
      PREMIUM_CONDITIONS
    )

  const { ethCollectionMap, solCollectionMap } = useSelector(
    getSupportedUserCollections
  )
  const hasUnsupportedCollection = useSelector(getHasUnsupportedCollection)

  const ethCollectibleItems = useMemo(() => {
    return Object.keys(ethCollectionMap)
      .sort((s1, s2) =>
        ethCollectionMap[s1].name.localeCompare(ethCollectionMap[s2].name)
      )
      .map((slug) => ({
        text: ethCollectionMap[slug].name,
        el: (
          <div className={styles.dropdownRow}>
            {ethCollectionMap[slug].img ? (
              <img
                src={ethCollectionMap[slug].img!}
                alt={ethCollectionMap[slug].name}
              />
            ) : null}
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
            {solCollectionMap[mint].img ? (
              <img
                src={solCollectionMap[mint].img!}
                alt={solCollectionMap[mint].name}
              />
            ) : null}
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

  // If no nft collection was previously selected, then the default value is an empty string,
  // which makes the dropdown show the placeholder.
  // Otherwise, the default value is the nft collection which was previously selected,
  // which also includes the collection image.
  const defaultCollectionName =
    premiumConditionsValue?.nft_collection?.name ?? ''
  const defaultCollection = menuItems.find(
    (item) => item.text === defaultCollectionName
  )
  const defaultValue = defaultCollection || defaultCollectionName

  const renderFooter = useCallback(() => {
    return hasUnsupportedCollection ? (
      <HelpCallout
        className={styles.helpCallout}
        content={
          <div>
            <div>{messages.compatibilityTitle}</div>
            <div>{messages.compatibilitySubtitle}</div>
          </div>
        }
      />
    ) : null
  }, [hasUnsupportedCollection])

  return (
    <div className={styles.root}>
      <DropdownInput
        aria-label={messages.pickACollection}
        placeholder={messages.pickACollection}
        mount={null}
        popupContainer={(triggerNode: HTMLElement) =>
          // hack to escape the collapsible container which has overflow: hidden
          // maintains scrollability, unlike `mount={'page'}
          triggerNode.parentNode?.parentNode?.parentNode
        }
        menu={{ items: menuItems }}
        defaultValue={defaultValue}
        onSelect={(value: string) => {
          if (ethCollectionMap[value]) {
            setPremiumConditionsValue({
              nft_collection: {
                chain: Chain.Eth,
                standard: ethCollectionMap[value].standard,
                address: ethCollectionMap[value].address,
                name: ethCollectionMap[value].name,
                imageUrl: ethCollectionMap[value].img,
                externalLink: ethCollectionMap[value].externalLink,
                slug: value
              }
            })
            setAvailabilityValue(TrackAvailabilityType.COLLECTIBLE_GATED)
          } else if (solCollectionMap[value]) {
            setPremiumConditionsValue({
              nft_collection: {
                chain: Chain.Sol,
                address: value,
                name: solCollectionMap[value].name,
                imageUrl: solCollectionMap[value].img,
                externalLink: solCollectionMap[value].externalLink
              }
            })
            setAvailabilityValue(TrackAvailabilityType.COLLECTIBLE_GATED)
          }
        }}
        size='large'
        dropdownStyle={styles.dropdown}
        dropdownInputStyle={styles.dropdownInput}
        footer={renderFooter()}
        disabled={disabled}
      />
    </div>
  )
}
