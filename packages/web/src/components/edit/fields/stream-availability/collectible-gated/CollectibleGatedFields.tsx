import { useMemo } from 'react'

import { imageCollectiblePlaceholder } from '@audius/common/assets'
import {
  AccessConditions,
  Chain,
  StreamTrackAvailabilityType,
  isContentCollectibleGated
} from '@audius/common/models'
import { collectiblesSelectors } from '@audius/common/store'
import { Nullable } from '@audius/common/utils'
import { Box, Hint, IconInfo } from '@audius/harmony'
import { useField } from 'formik'
import { useSelector } from 'react-redux'

import DropdownInput from 'components/ai-attribution-modal/DropdownInput'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'

import {
  AccessAndSaleFormValues,
  DOWNLOAD_CONDITIONS,
  GateKeeper,
  LAST_GATE_KEEPER,
  STREAM_AVAILABILITY_TYPE,
  STREAM_CONDITIONS
} from '../../types'

import styles from './CollectibleGatedFields.module.css'

const { getSupportedUserCollections } = collectiblesSelectors

const messages = {
  loading: 'Loading...',
  pickACollection: 'Pick a Collection',
  premiumDownloads:
    'Setting your track to Collectible Gated will remove the availability you set on your premium downloads. Don’t worry, your stems are still saved!'
}

type CollectibleGatedFieldsProps = {
  disabled: boolean
}

export const CollectibleGatedFields = (props: CollectibleGatedFieldsProps) => {
  const { disabled } = props
  const [, , { setValue: setAvailabilityValue }] = useField({
    name: STREAM_AVAILABILITY_TYPE
  })
  const [
    { value: streamConditionsValue },
    ,
    { setValue: setStreamConditionsValue }
  ] =
    useField<AccessAndSaleFormValues[typeof STREAM_CONDITIONS]>(
      STREAM_CONDITIONS
    )
  const [{ value: downloadConditions }] =
    useField<Nullable<AccessConditions>>(DOWNLOAD_CONDITIONS)
  const [{ value: lastGateKeeper }] = useField<GateKeeper>(LAST_GATE_KEEPER)
  const showPremiumDownloadsMessage =
    downloadConditions && lastGateKeeper.access === 'stemsAndDownloads'

  const { ethCollectionMap, solCollectionMap, isLoading } = useSelector(
    getSupportedUserCollections
  )

  const ethCollectibleItems = useMemo(() => {
    return Object.keys(ethCollectionMap)
      .sort((s1, s2) =>
        ethCollectionMap[s1].name.localeCompare(ethCollectionMap[s2].name)
      )
      .map((slug) => ({
        text: ethCollectionMap[slug].name,
        el: (
          <div className={styles.dropdownRow}>
            <img
              src={ethCollectionMap[slug].img || imageCollectiblePlaceholder}
              alt={ethCollectionMap[slug].name}
            />
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
            <img
              src={solCollectionMap[mint].img || imageCollectiblePlaceholder}
              alt={solCollectionMap[mint].name}
            />
            <span>{solCollectionMap[mint].name}</span>
          </div>
        ),
        value: mint
      }))
  }, [solCollectionMap])

  const menuItems: {
    text: string
    el: React.ReactElement
    value: string
    disabled?: boolean
  }[] = useMemo(() => {
    if (isLoading)
      return [
        {
          text: messages.loading,
          el: (
            <div className={styles.dropdownRow}>
              <LoadingSpinner className={styles.spinner} />
              <span>{messages.loading}</span>
            </div>
          ),
          value: 'loading',
          disabled: true
        }
      ]
    return [...ethCollectibleItems, ...solCollectibleItems]
  }, [ethCollectibleItems, isLoading, solCollectibleItems])

  // If no nft collection was previously selected, then the default value is an empty string,
  // which makes the dropdown show the placeholder.
  // Otherwise, the default value is the nft collection which was previously selected,
  // which also includes the collection image.
  const defaultCollectionName = isContentCollectibleGated(streamConditionsValue)
    ? (streamConditionsValue.nft_collection?.name ?? '')
    : ''
  const selectedCollection = menuItems.find(
    (item) => item.text === defaultCollectionName
  )
  const value = selectedCollection || defaultCollectionName

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
            setAvailabilityValue(StreamTrackAvailabilityType.COLLECTIBLE_GATED)
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
            setAvailabilityValue(StreamTrackAvailabilityType.COLLECTIBLE_GATED)
          }
        }}
        size='large'
        dropdownStyle={styles.dropdown}
        dropdownInputStyle={styles.dropdownInput}
        disabled={disabled}
      />
      {showPremiumDownloadsMessage ? (
        <Box mt='l'>
          <Hint icon={IconInfo}>{messages.premiumDownloads}</Hint>
        </Box>
      ) : null}
    </div>
  )
}
