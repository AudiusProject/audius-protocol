import { useCollectionMetadata } from '@audius/common/hooks'
import type { ID } from '@audius/common/models'

import { Flex, Text } from '@audius/harmony-native'

import { MetadataItem } from './MetadataItem'

type CollectionMetadataProps = {
  collectionId: ID
}

/**
 * The additional metadata shown at the bottom of the Collection Screen Header
 */
export const CollectionMetadataList = ({
  collectionId
}: CollectionMetadataProps) => {
  const metadataItems = useCollectionMetadata({ collectionId })

  return (
    <Flex gap='l' w='100%' direction='row' wrap='wrap'>
      {metadataItems.map(({ label, id, value }) => (
        <MetadataItem key={id} label={label}>
          <Text variant='body' size='s' strength='strong'>
            {value}
          </Text>
        </MetadataItem>
      ))}
    </Flex>
  )
}
