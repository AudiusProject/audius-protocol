import { useCallback, useMemo } from 'react'

import { Chain, isContentCollectibleGated } from '@audius/common/models'
import type { AccessConditions } from '@audius/common/models'
import { collectiblesSelectors } from '@audius/common/store'
import type { Nullable } from '@audius/common/utils'
import { useField } from 'formik'
import { View, Image } from 'react-native'
import { useSelector } from 'react-redux'

import { IconImage, Button } from '@audius/harmony-native'
import { Text } from 'app/components/core'
import { useNavigation } from 'app/hooks/useNavigation'
import { ListSelectionScreen } from 'app/screens/list-selection-screen'
import { makeStyles, typography } from 'app/styles'

const messages = {
  collections: 'COLLECTIONS',
  searchCollections: 'Search Collections',
  done: 'Done'
}

const { getSupportedUserCollections } = collectiblesSelectors

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
  const [{ value: streamConditions }, , { setValue: setStreamConditions }] =
    useField<Nullable<AccessConditions>>('stream_conditions')
  const { isLoading, ethCollectionMap, solCollectionMap, collectionImageMap } =
    useSelector(getSupportedUserCollections)

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
    if (!isContentCollectibleGated(streamConditions)) return ''
    if (Chain.Eth === streamConditions?.nft_collection?.chain) {
      return streamConditions.nft_collection.slug
    }
    if (Chain.Sol === streamConditions?.nft_collection?.chain) {
      return streamConditions.nft_collection.address
    }
    return ''
  }, [streamConditions])

  const handleChange = useCallback(
    (value: string) => {
      if (ethCollectionMap[value]) {
        setStreamConditions({
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
        setStreamConditions({
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
    [setStreamConditions, ethCollectionMap, solCollectionMap]
  )

  const handleSubmit = useCallback(() => {
    if (isContentCollectibleGated(streamConditions)) {
      navigation.goBack()
    }
  }, [streamConditions, navigation])

  return (
    <ListSelectionScreen
      data={data}
      renderItem={renderItem}
      screenTitle={messages.collections}
      icon={IconImage}
      value={value}
      onChange={handleChange}
      searchText={messages.searchCollections}
      isLoading={isLoading}
      allowDeselect={false}
      itemStyles={styles.row}
      itemContentStyles={styles.row}
      bottomSection={
        <Button
          variant='primary'
          fullWidth
          onPress={handleSubmit}
          disabled={!isContentCollectibleGated(streamConditions)}
        >
          {messages.done}
        </Button>
      }
    />
  )
}
