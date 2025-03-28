import { useUnfollowUser, useFollowUser } from '@audius/common/api'
import { ShareSource, FollowSource, ID } from '@audius/common/models'
import { shareModalUIActions } from '@audius/common/store'
import { route } from '@audius/common/utils'
import { PopupMenuItem } from '@audius/harmony'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import { push } from 'utils/navigation'

const { profilePage } = route

const { requestOpen: requestOpenShareModal } = shareModalUIActions

export type OwnProps = {
  children: (items: PopupMenuItem[]) => JSX.Element
  currentUserFollows: boolean
  handle: string
  type: 'user'
  userId: ID
}

type UserMenuProps = OwnProps & ReturnType<typeof mapDispatchToProps>

const Menu = ({
  handle = '',
  currentUserFollows = false,
  ...props
}: UserMenuProps) => {
  const { mutate: followUser } = useFollowUser()
  const { mutate: unfollowUser } = useUnfollowUser()

  const getMenu = () => {
    const { userId, shareUser, goToRoute } = props

    const shareMenuItem = {
      text: 'Share',
      onClick: () => {
        shareUser(userId)
      }
    }

    const followMenuItem = {
      text: currentUserFollows ? 'Unfollow' : 'Follow',
      onClick: () =>
        currentUserFollows
          ? unfollowUser({
              followeeUserId: userId,
              source: FollowSource.OVERFLOW
            })
          : followUser({
              followeeUserId: userId,
              source: FollowSource.OVERFLOW
            })
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
    goToRoute: (route: string) => dispatch(push(route)),
    shareUser: (userId: ID) => {
      dispatch(
        requestOpenShareModal({
          type: 'profile',
          profileId: userId,
          source: ShareSource.OVERFLOW
        })
      )
    }
  }
}

export default connect(null, mapDispatchToProps)(Menu)
