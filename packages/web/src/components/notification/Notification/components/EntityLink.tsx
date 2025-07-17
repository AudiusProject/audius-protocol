import { MouseEventHandler, useCallback } from 'react'

import {
  Name,
  User,
  TrackMetadata,
  CollectionMetadata
} from '@audius/common/models'
import { Entity, useNotificationModal } from '@audius/common/store'
import { Nullable } from '@audius/common/utils'
import { useDispatch } from 'react-redux'

import { make, useRecord } from 'common/store/analytics/actions'
import { push } from 'utils/navigation'

import { getEntityLink } from '../utils'

import styles from './EntityLink.module.css'

type EntityType = (CollectionMetadata | TrackMetadata) & {
  user: Nullable<User>
}

type EntityLinkProps = {
  entity: EntityType
  entityType: Entity
}

export const useGoToEntity = (
  entity: Nullable<EntityType>,
  entityType: Entity,
  goToComments?: boolean,
  commentId?: string
) => {
  const dispatch = useDispatch()
  const record = useRecord()
  const { onClose } = useNotificationModal()

  const handleClick: MouseEventHandler = useCallback(
    (event) => {
      if (!entity) return
      event.stopPropagation()
      event.preventDefault()
      const link = getEntityLink(entity)
      const urlParams = new URLSearchParams(link)
      if (commentId) {
        urlParams.set('commentId', commentId)
      } else if (goToComments) {
        urlParams.set('showComments', 'true')
      }
      const newLink = `${link}?${urlParams.toString()}`

      onClose()
      dispatch(push(newLink))
      record(
        make(Name.NOTIFICATIONS_CLICK_TILE, {
          kind: entityType,
          link_to: link
        })
      )
    },
    [commentId, dispatch, entity, entityType, goToComments, onClose, record]
  )
  return handleClick
}

export const EntityLink = (props: EntityLinkProps) => {
  const { entity, entityType } = props
  const title = entity
    ? 'playlist_id' in entity
      ? entity.playlist_name
      : entity.title
    : ''

  const handleClick = useGoToEntity(entity, entityType)

  return (
    <a className={styles.link} onClick={handleClick}>
      {title}
    </a>
  )
}
