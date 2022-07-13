import { MouseEventHandler, useCallback } from 'react'

import { push } from 'connected-react-router'
import { useDispatch } from 'react-redux'

import { Name } from 'common/models/Analytics'
import { Collection } from 'common/models/Collection'
import { Track } from 'common/models/Track'
import { User } from 'common/models/User'
import { Entity } from 'common/store/notifications/types'
import { useRecord, make } from 'store/analytics/actions'

import { getEntityLink } from '../utils'

import styles from './EntityLink.module.css'

type EntityType = (Collection | Track) & { user: User }

type EntityLinkProps = {
  entity: EntityType
  entityType: Entity
}

export const useGoToEntity = (entity: EntityType, entityType: Entity) => {
  const dispatch = useDispatch()
  const record = useRecord()

  const handleClick: MouseEventHandler = useCallback(
    (event) => {
      event.stopPropagation()
      event.preventDefault()
      const link = getEntityLink(entity)
      dispatch(push(link))
      record(
        make(Name.NOTIFICATIONS_CLICK_TILE, {
          kind: entityType,
          link_to: link
        })
      )
    },
    [dispatch, entity, entityType, record]
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
