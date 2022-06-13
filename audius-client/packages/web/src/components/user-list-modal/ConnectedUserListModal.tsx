import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import {
  getUserListType,
  getIsOpen
} from 'store/application/ui/userListModal/selectors'
import { setVisibility } from 'store/application/ui/userListModal/slice'
import { AppState } from 'store/types'

import UserListModal from './components/UserListModal'

type ConnectedUserListModalProps = ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>

const ConnectedUserListModal = ({
  userListType,
  isOpen,
  onClose
}: ConnectedUserListModalProps) => {
  return (
    <UserListModal
      userListType={userListType}
      isOpen={isOpen}
      onClose={onClose}
    />
  )
}

function mapStateToProps(state: AppState) {
  return {
    userListType: getUserListType(state),
    isOpen: getIsOpen(state)
  }
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    onClose: () => dispatch(setVisibility(false))
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ConnectedUserListModal)
