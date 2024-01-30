import { useMemo } from 'react'

import { collectiblesSelectors } from '@audius/common'
import {
  Chain,
  isContentCollectibleGated,
  TrackAvailabilityType
} from '@audius/common/models'
import { useField } from 'formik'
import { useSelector } from 'react-redux'

import DropdownInput from 'components/ai-attribution-modal/DropdownInput'
import { HelpCallout } from 'components/help-callout/HelpCallout'

import {
  AccessAndSaleFormValues,
  AVAILABILITY_TYPE,
  STREAM_CONDITIONS
} from '../../AccessAndSaleField'

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

export const CollectibleGatedFields = (props: CollectibleGatedFieldsProps) => {
  const { disabled } = props
  const [, , { setValue: setAvailabilityValue }] = useField({
    name: AVAILABILITY_TYPE
  })
  const [
    { value: streamConditionsValue },
    ,
    { setValue: setStreamConditionsValue }
  ] =
    useField<AccessAndSaleFormValues[typeof STREAM_CONDITIONS]>(
      STREAM_CONDITIONS
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
  const defaultCollectionName = isContentCollectibleGated(streamConditionsValue)
    ? streamConditionsValue.nft_collection?.name ?? ''
    : ''
  const selectedCollection = menuItems.find(
    (item) => item.text === defaultCollectionName
  )
  const value = selectedCollection || defaultCollectionName
  const renderFooter = () => {
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
  }

  return (
    <div className={styles.root}>
      <DropdownInput
        label={messages.pickACollection}
        placeholder={messages.pickACollection}
        menu={{ items: menuItems }}
        value={value}
        onSelect={(value: string) => {
          if (ethCollectionMap[value]) {
            setStreamConditionsValue({
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
            setStreamConditionsValue({
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
