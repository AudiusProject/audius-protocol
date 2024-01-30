import {
  profilePageActions,
  usersSocialActions as socialActions
} from '@audius/common'
import { FollowSource, ID } from '@audius/common/models'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import { AppState } from 'store/types'

import UnfollowConfirmationModal from './components/UnfollowConfirmationModal'
import * as actions from './store/actions'
import { getIsOpen, getUserId } from './store/selectors'
const { setNotificationSubscription } = profilePageActions

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
          /* update */ false
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
