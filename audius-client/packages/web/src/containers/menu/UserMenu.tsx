import React from 'react'
import { Dispatch } from 'redux'
import { ID } from 'models/common/Identifiers'
import { connect } from 'react-redux'
import { push as pushRoute } from 'connected-react-router'
import { profilePage } from 'utils/route'

import * as socialActions from 'store/social/users/actions'

import CascadingMenu from 'components/navigation/CascadingMenu'
import { FollowSource, ShareSource } from 'services/analytics'

export type OwnProps = {
  children?: JSX.Element
  type: 'user'
  mount?: string
  handle: string
  userId: ID
  currentUserFollows: boolean
}

export type UserMenuProps = OwnProps & ReturnType<typeof mapDispatchToProps>

const Menu = (props: UserMenuProps) => {
  const getMenu = () => {
    const {
      handle,
      userId,
      currentUserFollows,
      shareUser,
      unFollowUser,
      followUser,
      goToRoute
    } = props

    const shareMenuItem = {
      text: 'Share',
      onClick: () => {
        shareUser(userId)
      }
    }

    const followMenuItem = {
      text: currentUserFollows ? 'Unfollow' : 'Follow',
      onClick: () =>
        currentUserFollows ? unFollowUser(userId) : followUser(userId)
    }

    const artistPageMenuItem = {
      text: 'Visit Artist Page',
      onClick: () => goToRoute(profilePage(handle))
    }

    const menu = {
      items: [shareMenuItem, followMenuItem, artistPageMenuItem]
    }
    return menu
  }

  const menu = getMenu()

  return (
    <CascadingMenu menu={menu} mount={props.mount}>
      {props.children}
    </CascadingMenu>
  )
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    goToRoute: (route: string) => dispatch(pushRoute(route)),
    shareUser: (userId: ID) =>
      dispatch(socialActions.shareUser(userId, ShareSource.OVERFLOW)),
    followUser: (userId: ID) =>
      dispatch(socialActions.followUser(userId, FollowSource.OVERFLOW)),
    unFollowUser: (userId: ID) =>
      dispatch(socialActions.followUser(userId, FollowSource.OVERFLOW))
  }
}

Menu.defaultProps = {
  handle: '',
  mount: 'page',
  currentUserFollows: false
}

export default connect(null, mapDispatchToProps)(Menu)
