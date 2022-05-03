import React, { MouseEventHandler, useCallback } from 'react'

import cn from 'classnames'
import { push } from 'connected-react-router'
import { useDispatch } from 'react-redux'

import { Name } from 'common/models/Analytics'
import { User } from 'common/models/User'
import { toggleNotificationPanel } from 'common/store/notifications/actions'
import { Notification } from 'common/store/notifications/types'
import ArtistPopover from 'components/artist/ArtistPopover'
import UserBadges from 'components/user-badges/UserBadges'
import { make, useRecord } from 'store/analytics/actions'
import { isMobile } from 'utils/clientUtil'
import { profilePage } from 'utils/route'

import styles from './UserNameLink.module.css'

const messages = {
  deactivated: 'Deactivated'
}

type UserNameLinkProps = {
  notification: Notification
  user: User
}

export const UserNameLink = ({ notification, user }: UserNameLinkProps) => {
  const dispatch = useDispatch()

  const record = useRecord()
  const { type } = notification
  const { handle, user_id, name, is_deactivated } = user

  const profileLink = profilePage(handle)

  const handleClick: MouseEventHandler = useCallback(
    event => {
      event.stopPropagation()
      event.preventDefault()
      dispatch(toggleNotificationPanel())
      dispatch(push(profilePage(handle)))
      record(
        make(Name.NOTIFICATIONS_CLICK_TILE, {
          kind: type,
          link_to: profileLink
        })
      )
    },
    [dispatch, handle, record, type, profileLink]
  )

  if (is_deactivated) {
    return (
      <span className={cn(styles.root, styles.deactivated)}>
        {name} [{messages.deactivated}]
      </span>
    )
  }

  let userNameElement = (
    <span className={styles.root}>
      <a onClick={handleClick} href={profileLink} className={styles.link}>
        {name}
      </a>
      <UserBadges
        inline
        userId={user_id}
        badgeSize={12}
        className={styles.badges}
      />
    </span>
  )

  if (!isMobile()) {
    userNameElement = (
      <ArtistPopover handle={handle}>{userNameElement}</ArtistPopover>
    )
  }

  return userNameElement
}
