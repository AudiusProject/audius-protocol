import { useCallback } from 'react'

import { RepostSource, Collection, ID } from '@audius/common/models'
import {
  collectionPageSelectors,
  collectionsSocialActions,
  CommonState
} from '@audius/common/store'
import { ButtonProps, ButtonType, IconRepost } from '@audius/stems'
import { useDispatch, useSelector } from 'react-redux'

import { Tooltip } from 'components/tooltip'

import { EntityActionButton } from '../../entity-page/EntityActionButton'

const { getCollection } = collectionPageSelectors
const { repostCollection, undoRepostCollection } = collectionsSocialActions

const messages = {
  reposted: 'Reposted',
  repost: 'Repost',
  unrepost: 'Unrepost'
}

type RepostButtonProps = Partial<ButtonProps> & {
  collectionId: ID
}

export const RepostButton = (props: RepostButtonProps) => {
  const { collectionId, type, ...other } = props
  const dispatch = useDispatch()

  const { has_current_user_reposted } =
    (useSelector((state: CommonState) =>
      getCollection(state, { id: collectionId })
    ) as Collection) ?? {}

  const handleRepost = useCallback(() => {
    if (has_current_user_reposted) {
      dispatch(undoRepostCollection(collectionId, RepostSource.COLLECTION_PAGE))
    } else {
      dispatch(repostCollection(collectionId, RepostSource.COLLECTION_PAGE))
    }
  }, [has_current_user_reposted, dispatch, collectionId])

  return (
    <Tooltip
      text={has_current_user_reposted ? messages.unrepost : messages.repost}
    >
      <EntityActionButton
        type={
          type ??
          (has_current_user_reposted ? ButtonType.SECONDARY : ButtonType.COMMON)
        }
        text={has_current_user_reposted ? messages.reposted : messages.repost}
        leftIcon={<IconRepost />}
        onClick={handleRepost}
        {...other}
      />
    </Tooltip>
  )
}
