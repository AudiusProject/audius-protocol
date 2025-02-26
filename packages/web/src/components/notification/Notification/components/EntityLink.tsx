import { MouseEventHandler, useCallback } from 'react'

import { Name, Collection, Track, User } from '@audius/common/models'
import { Entity } from '@audius/common/store'
import { Nullable } from '@audius/common/utils'
import { useDispatch } from 'react-redux'

import { make, useRecord } from 'common/store/analytics/actions'
import { closeNotificationPanel } from 'store/application/ui/notifications/notificationsUISlice'
import { push } from 'utils/navigation'

import { getEntityLink } from '../utils'

import styles from './EntityLink.module.css'

type EntityType = (Collection | Track) & { user: Nullable<User> }

type EntityLinkProps = {
  entity: EntityType
  entityType: Entity
}

export const useGoToEntity = (
  entity: Nullable<EntityType>,
  entityType: Entity,
  goToComments?: boolean
) => {
  const dispatch = useDispatch()
  const record = useRecord()

  const handleClick: MouseEventHandler = useCallback(
    (event) => {
      if (!entity) return
      event.stopPropagation()
      event.preventDefault()
      let link = getEntityLink(entity)
      if (goToComments) {
        link = `${link}?showComments=true`
      }
      dispatch(closeNotificationPanel())
      dispatch(push(link))
      record(
        make(Name.NOTIFICATIONS_CLICK_TILE, {
          kind: entityType,
          link_to: link
        })
      )
    },
    [dispatch, entity, entityType, goToComments, record]
  )
  return handleClick
}

export const EntityLink = (props: EntityLinkProps) => {
  const { entity, entityType } = props
  const title = 'playlist_id' in entity ? entity.playlist_name : entity.title

  const handleClick = useGoToEntity(entity, entityType)

  return (
    <a className={styles.link} onClick={handleClick}>
      {title}
    </a>
  )
}
