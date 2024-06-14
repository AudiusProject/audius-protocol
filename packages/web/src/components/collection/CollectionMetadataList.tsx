import { useCollectionMetadata } from '@audius/common/hooks'
import { ID } from '@audius/common/models'
import { Flex } from '@audius/harmony'

import { MetadataItem } from 'components/track/MetadataItem'

type CollectionMetadataListProps = {
  collectionId: ID
}

export const CollectionMetadataList = ({
  collectionId
}: CollectionMetadataListProps) => {
  const metadataItems = useCollectionMetadata({ collectionId })

  return (
    <Flex as='dt' direction='row' gap='l' wrap='wrap'>
      {metadataItems.map(({ label, value }) => (
        <MetadataItem key={label} label={label}>
          {value}
        </MetadataItem>
      ))}
    </Flex>
  )
}
