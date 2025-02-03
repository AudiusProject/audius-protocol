import { useState } from 'react'

import { ID, SquareSizes } from '@audius/common/models'
import {
  accountSelectors,
  cacheCollectionsSelectors,
  cacheUsersSelectors
} from '@audius/common/store'
import { Flex, IconKebabHorizontal } from '@audius/harmony'
import cn from 'classnames'
import { useSelector } from 'react-redux'

import { CollectionImage } from 'components/collection/CollectionImage'
import { CollectionLink } from 'components/link/CollectionLink'
import { UserLink } from 'components/link/UserLink'
import { CollectionMenuProps } from 'components/menu/CollectionMenu'
import Menu from 'components/menu/Menu'
import PerspectiveCard from 'components/perspective-card/PerspectiveCard'
import { FavoriteStats } from 'components/stats/FavoriteStats'
import { RepostStats } from 'components/stats/RepostStats'
import { UserListEntityType } from 'store/application/ui/userListModal/types'
import { AppState } from 'store/types'

type CollectionArtCardProps = {
  id: ID
}

export const CollectionArtCard = ({ id }: CollectionArtCardProps) => {
  const [isPerspectiveDisabled, setIsPerspectiveDisabled] = useState(false)

  const collection = useSelector((state: AppState) =>
    cacheCollectionsSelectors.getCollection(state, { id })
  )
  const user = useSelector((state: AppState) =>
    cacheUsersSelectors.getUserFromCollection(state, { id })
  )

  if (!collection || !user) return null

  const { playlist_id, playlist_name } = collection
  const { user_id } = user

  return (
    <Flex column alignItems='center' gap='s'>
      <PerspectiveCard
        onClick={() => setIsPerspectiveDisabled(false)}
        isDisabled={isPerspectiveDisabled}
      >
        <CollectionImage
          collectionId={id}
          size={SquareSizes.SIZE_480_BY_480}
          h={240}
          w={240}
        />
      </PerspectiveCard>
      <Flex column gap='xs' alignItems='center'>
        <CollectionLink collectionId={id} textVariant='title' size='l'>
          {playlist_name}
        </CollectionLink>
        <UserLink
          userId={user_id}
          popover
          textVariant='title'
          strength='weak'
        />
      </Flex>
      <Flex gap='m'>
        <RepostStats
          id={playlist_id}
          entityType={UserListEntityType.COLLECTION}
          noText
        />
        <FavoriteStats
          id={playlist_id}
          entityType={UserListEntityType.COLLECTION}
          noText
        />
      </Flex>
    </Flex>
  )
}
