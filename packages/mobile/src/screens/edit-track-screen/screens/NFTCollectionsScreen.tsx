import { useCallback, useMemo } from 'react'

import type { Nullable, PremiumConditions } from '@audius/common'
import {
  Chain,
  collectiblesSelectors,
  isPremiumContentCollectibleGated
} from '@audius/common'
import { useField } from 'formik'
import { View, Image } from 'react-native'
import { useSelector } from 'react-redux'

import IconImage from 'app/assets/images/iconImage.svg'
import { Button, Text } from 'app/components/core'
import { HelpCallout } from 'app/components/help-callout/HelpCallout'
import { useNavigation } from 'app/hooks/useNavigation'
import { makeStyles, typography } from 'app/styles'

import { ListSelectionScreen } from './ListSelectionScreen'

const messages = {
  collections: 'COLLECTIONS',
  searchCollections: 'Search Collections',
  compatibilityTitle: "Not seeing what you're looking for?",
  compatibilitySubtitle:
    'Unverified Solana NFT Collections are not compatible at this time.',
  done: 'Done'
}

const { getSupportedUserCollections, getHasUnsupportedCollection } =
  collectiblesSelectors

const useStyles = makeStyles(({ spacing, palette }) => ({
  item: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  logo: {
    marginRight: spacing(3),
    borderWidth: 1,
    borderColor: palette.neutralLight8,
    borderRadius: spacing(1),
    width: spacing(8),
    height: spacing(8)
  },
  collectionName: {
    fontFamily: typography.fontByWeight.demiBold,
    fontSize: typography.fontSize.large,
    width: spacing(50)
  },
  row: {
    alignItems: 'center'
  },
  unsupported: {
    marginTop: spacing(8)
  }
}))

export const NFTCollectionsScreen = () => {
  const styles = useStyles()
  const navigation = useNavigation()
  const [{ value: premiumConditions }, , { setValue: setPremiumConditions }] =
    useField<Nullable<PremiumConditions>>('premium_conditions')
  const { ethCollectionMap, solCollectionMap, collectionImageMap } =
    useSelector(getSupportedUserCollections)
  const hasUnsupportedCollection = useSelector(getHasUnsupportedCollection)

  const ethCollectibleItems = useMemo(() => {
    return Object.keys(ethCollectionMap)
      .sort((s1, s2) =>
        ethCollectionMap[s1].name.localeCompare(ethCollectionMap[s2].name)
      )
      .map((slug) => ({
        label: ethCollectionMap[slug].name,
        value: slug
      }))
  }, [ethCollectionMap])

  const solCollectibleItems = useMemo(() => {
    return Object.keys(solCollectionMap)
      .sort((m1, m2) =>
        solCollectionMap[m1].name.localeCompare(solCollectionMap[m2].name)
      )
      .map((mint) => ({
        label: solCollectionMap[mint].name,
        value: mint
      }))
  }, [solCollectionMap])

  const data = useMemo(
    () => [...ethCollectibleItems, ...solCollectibleItems],
    [ethCollectibleItems, solCollectibleItems]
  )

  const renderItem = useCallback(
    ({ item }) => {
      const { label: name, value: identifier } = item
      const imageUrl = collectionImageMap[identifier]
      return (
        <View style={styles.item}>
          {imageUrl && <Image source={{ uri: imageUrl }} style={styles.logo} />}
          <Text style={styles.collectionName} numberOfLines={1}>
            {name}
          </Text>
        </View>
      )
    },
    [collectionImageMap, styles]
  )

  const value = useMemo(() => {
    if (!isPremiumContentCollectibleGated(premiumConditions)) return ''
    if (Chain.Eth === premiumConditions?.nft_collection?.chain) {
      return premiumConditions.nft_collection.slug
    }
    if (Chain.Sol === premiumConditions?.nft_collection?.chain) {
      return premiumConditions.nft_collection.address
    }
    return ''
  }, [premiumConditions])

  const handleChange = useCallback(
    (value: string) => {
      if (ethCollectionMap[value]) {
        setPremiumConditions({
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
      } else if (solCollectionMap[value]) {
        setPremiumConditions({
          nft_collection: {
            chain: Chain.Sol,
            address: value,
            name: solCollectionMap[value].name,
            imageUrl: solCollectionMap[value].img,
            externalLink: solCollectionMap[value].externalLink
          }
        })
      }
    },
    [setPremiumConditions, ethCollectionMap, solCollectionMap]
  )

  const handleSubmit = useCallback(() => {
    if (isPremiumContentCollectibleGated(premiumConditions)) {
      navigation.goBack()
    }
  }, [premiumConditions, navigation])

  const renderFooter = useCallback(() => {
    return hasUnsupportedCollection ? (
      <HelpCallout
        style={styles.unsupported}
        content={
          <View>
            <Text>{messages.compatibilityTitle}</Text>
            <Text>{messages.compatibilitySubtitle}</Text>
          </View>
        }
      />
    ) : null
  }, [hasUnsupportedCollection, styles])

  return (
    <ListSelectionScreen
      data={data}
      renderItem={renderItem}
      screenTitle={messages.collections}
      icon={IconImage}
      value={value}
      onChange={handleChange}
      searchText={messages.searchCollections}
      allowDeselect={false}
      itemStyles={styles.row}
      itemContentStyles={styles.row}
      bottomSection={
        <Button
          variant='primary'
          size='large'
          fullWidth
          title={messages.done}
          onPress={handleSubmit}
          disabled={!isPremiumContentCollectibleGated(premiumConditions)}
        />
      }
      footer={renderFooter()}
    />
  )
}
