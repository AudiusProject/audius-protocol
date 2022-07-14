import { ID } from '@audius/common'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import { FollowSource } from 'common/models/Analytics'
import { setNotificationSubscription } from 'common/store/pages/profile/actions'
import * as socialActions from 'common/store/social/users/actions'
import { AppState } from 'store/types'

import UnfollowConfirmationModal from './components/UnfollowConfirmationModal'
import * as actions from './store/actions'
import { getIsOpen, getUserId } from './store/selectors'

type UnfollowConfirmationModalProps = ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>

// A modal that asks the user to confirm an unfollow.
const ConnectedUnfollowConfirmationModal = ({
  isOpen,
  userId,
  onClose,
  onUnfollow
}: UnfollowConfirmationModalProps) => {
  return (
    <UnfollowConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      unfollowUser={onUnfollow}
      userId={userId || -1}
    />
  )
}

function mapStateToProps(state: AppState) {
  return {
    isOpen: getIsOpen(state),
    userId: getUserId(state)
  }
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    onUnfollow: (id: ID) => {
      dispatch(socialActions.unfollowUser(id, FollowSource.USER_LIST))
      dispatch(
        setNotificationSubscription(
          id,
          /** isSubscribed */ false,
          /* update */ true
        )
      )
    },
    onClose: () => dispatch(actions.setClosed())
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ConnectedUnfollowConfirmationModal)
