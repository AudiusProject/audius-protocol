import { ShareSource, FollowSource, ID } from '@audius/common/models'
import {
  usersSocialActions as socialActions,
  shareModalUIActions
} from '@audius/common/store'
import { PopupMenuItem } from '@audius/harmony'
import { push as pushRoute } from 'connected-react-router'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import { profilePage } from 'utils/route'

const { requestOpen: requestOpenShareModal } = shareModalUIActions

export type OwnProps = {
  children: (items: PopupMenuItem[]) => JSX.Element
  currentUserFollows: boolean
  handle: string
  type: 'user'
  userId: ID
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

  return props.children(menu.items)
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    goToRoute: (route: string) => dispatch(pushRoute(route)),
    shareUser: (userId: ID) => {
      dispatch(
        requestOpenShareModal({
          type: 'profile',
          profileId: userId,
          source: ShareSource.OVERFLOW
        })
      )
    },
    followUser: (userId: ID) =>
      dispatch(socialActions.followUser(userId, FollowSource.OVERFLOW)),
    unFollowUser: (userId: ID) =>
      dispatch(socialActions.unfollowUser(userId, FollowSource.OVERFLOW))
  }
}

Menu.defaultProps = {
  handle: '',
  mount: 'page',
  currentUserFollows: false
}

export default connect(null, mapDispatchToProps)(Menu)
